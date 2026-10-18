import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { db, repairDatabaseRelations } from '@/db/utils';
import { getCurrentAppVersion } from './updateService';

// Storage Keys
const KEY_TOKEN = 'hango_auth_token';
const KEY_USER = 'hango_auth_user';
const KEY_SERVER_URL = 'hango_server_url';
const KEY_LAST_SYNC = 'hango_last_sync';

// Default backend deployment on Vercel
export const PRODUCTION_SERVER_URL = 'https://hangobackend.vercel.app';

// Candidate backend URLs
const CANDIDATE_URLS = [
  PRODUCTION_SERVER_URL,
  'http://localhost:3000',
  'http://192.168.1.104:3000',
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000',
];

let cachedWorkingUrl: string | null = null;

export interface User {
  id: string;
  email: string;
  username: string;
  appVersion?: string;
  platform?: string;
}

export interface SyncStats {
  hsksCount: number;
  lessonsCount: number;
  textsCount: number;
  sentencesCount: number;
  wordsCount: number;
  charactersCount: number;
  rulesCount: number;
}

export interface SyncStatusResult {
  hasBackup: boolean;
  updatedAt?: string;
  stats?: SyncStats;
}

export async function getServerUrl(): Promise<string> {
  if (cachedWorkingUrl) return cachedWorkingUrl;

  const custom = await AsyncStorage.getItem(KEY_SERVER_URL);
  // If user set a custom URL that isn't one of the legacy local development URLs, use it
  if (
    custom &&
    custom !== 'http://localhost:5000' &&
    custom !== 'http://192.168.1.104:5000' &&
    custom !== 'http://localhost:3000'
  ) {
    cachedWorkingUrl = custom;
    return custom;
  }

  // Fast path: Default to the live Vercel cloud server
  cachedWorkingUrl = PRODUCTION_SERVER_URL;
  return PRODUCTION_SERVER_URL;
}

export async function setServerUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, '');
  cachedWorkingUrl = clean;
  await AsyncStorage.setItem(KEY_SERVER_URL, clean);
}

export async function checkServerHealth(): Promise<{ ok: boolean; message?: string }> {
  try {
    const baseUrl = await getServerUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      return { ok: true };
    }
    return { ok: false, message: `Server returned status ${res.status}` };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Cannot reach server' };
  }
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_TOKEN);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getLastSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_LAST_SYNC);
}

export async function registerAccount(
  email: string,
  username: string,
  password: string
): Promise<{ user: User; token: string }> {
  const baseUrl = await getServerUrl();
  const appVersion = getCurrentAppVersion();
  const platform = Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : 'web';

  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password, appVersion, platform }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  await AsyncStorage.setItem(KEY_TOKEN, data.token);
  await AsyncStorage.setItem(KEY_USER, JSON.stringify(data.user));

  return { user: data.user, token: data.token };
}

export async function loginAccount(
  identifier: string,
  password: string
): Promise<{ user: User; token: string }> {
  const baseUrl = await getServerUrl();
  const appVersion = getCurrentAppVersion();
  const platform = Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : 'web';

  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password, appVersion, platform }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }

  await AsyncStorage.setItem(KEY_TOKEN, data.token);
  await AsyncStorage.setItem(KEY_USER, JSON.stringify(data.user));

  return { user: data.user, token: data.token };
}

export async function logoutAccount(): Promise<void> {
  await AsyncStorage.removeItem(KEY_TOKEN);
  await AsyncStorage.removeItem(KEY_USER);
}

export async function fetchSyncStatus(): Promise<SyncStatusResult> {
  const token = await getStoredToken();
  if (!token) throw new Error('Not logged in');

  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/api/sync/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    await logoutAccount();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to check sync status');
  }

  return data;
}

/**
 * Backup all local SQLite data to user's MongoDB account
 */
export async function backupDataToCloud(
  onProgress?: (step: string, percent: number) => void
): Promise<{ stats: SyncStats; updatedAt: string }> {
  const token = await getStoredToken();
  if (!token) throw new Error('Please log in before synchronizing.');

  onProgress?.('Reading local study data...', 15);

  const hsks = db.getAllSync('SELECT * FROM hsks');
  const lessons = db.getAllSync('SELECT * FROM lessons');
  const texts = db.getAllSync('SELECT * FROM texts');
  const sentences = db.getAllSync('SELECT * FROM sentences');
  const words = db.getAllSync('SELECT * FROM words');
  const characters = db.getAllSync('SELECT * FROM characters');
  const rules = db.getAllSync('SELECT * FROM rules');

  // Read junction tables if they exist
  let junctions: Record<string, any[]> = {};
  const junctionTableNames = [
    'word_hsks',
    'word_lessons',
    'word_texts',
    'word_sentences',
    'rule_words',
    'rule_characters',
  ];

  for (const tName of junctionTableNames) {
    try {
      const rows = db.getAllSync(`SELECT * FROM ${tName}`);
      junctions[tName] = rows;
    } catch {
      junctions[tName] = [];
    }
  }

  onProgress?.('Connecting to MongoDB Cloud...', 45);

  const baseUrl = await getServerUrl();
  const payload = {
    hsks,
    lessons,
    texts,
    sentences,
    words,
    characters,
    rules,
    junctions,
    appVersion: getCurrentAppVersion(),
  };

  onProgress?.('Uploading to MongoDB Atlas...', 70);

  const res = await fetch(`${baseUrl}/api/sync/backup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    await logoutAccount();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Backup upload failed');
  }

  const timeStr = data.updatedAt || new Date().toISOString();
  await AsyncStorage.setItem(KEY_LAST_SYNC, timeStr);

  onProgress?.('Cloud backup completed successfully!', 100);
  return { stats: data.stats, updatedAt: timeStr };
}

/**
 * Restore study data from MongoDB account to local SQLite
 */
export async function restoreDataFromCloud(
  onProgress?: (step: string, percent: number) => void
): Promise<{ stats: SyncStats; updatedAt: string }> {
  const token = await getStoredToken();
  if (!token) throw new Error('Please log in before restoring.');

  onProgress?.('Fetching cloud backup from MongoDB...', 25);

  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}/api/sync/restore`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    await logoutAccount();
    throw new Error('Session expired. Please log in again.');
  }

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || 'Failed to download cloud backup');
  }

  if (!result.data) {
    throw new Error('No backup data found for this account.');
  }

  onProgress?.('Applying study data to local database...', 60);

  const { data } = result;

  db.withTransactionSync(() => {
    // 1. Clear existing rows in proper foreign-key cascade order
    try {
      db.runSync('DELETE FROM rule_characters');
      db.runSync('DELETE FROM rule_words');
      db.runSync('DELETE FROM word_sentences');
      db.runSync('DELETE FROM word_texts');
      db.runSync('DELETE FROM word_lessons');
      db.runSync('DELETE FROM word_hsks');
    } catch {
      // junction tables might not exist or empty
    }

    db.runSync('DELETE FROM rules');
    db.runSync('DELETE FROM characters');
    db.runSync('DELETE FROM words');
    db.runSync('DELETE FROM sentences');
    db.runSync('DELETE FROM texts');
    db.runSync('DELETE FROM lessons');
    db.runSync('DELETE FROM hsks');

    // 2. Re-insert HSKs
    if (Array.isArray(data.hsks)) {
      for (const h of data.hsks) {
        db.runSync('INSERT OR REPLACE INTO hsks (id, name) VALUES (?, ?)', h.id, h.name);
      }
    }

    // 3. Re-insert Lessons
    if (Array.isArray(data.lessons)) {
      for (const l of data.lessons) {
        db.runSync(
          'INSERT OR REPLACE INTO lessons (id, num, title, hskId) VALUES (?, ?, ?, ?)',
          l.id,
          l.num,
          l.title,
          l.hskId
        );
      }
    }

    // 4. Re-insert Texts
    if (Array.isArray(data.texts)) {
      for (const t of data.texts) {
        db.runSync(
          `INSERT OR REPLACE INTO texts (id, hskId, lessonId, title, content, pinyin, meaning)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          t.id,
          t.hskId ?? null,
          t.lessonId ?? null,
          t.title,
          t.content,
          t.pinyin ?? null,
          t.meaning ?? null
        );
      }
    }

    // 5. Re-insert Sentences
    if (Array.isArray(data.sentences)) {
      for (const s of data.sentences) {
        db.runSync(
          `INSERT OR REPLACE INTO sentences (id, hskId, lessonId, textId, content, pinyin, meaning)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          s.id,
          s.hskId ?? null,
          s.lessonId ?? null,
          s.textId ?? null,
          s.content,
          s.pinyin ?? null,
          s.meaning ?? null
        );
      }
    }

    // 6. Re-insert Words
    if (Array.isArray(data.words)) {
      for (const w of data.words) {
        db.runSync(
          `INSERT OR REPLACE INTO words (id, hskId, lessonId, textId, sentenceId, content, pinyin, meaning)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          w.id,
          w.hskId ?? null,
          w.lessonId ?? null,
          w.textId ?? null,
          w.sentenceId ?? null,
          w.content,
          w.pinyin ?? null,
          w.meaning ?? null
        );
      }
    }

    // 7. Re-insert Characters
    if (Array.isArray(data.characters)) {
      for (const c of data.characters) {
        db.runSync(
          `INSERT OR REPLACE INTO characters (id, hskId, lessonId, textId, sentenceId, wordId, content, pinyin, tone, meaning)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          c.id,
          c.hskId ?? null,
          c.lessonId ?? null,
          c.textId ?? null,
          c.sentenceId ?? null,
          c.wordId ?? null,
          c.content,
          c.pinyin ?? null,
          c.tone ?? null,
          c.meaning ?? null
        );
      }
    }

    // 8. Re-insert Rules
    if (Array.isArray(data.rules)) {
      for (const r of data.rules) {
        db.runSync(
          `INSERT OR REPLACE INTO rules (id, hskId, lessonId, textId, sentenceId, wordId, content)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          r.id,
          r.hskId ?? null,
          r.lessonId ?? null,
          r.textId ?? null,
          r.sentenceId ?? null,
          r.wordId ?? null,
          r.content
        );
      }
    }

    // 9. Re-insert Junctions if present
    if (data.junctions && typeof data.junctions === 'object') {
      for (const [table, rows] of Object.entries(data.junctions)) {
        if (!Array.isArray(rows)) continue;
        for (const row of rows) {
          try {
            const keys = Object.keys(row);
            const vals = Object.values(row) as any[];
            const placeholders = keys.map(() => '?').join(',');
            db.runSync(
              `INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`,
              ...vals
            );
          } catch {
            // Ignore if junction schema differs
          }
        }
      }
    }
  });

  // Repair relations to guarantee foreign-key sync
  try {
    repairDatabaseRelations();
  } catch (err) {
    console.warn('repairDatabaseRelations error after restore:', err);
  }

  const timeStr = result.updatedAt || new Date().toISOString();
  await AsyncStorage.setItem(KEY_LAST_SYNC, timeStr);

  onProgress?.('Local database successfully updated from Cloud!', 100);
  return { stats: result.stats, updatedAt: timeStr };
}

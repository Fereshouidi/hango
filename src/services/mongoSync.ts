/**
 * mongoSync.ts
 * -----------
 * Sync service for HanGo ↔ MongoDB Atlas (via the Atlas Data API REST endpoint).
 *
 * How to get your Data API URL & Key:
 *   1. Go to https://cloud.mongodb.com → your project → "App Services"
 *   2. Create or open an App → "Data API" tab
 *   3. Enable it, choose your cluster, then copy the "App ID" and create an API key.
 *   4. The endpoint URL is: https://data.mongodb-api.com/app/<APP_ID>/endpoint/data/v1
 *
 * Database: hango
 * Collections: hsks, lessons, texts, sentences, words, characters, rules
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAllHSKs,
  getAllLessons,
  getAllTexts,
  getAllSentences,
  getAllWords,
  getAllCharacters,
  getAllRules,
  db,
} from '@/db/utils';
import {
  HSKType,
  LessonType,
  TextType,
  SentenceType,
  WordType,
  CharacterType,
  RuleType,
} from '@/types';

// ─── Storage Keys ────────────────────────────────────────────────────────────
const STORAGE_KEY_ENDPOINT = 'mongo_api_endpoint';
const STORAGE_KEY_API_KEY = 'mongo_api_key';
const STORAGE_KEY_LAST_SYNC = 'mongo_last_sync';

// ─── Config helpers ───────────────────────────────────────────────────────────
export interface MongoConfig {
  endpoint: string; // e.g. https://data.mongodb-api.com/app/<APP_ID>/endpoint/data/v1
  apiKey: string;
}

export async function saveMongoConfig(config: MongoConfig): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_ENDPOINT, config.endpoint.trim());
  await AsyncStorage.setItem(STORAGE_KEY_API_KEY, config.apiKey.trim());
}

export async function loadMongoConfig(): Promise<MongoConfig | null> {
  const endpoint = await AsyncStorage.getItem(STORAGE_KEY_ENDPOINT);
  const apiKey = await AsyncStorage.getItem(STORAGE_KEY_API_KEY);
  if (!endpoint || !apiKey) return null;
  return { endpoint, apiKey };
}

export async function getLastSyncTime(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY_LAST_SYNC);
}

async function setLastSyncTime(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
}

// ─── Low-level Atlas Data API helpers ────────────────────────────────────────
const DATABASE = 'hango';

async function atlasRequest(
  endpoint: string,
  apiKey: string,
  action: string,
  body: object
): Promise<any> {
  const url = `${endpoint}/action/${action}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({ dataSource: 'Cluster0', database: DATABASE, ...body }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Atlas API error ${response.status}: ${text}`);
  }
  return response.json();
}

// Delete all docs in a collection then insert the batch
async function replaceCollection(
  endpoint: string,
  apiKey: string,
  collection: string,
  docs: object[]
): Promise<void> {
  // Delete existing
  await atlasRequest(endpoint, apiKey, 'deleteMany', {
    collection,
    filter: {},
  });

  if (docs.length === 0) return;

  // Insert in chunks of 100 to stay within request size limits
  const CHUNK = 100;
  for (let i = 0; i < docs.length; i += CHUNK) {
    await atlasRequest(endpoint, apiKey, 'insertMany', {
      collection,
      documents: docs.slice(i, i + CHUNK),
    });
  }
}

// Fetch all docs from a collection
async function fetchCollection(
  endpoint: string,
  apiKey: string,
  collection: string
): Promise<any[]> {
  const result = await atlasRequest(endpoint, apiKey, 'find', {
    collection,
    filter: {},
    sort: { id: 1 },
    limit: 10000,
  });
  return result?.documents ?? [];
}

// ─── Progress callback type ───────────────────────────────────────────────────
export type SyncProgressCallback = (step: string, progress: number, total: number) => void;

// ─── BACKUP: SQLite → MongoDB ─────────────────────────────────────────────────
export async function backupToMongoDB(
  config: MongoConfig,
  onProgress?: SyncProgressCallback
): Promise<void> {
  const { endpoint, apiKey } = config;

  const collections: Array<{ name: string; data: () => object[] }> = [
    { name: 'hsks', data: () => (getAllHSKs() as HSKType[]) || [] },
    { name: 'lessons', data: () => (getAllLessons() as LessonType[]) || [] },
    { name: 'texts', data: () => (getAllTexts() as TextType[]) || [] },
    { name: 'sentences', data: () => (getAllSentences() as SentenceType[]) || [] },
    { name: 'words', data: () => (getAllWords() as WordType[]) || [] },
    {
      name: 'characters',
      data: () => (getAllCharacters() as CharacterType[]) || [],
    },
    { name: 'rules', data: () => (getAllRules() as RuleType[]) || [] },
  ];

  const total = collections.length;

  for (let i = 0; i < collections.length; i++) {
    const col = collections[i];
    onProgress?.(col.name, i, total);
    const docs = col.data();
    await replaceCollection(endpoint, apiKey, col.name, docs);
  }

  await setLastSyncTime();
  onProgress?.('done', total, total);
}

// ─── RESTORE: MongoDB → SQLite ────────────────────────────────────────────────
export async function restoreFromMongoDB(
  config: MongoConfig,
  onProgress?: SyncProgressCallback
): Promise<void> {
  const { endpoint, apiKey } = config;

  const collectionNames = [
    'hsks',
    'lessons',
    'texts',
    'sentences',
    'words',
    'characters',
    'rules',
  ];

  const total = collectionNames.length;
  const fetched: Record<string, any[]> = {};

  // Fetch all from MongoDB first
  for (let i = 0; i < collectionNames.length; i++) {
    const col = collectionNames[i];
    onProgress?.(col, i, total * 2);
    fetched[col] = await fetchCollection(endpoint, apiKey, col);
  }

  // Now write into SQLite using a transaction
  onProgress?.('writing to device', total, total * 2);

  db.withTransactionSync(() => {
    // Clear all tables (order matters for foreign keys)
    db.runSync('DELETE FROM rules');
    db.runSync('DELETE FROM characters');
    db.runSync('DELETE FROM words');
    db.runSync('DELETE FROM sentences');
    db.runSync('DELETE FROM texts');
    db.runSync('DELETE FROM lessons');
    db.runSync('DELETE FROM hsks');

    // Re-insert hsks
    for (const row of (fetched.hsks || []) as HSKType[]) {
      db.runSync(
        'INSERT OR REPLACE INTO hsks (id, name) VALUES (?, ?)',
        row.id, row.name
      );
    }

    // Re-insert lessons
    for (const row of (fetched.lessons || []) as LessonType[]) {
      db.runSync(
        'INSERT OR REPLACE INTO lessons (id, num, title, hskId) VALUES (?, ?, ?, ?)',
        row.id, row.num, row.title, row.hskId
      );
    }

    // Re-insert texts
    for (const row of (fetched.texts || []) as TextType[]) {
      db.runSync(
        'INSERT OR REPLACE INTO texts (id, hskId, lessonId, title, content, pinyin, meaning) VALUES (?, ?, ?, ?, ?, ?, ?)',
        row.id, row.hskId ?? null, row.lessonId ?? null,
        row.title, row.content, row.pinyin, row.meaning
      );
    }

    // Re-insert sentences
    for (const row of (fetched.sentences || []) as SentenceType[]) {
      db.runSync(
        'INSERT OR REPLACE INTO sentences (id, hskId, lessonId, textId, content, pinyin, meaning) VALUES (?, ?, ?, ?, ?, ?, ?)',
        row.id, row.hskId ?? null, row.lessonId ?? null, row.textId ?? null,
        row.content, row.pinyin, row.meaning
      );
    }

    // Re-insert words
    for (const row of (fetched.words || []) as WordType[]) {
      db.runSync(
        'INSERT OR REPLACE INTO words (id, hskId, lessonId, textId, sentenceId, content, pinyin, meaning) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        row.id, row.hskId ?? null, row.lessonId ?? null,
        row.textId ?? null, row.sentenceId ?? null,
        row.content, row.pinyin, row.meaning
      );
    }

    // Re-insert characters
    for (const row of (fetched.characters || []) as CharacterType[]) {
      db.runSync(
        'INSERT OR REPLACE INTO characters (id, hskId, lessonId, textId, sentenceId, wordId, content, pinyin, tone, meaning) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        row.id, row.hskId ?? null, row.lessonId ?? null,
        row.textId ?? null, row.sentenceId ?? null, row.wordId ?? null,
        row.content, row.pinyin, row.tone, row.meaning
      );
    }

    // Re-insert rules
    for (const row of (fetched.rules || []) as RuleType[]) {
      db.runSync(
        'INSERT OR REPLACE INTO rules (id, hskId, lessonId, textId, sentenceId, wordId, content) VALUES (?, ?, ?, ?, ?, ?, ?)',
        row.id, row.hskId ?? null, row.lessonId ?? null,
        row.textId ?? null, row.sentenceId ?? null, row.wordId ?? null, row.content
      );
    }
  });

  await setLastSyncTime();
  onProgress?.('done', total * 2, total * 2);
}

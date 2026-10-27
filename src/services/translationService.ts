import { db } from '@/db/utils';

/**
 * Searches the local database for existing definitions of words, characters, or sentences.
 */
export function findLocalMeaning(text: string): string | null {
  const clean = text.trim();
  if (!clean) return null;

  try {
    // 1. Search words
    const word = db.getFirstSync<{ meaning: string }>(
      'SELECT meaning FROM words WHERE content = ? AND meaning IS NOT NULL AND meaning != "" LIMIT 1',
      clean
    );
    if (word?.meaning) return word.meaning;

    // 2. Search characters
    const char = db.getFirstSync<{ meaning: string }>(
      'SELECT meaning FROM characters WHERE content = ? AND meaning IS NOT NULL AND meaning != "" LIMIT 1',
      clean
    );
    if (char?.meaning) return char.meaning;

    // 3. Search sentences
    const sentence = db.getFirstSync<{ meaning: string }>(
      'SELECT meaning FROM sentences WHERE content = ? AND meaning IS NOT NULL AND meaning != "" LIMIT 1',
      clean
    );
    if (sentence?.meaning) return sentence.meaning;
  } catch (e) {
    console.warn('findLocalMeaning error:', e);
  }

  return null;
}

/**
 * Translates Chinese text into English.
 * First checks local SQLite dictionary; if not found, queries translation service.
 */
export async function translateChinese(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return '';

  // 1. Check local dictionary first (instant & offline)
  const localMeaning = findLocalMeaning(clean);
  if (localMeaning) return localMeaning;

  // 2. Fallback to open translation API (MyMemory)
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=zh-CN|en`;
    const response = await fetch(url);
    const data = await response.json();

    if (data?.responseData?.translatedText) {
      let decoded = data.responseData.translatedText
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      // Discard translation provider warning messages
      if (!decoded.toUpperCase().includes('MYMEMORY WARNING')) {
        return decoded.trim();
      }
    }
  } catch (error) {
    console.warn('Online translation error:', error);
  }

  return '';
}

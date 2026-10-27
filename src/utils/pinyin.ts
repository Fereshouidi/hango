import { pinyin, getNumOfTone } from 'pinyin-pro';

/**
 * Checks if a string contains at least one Chinese (Hanzi) character.
 */
export function hasChinese(text: string): boolean {
  if (!text) return false;
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Converts Chinese text into standard Pinyin with tone marks (e.g. "nǐ hǎo").
 * Non-Chinese characters, numbers, and punctuation are preserved.
 */
export function toPinyin(text: string): string {
  if (!text || !text.trim() || !hasChinese(text)) return '';
  return pinyin(text, { nonZh: 'consecutive' }).trim();
}

/**
 * Gets the tone number ('1', '2', '3', '4', or '5' for neutral) for a Chinese character.
 */
export function getPinyinTone(char: string): string {
  if (!char || !hasChinese(char)) return '1';
  try {
    const rawTone = pinyin(char.trim()[0], { pattern: 'num' });
    if (rawTone === '0' || rawTone === '5') return '5';
    if (['1', '2', '3', '4'].includes(rawTone)) return rawTone;
  } catch {}
  return '1';
}

/**
 * Extracts tone number ('1'..'5') from a pinyin syllable (with tone mark or without).
 */
export function getToneFromPinyin(pinyinStr: string): string {
  if (!pinyinStr) return '1';
  try {
    const toneNum = getNumOfTone(pinyinStr.trim());
    if (toneNum === '0' || toneNum === '5') return '5';
    if (['1', '2', '3', '4'].includes(toneNum)) return toneNum;
  } catch {}
  return '1';
}

/**
 * Returns alternative pronunciations for polyphonic characters (多音字).
 * Returns empty array if character has only 1 reading or is not a single Hanzi.
 */
export function getPolyphonicReadings(text: string): string[] {
  if (!text) return [];
  const trimmed = text.trim();
  if (trimmed.length !== 1 || !hasChinese(trimmed)) return [];
  try {
    const list = pinyin(trimmed, { multiple: true, type: 'array' }) as string[];
    const unique = Array.from(new Set(list));
    return unique.length > 1 ? unique : [];
  } catch {
    return [];
  }
}

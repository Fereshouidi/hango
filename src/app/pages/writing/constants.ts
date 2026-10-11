import { Dimensions } from 'react-native';

export const PAGE_SIZE = 20;
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TONE_COLORS: Record<string, string> = {
  '1': '#ef4444',
  '2': '#f59e0b',
  '3': '#10b981',
  '4': '#3b82f6',
  '5': '#6b7280',
};

export const PUNCTUATION_KEYS = [
  '，', '。', '！', '？', '、', '：', '；',
  '"', '"', '《', '》', '（', '）', '…', '—', '·',
];

export const NUMBER_KEYS = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '万', '零',
];

export const PINYIN_QWERTY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

export const PINYIN_TONE_VOWELS = [
  { base: 'a', tones: ['ā', 'á', 'ǎ', 'à'] },
  { base: 'e', tones: ['ē', 'é', 'ě', 'è'] },
  { base: 'i', tones: ['ī', 'í', 'ǐ', 'ì'] },
  { base: 'o', tones: ['ō', 'ó', 'ǒ', 'ò'] },
  { base: 'u', tones: ['ū', 'ú', 'ǔ', 'ù'] },
  { base: 'ü', tones: ['ǖ', 'ǘ', 'ǚ', 'ǜ'] },
];

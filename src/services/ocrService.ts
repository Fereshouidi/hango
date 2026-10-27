import * as ImagePicker from 'expo-image-picker';
import { recognizeText } from 'react-native-nitro-ocr';
import { toPinyin, getPinyinTone, hasChinese } from '@/utils/pinyin';
import { translateChinese } from '@/services/translationService';

export interface ScannedResult {
  text: string;
  pinyin: string;
  meaning: string;
  tone?: string;
}

export interface ScannedImageInput {
  uri: string;
  base64?: string | null;
}

/**
 * Requests camera permission and launches device camera to take a photo.
 * Uses allowsEditing: false to ensure maximum compatibility across Android devices,
 * and requests base64 encoding to support both native Nitro OCR and online fallback.
 */
export async function pickImageFromCamera(): Promise<ScannedImageInput | null> {
  try {
    const perm = await ImagePicker.getCameraPermissionsAsync();
    if (!perm.granted) {
      const requested = await ImagePicker.requestCameraPermissionsAsync();
      if (!requested.granted) {
        throw new Error('Camera permission is required to scan Chinese text.');
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      base64: asset.base64 ?? null,
    };
  } catch (error: any) {
    console.error('Camera launch error:', error);
    throw error;
  }
}

/**
 * Requests media library permission and launches gallery picker to choose a photo.
 */
export async function pickImageFromGallery(): Promise<ScannedImageInput | null> {
  try {
    const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!requested.granted) {
        throw new Error('Photo gallery permission is required to select images.');
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      base64: asset.base64 ?? null,
    };
  } catch (error: any) {
    console.error('Gallery launch error:', error);
    throw error;
  }
}

/**
 * Online Chinese OCR fallback for environments where native Nitro C++ binary is not compiled
 * (e.g., running inside Expo Go without an Expo development build).
 */
async function recognizeChineseViaOnlineOCR(base64: string): Promise<string> {
  const keys = ['K87899142388957', 'helloworld'];

  for (const key of keys) {
    try {
      const formData = new FormData();
      formData.append('apikey', key);
      formData.append('language', 'chs'); // Simplified Chinese
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Best engine for Chinese script
      formData.append('base64Image', `data:image/jpeg;base64,${base64}`);

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data?.ParsedResults && Array.isArray(data.ParsedResults)) {
        const text = data.ParsedResults
          .map((r: any) => r.ParsedText || '')
          .join('\n')
          .trim();
        if (text && hasChinese(text)) {
          return text;
        }
      }
    } catch (e) {
      console.warn('[Online OCR Fallback] Request failed with key:', key, e);
    }
  }

  return '';
}

/**
 * Executes OCR on the given image specifically configured for Chinese script.
 * 1. Tries on-device native Nitro OCR (react-native-nitro-ocr) for maximum speed & privacy.
 * 2. If running in Expo Go or native module is not compiled, automatically falls back
 *    to cloud Chinese OCR without crashing.
 */
export async function recognizeChineseFromImage(
  input: ScannedImageInput | string
): Promise<string> {
  const uri = typeof input === 'string' ? input : input.uri;
  const base64 = typeof input === 'object' ? input.base64 : undefined;

  // 1. Try on-device native Nitro OCR
  try {
    const rawText = await recognizeText(uri, {
      scriptHints: ['chinese'],
      recognitionLevel: 'accurate',
    });

    if (rawText && rawText.trim()) {
      return rawText.trim();
    }
  } catch (error: any) {
    const msg = error?.message || '';
    const isNativeMissing =
      msg.includes('NitroOcr') ||
      msg.includes('createHybridObject') ||
      msg.includes('HybridObject') ||
      msg.includes('not compiled');

    if (isNativeMissing) {
      console.warn(
        '[Nitro OCR] Native module not compiled in this environment (e.g. Expo Go). Falling back to cloud Chinese OCR engine...'
      );
    } else {
      console.warn('[Nitro OCR] Native recognition error:', msg);
    }
  }

  // 2. If native module failed or wasn't compiled, fallback to online OCR if base64 is available
  if (base64) {
    try {
      const onlineText = await recognizeChineseViaOnlineOCR(base64);
      if (onlineText && onlineText.trim()) {
        return onlineText.trim();
      }
    } catch (onlineErr) {
      console.warn('[Online OCR] Failed to recognize text:', onlineErr);
    }
  }

  return '';
}

/**
 * Processes recognized Chinese text: formats text, computes Pinyin,
 * auto-translates to English meaning, and detects tone for characters.
 */
export async function processScannedChinese(
  text: string,
  mode: 'word' | 'sentence' | 'character' | 'text' | 'rule' | 'lesson' = 'word'
): Promise<ScannedResult> {
  let cleanText = text.trim();

  // If adding a single character, take first Chinese character found
  if (mode === 'character') {
    const match = cleanText.match(/[\u4e00-\u9fa5]/);
    if (match) {
      cleanText = match[0];
    }
  } else if (mode === 'word') {
    // For single word, take first line or clean space
    const firstLine = cleanText.split('\n')[0].trim();
    cleanText = firstLine.replace(/\s+/g, ' ');
  } else if (mode === 'sentence') {
    // Take the main sentence line
    cleanText = cleanText.replace(/\r\n/g, '\n').trim();
  }

  const pinyin = toPinyin(cleanText);
  const tone = mode === 'character' && hasChinese(cleanText) ? getPinyinTone(cleanText) : undefined;
  const meaning = await translateChinese(cleanText);

  return {
    text: cleanText,
    pinyin,
    meaning,
    tone,
  };
}

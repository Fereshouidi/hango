import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export const speakText = async (
  text: string,
  language: string = 'zh-CN',
  onStart?: () => void,
  onDone?: () => void
) => {
  try {
    if (!text || text.trim().length === 0) return;

    // Web SpeechSynthesis API fallback
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = language.startsWith('zh') ? 0.85 : 0.95;

      if (onStart) utterance.onstart = onStart;
      if (onDone) utterance.onend = onDone;
      utterance.onerror = () => {
        if (onDone) onDone();
      };

      window.speechSynthesis.speak(utterance);
      return;
    }

    // Native Mobile (iOS / Android) via expo-speech
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }

    if (onStart) onStart();

    Speech.speak(text, {
      language: language,
      pitch: 1.0,
      rate: language.startsWith('zh') ? 0.85 : 0.95,
      onDone: () => {
        if (onDone) onDone();
      },
      onError: () => {
        if (onDone) onDone();
      },
      onStopped: () => {
        if (onDone) onDone();
      },
    });
  } catch (error) {
    console.error('Speech synthesis error:', error);
    if (onDone) onDone();
  }
};

export const speakChineseText = (text: string, onStart?: () => void, onDone?: () => void) =>
  speakText(text, 'zh-CN', onStart, onDone);

export const speakEnglishText = (text: string, onStart?: () => void, onDone?: () => void) =>
  speakText(text, 'en-US', onStart, onDone);

export const handleLongText = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "..."
  } else {
    return text
  }
}
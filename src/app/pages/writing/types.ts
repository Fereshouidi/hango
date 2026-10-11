import { CharacterType, HSKType, LessonType, SentenceType } from '@/types';

export type WritingMode = 'keyboard' | 'dictation';
export type KeyboardTab = 'hanzi' | 'pinyin' | 'punct' | 'numbers';
export type FilterScope = 'hsk' | 'lesson';
export type DictationHint = 'pinyin' | 'english';

export type DictationResult = {
  sentence: SentenceType;
  typed: string;
  correct: boolean;
};

export interface WritingState {
  text: string;
  history: string[];
  showPinyinRuby: boolean;
  hidePinyinOnKeyboard: boolean;
  soundOnType: boolean;
  isPlayingAudio: boolean;
  selectedCharDetail: CharacterType | null;
}

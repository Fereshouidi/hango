export type LoopContentType = 'words' | 'sentences' | 'texts' | 'mixed';

export type LoopMode = 'repeat-all' | 'repeat-one' | 'shuffle';

export type LoopRepeatCount = 1 | 2 | 3 | 5 | 0; // 0 = infinite

export type LoopInterval = 0 | 1 | 2 | 3 | 5; // seconds between repetitions for shadowing

export type LoopSpeed = 0.75 | 0.85 | 1.0 | 1.2;

export interface LoopItem {
  id: string;
  originalId: number;
  type: 'word' | 'sentence' | 'text' | 'text-sentence';
  content: string;
  pinyin: string;
  meaning: string;
  title?: string;
  hskId?: number;
  lessonId?: number;
  textId?: number;
}

export type HSKType = {
    id: number;
    name: string;
};

export type LessonType = {
    id: number;
    num: number;
    title: string;
    hskId?: number | null;
};

export type TextType = {
    id: number;
    hskId?: number;
    lessonId?: number;
    title: string;
    content: string;
    pinyin: string;
    meaning: string;
};

export type SentenceType = {
    id: number;
    hskId?: number;
    lessonId?: number;
    textId?: number;
    content: string;
    pinyin: string;
    meaning: string;
};

export type WordType = {
    id: number;
    hskId?: number;
    lessonId?: number;
    textId?: number;
    sentenceId?: number;
    content: string;
    pinyin: string;
    meaning: string;
};

export type CharacterType = {
    id: number;
    hskId?: number;
    lessonId?: number;
    textId?: number;
    sentenceId?: number;
    wordId?: number;
    content: string;
    pinyin: string;
    tone: string;
    meaning: string;
};

export type RuleType = {
    id: number;
    hskId?: number;
    lessonId?: number;
    textId?: number;
    sentenceId?: number;
    wordId?: number;
    content: string;
};
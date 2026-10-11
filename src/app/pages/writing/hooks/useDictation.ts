import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { getAllSentences, getSentencesByHSKId, getSentencesByLessonId } from '@/db/utils';
import { SentenceType } from '@/types';
import { DictationHint, DictationResult } from '../types';

function normalizeHanzi(s: string) {
  return s.replace(/[\s，。！？、：；""《》（）…—·]/g, '').trim();
}

export function useDictation(selectedHskId: number | null, selectedLessonId: number | null) {
  const [dictationSentences, setDictationSentences] = useState<SentenceType[]>([]);
  const [dictationIndex, setDictationIndex] = useState(0);
  const [dictationHint, setDictationHint] = useState<DictationHint>('pinyin');
  const [dictationResults, setDictationResults] = useState<DictationResult[]>([]);
  const [showDictationAnswer, setShowDictationAnswer] = useState(false);

  const loadDictationSentences = useCallback(
    (hskId: number | null, lessonId: number | null) => {
      try {
        let rows: SentenceType[];
        if (hskId !== null) {
          rows = (getSentencesByHSKId(hskId) as SentenceType[]) || [];
        } else if (lessonId !== null) {
          rows = (getSentencesByLessonId(lessonId) as SentenceType[]) || [];
        } else {
          rows = (getAllSentences() as SentenceType[]) || [];
        }
        const shuffled = [...rows].sort(() => Math.random() - 0.5);
        setDictationSentences(shuffled);
        setDictationIndex(0);
        setDictationResults([]);
        setShowDictationAnswer(false);
      } catch (e) {
        console.error('loadDictationSentences error:', e);
      }
    },
    []
  );

  useEffect(() => {
    loadDictationSentences(selectedHskId, selectedLessonId);
  }, [selectedHskId, selectedLessonId, loadDictationSentences]);

  const currentSentence = dictationSentences[dictationIndex] ?? null;

  const checkDictation = (typedText: string) => {
    if (!currentSentence) return;
    const typed = normalizeHanzi(typedText);
    const expected = normalizeHanzi(currentSentence.content);
    const correct = typed === expected;
    setDictationResults((p) => [...p, { sentence: currentSentence, typed, correct }]);
    setShowDictationAnswer(true);
  };

  const nextDictation = (onNext: () => void) => {
    setShowDictationAnswer(false);
    onNext();
    if (dictationIndex + 1 < dictationSentences.length) {
      setDictationIndex((p) => p + 1);
    } else {
      const correctCount = dictationResults.filter((r) => r.correct).length;
      Alert.alert(
        '🎉 Session Complete!',
        `You completed all sentences! Score: ${correctCount} / ${dictationSentences.length}`
      );
    }
  };

  const skipDictation = (onSkip: () => void) => {
    setShowDictationAnswer(false);
    onSkip();
    if (dictationIndex + 1 < dictationSentences.length) {
      setDictationIndex((p) => p + 1);
    }
  };

  const reshuffleDictation = (onReset: () => void) => {
    const shuffled = [...dictationSentences].sort(() => Math.random() - 0.5);
    setDictationSentences(shuffled);
    setDictationIndex(0);
    setDictationResults([]);
    setShowDictationAnswer(false);
    onReset();
  };

  return {
    dictationSentences,
    dictationIndex,
    currentSentence,
    dictationHint,
    setDictationHint,
    dictationResults,
    showDictationAnswer,
    checkDictation,
    nextDictation,
    skipDictation,
    reshuffleDictation,
    loadDictationSentences,
  };
}

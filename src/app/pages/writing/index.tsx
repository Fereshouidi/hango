import React, { useCallback, useMemo, useState } from 'react';
import { Share, StyleSheet, View, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { Bg1 } from '@/components/sub/bg1';
import { CharacterType } from '@/types';
import { speakChineseText } from '@/utils/tts';

import { CompositionBoard } from './components/CompositionBoard';
import { DictationCard } from './components/DictationCard';
import { FilterBar } from './components/FilterBar';
import { WritingKeyboard } from './components/keyboard/WritingKeyboard';
import { ModeSwitcher } from './components/ModeSwitcher';
import { WritingHeader } from './components/WritingHeader';
import { useDictation } from './hooks/useDictation';
import { useWritingData } from './hooks/useWritingData';
import { WritingMode } from './types';
import { Paywall } from '@/components/paywall';

export default function WritingScreen() {
  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<WritingMode>('dictation');

  // ── Text & Composition State ──────────────────────────────────────────────
  const [text, setText] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showPinyinRuby, setShowPinyinRuby] = useState(true);
  const [hidePinyin, setHidePinyin] = useState(false);
  const [soundOnType, setSoundOnType] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedCharDetail, setSelectedCharDetail] = useState<CharacterType | null>(null);

  // ── Data Hooks ────────────────────────────────────────────────────────────
  const {
    filterScope,
    setFilterScope,
    selectedHskId,
    setSelectedHskId,
    selectedLessonId,
    setSelectedLessonId,
    allHsks,
    allLessons,
    totalCharactersCount,
    hskCounts,
    lessonCounts,
    lookupChars,
    charLookupMap,
    displayedChars,
    keyboardOffset,
    keyboardTotal,
    isLoadingMore,
    hasMore,
    loadMoreChars,
    searchQuery,
    setSearchQuery,
    reloadMetadata,
  } = useWritingData();

  const {
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
  } = useDictation(selectedHskId, selectedLessonId);

  useFocusEffect(
    useCallback(() => {
      reloadMetadata();
    }, [reloadMetadata])
  );

  // ── Dictation Character Pool (Target Sentence Chars + 10 to 20 Distractors) ──
  const dictationCharPool = useMemo(() => {
    if (!currentSentence || !currentSentence.content) return [];

    // 1. Extract all Chinese characters required by the sentence
    const sentenceHanzi = Array.from(currentSentence.content).filter((ch) =>
      /[\u4e00-\u9fa5]/.test(ch)
    );
    const uniqueSentenceHanzi = Array.from(new Set(sentenceHanzi));

    // 2. Map required characters to CharacterType objects
    const requiredChars: CharacterType[] = [];
    const requiredContentSet = new Set<string>();

    uniqueSentenceHanzi.forEach((ch, idx) => {
      requiredContentSet.add(ch);
      const found = charLookupMap.get(ch);
      if (found) {
        requiredChars.push(found);
      } else {
        // Fallback placeholder if character is missing from database
        requiredChars.push({
          id: -1000 - idx,
          content: ch,
          pinyin: '',
          tone: '5',
          meaning: '',
        });
      }
    });

    // 3. Pick 10-15 random distractor characters from lookupChars
    const candidateDistractors = lookupChars.filter(
      (c) => c.content && !requiredContentSet.has(c.content)
    );

    // Shuffle candidates and pick 15
    const shuffledDistractors = [...candidateDistractors].sort(() => Math.random() - 0.5);
    const chosenDistractors = shuffledDistractors.slice(0, 15);

    // 4. Combine required characters + distractors and shuffle together
    const finalPool = [...requiredChars, ...chosenDistractors].sort(
      () => Math.random() - 0.5
    );

    return finalPool;
  }, [currentSentence?.id, currentSentence?.content, lookupChars, charLookupMap]);

  // Characters to show on the keyboard based on mode
  const activeKeyboardChars = mode === 'dictation' ? dictationCharPool : displayedChars;
  const activeKeyboardTotal = mode === 'dictation' ? dictationCharPool.length : keyboardTotal;
  const activeHasMore = mode === 'dictation' ? false : hasMore;

  // ── Composition Actions ───────────────────────────────────────────────────
  const handleInsertChar = (charStr: string, playSound = true) => {
    setHistory((prev) => [...prev.slice(-20), text]);
    setText((prev) => prev + charStr);
    if (playSound && soundOnType) {
      speakChineseText(charStr);
    }
  };

  const handleBackspace = () => {
    if (!text.length) return;
    setHistory((prev) => [...prev.slice(-20), text]);
    const chars = Array.from(text);
    chars.pop();
    setText(chars.join(''));
  };

  const handleUndo = () => {
    if (!history.length) return;
    setText(history[history.length - 1]);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setHistory((prev) => [...prev.slice(-20), text]);
    setText('');
    setSelectedCharDetail(null);
  };

  const handlePlayAudio = () => {
    if (!text.trim()) return;
    setIsPlayingAudio(true);
    speakChineseText(
      text,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  const handleShare = async () => {
    if (!text.trim()) return;
    try {
      await Share.share({ message: text, title: 'HanGo Chinese Typing' });
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  // ── Dictation Actions ─────────────────────────────────────────────────────
  const handleCheckDictation = () => {
    checkDictation(text);
  };

  const handleNextDictation = () => {
    nextDictation(() => {
      setText('');
      setHistory([]);
      setSelectedCharDetail(null);
    });
  };

  const handleSkipDictation = () => {
    skipDictation(() => {
      setText('');
      setHistory([]);
      setSelectedCharDetail(null);
    });
  };

  const handleReshuffleDictation = () => {
    reshuffleDictation(() => {
      setText('');
      setHistory([]);
      setSelectedCharDetail(null);
    });
  };

  // Toggle hiding pinyin (affects keyboard keys and syncs with ruby)
  const handleToggleHidePinyin = () => {
    const nextHidden = !hidePinyin;
    setHidePinyin(nextHidden);
    if (nextHidden) {
      setShowPinyinRuby(false);
    } else {
      setShowPinyinRuby(true);
    }
  };

  return (
    <Paywall
      featureName="Typing Studio"
      featureIcon="keyboard"
      featureDescription="Master sentence construction, interactive pinyin rubies, and audio dictation with custom Chinese keyboard."
    >
      <ThemedView style={styles.container}>
      <Bg1 />

      {/* Screen Header */}
      <WritingHeader
        mode={mode}
        text={text}
        isPlayingAudio={isPlayingAudio}
        onPlayAudio={handlePlayAudio}
        onShare={handleShare}
      />

      {/* Mode Switcher (Free Write vs Dictation) */}
      <ModeSwitcher mode={mode} onSelectMode={setMode} />

      {/* Scrollable Upper Section (Contains Filter, Dictation, Composition Board) */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HSK & Lesson Filter Bar with character counts */}
        <FilterBar
          filterScope={filterScope}
          onScopeChange={setFilterScope}
          selectedHskId={selectedHskId}
          onSelectHskId={setSelectedHskId}
          selectedLessonId={selectedLessonId}
          onSelectLessonId={setSelectedLessonId}
          allHsks={allHsks}
          allLessons={allLessons}
          totalCharactersCount={totalCharactersCount}
          hskCounts={hskCounts}
          lessonCounts={lessonCounts}
        />

        {/* Dictation Prompt (Dictation Mode only) */}
        {mode === 'dictation' && (
          <DictationCard
            currentSentence={currentSentence}
            dictationSentences={dictationSentences}
            dictationIndex={dictationIndex}
            dictationHint={dictationHint}
            onSetDictationHint={setDictationHint}
            dictationResults={dictationResults}
            showDictationAnswer={showDictationAnswer}
            typedText={text}
            onCheck={handleCheckDictation}
            onNext={handleNextDictation}
            onSkip={handleSkipDictation}
            onReshuffle={handleReshuffleDictation}
          />
        )}

        {/* Composition Notepad */}
        <CompositionBoard
          mode={mode}
          text={text}
          history={history}
          showPinyinRuby={showPinyinRuby}
          onTogglePinyinRuby={() => setShowPinyinRuby((prev) => !prev)}
          soundOnType={soundOnType}
          onToggleSoundOnType={() => setSoundOnType((prev) => !prev)}
          onUndo={handleUndo}
          onClearAll={handleClearAll}
          charLookupMap={charLookupMap}
          selectedCharDetail={selectedCharDetail}
          onSelectCharDetail={setSelectedCharDetail}
        />
      </ScrollView>

      {/* Docked Keyboard at the bottom of the screen (OUTSIDE the ScrollView!) */}
      <View style={styles.dockedKeyboard}>
        <WritingKeyboard
          displayedChars={activeKeyboardChars}
          lookupChars={lookupChars}
          charLookupMap={charLookupMap}
          keyboardTotal={activeKeyboardTotal}
          keyboardOffset={mode === 'dictation' ? activeKeyboardChars.length : keyboardOffset}
          hasMore={activeHasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMoreChars}
          hidePinyin={hidePinyin}
          onToggleHidePinyin={handleToggleHidePinyin}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onInsertChar={(char) => handleInsertChar(char, true)}
          onBackspace={handleBackspace}
          onLongPressChar={(char) => setSelectedCharDetail(char)}
          isDictation={mode === 'dictation'}
        />
      </View>
    </ThemedView>
    </Paywall>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 5,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 5,
  },
  dockedKeyboard: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
  },
});

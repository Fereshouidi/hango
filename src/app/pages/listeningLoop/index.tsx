import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Lucide from '@react-native-vector-icons/lucide';
import { ThemedView } from '@/components/themed-view';
import { Bg1 } from '@/components/sub/bg1';
import Header from '@/components/main/header';
import {
  getAllHSKs,
  getAllLessons,
  getAllSentences,
  getAllTexts,
  getLessonsByHSKId,
  getSentencesByHSKId,
  getSentencesByLessonId,
  getSentencesByTextId,
  getTextsByHSKId,
  getTextsByLessonId,
} from '@/db/utils';
import { HSKType, LessonType, SentenceType, TextType } from '@/types';
import { LoopFilterBar } from './components/LoopFilterBar';
import { LoopHeroPlayer } from './components/LoopHeroPlayer';
import { LoopPlaylistQueue } from './components/LoopPlaylistQueue';
import { LoopSettingsModal } from './components/LoopSettingsModal';
import { useListeningLoop } from './hooks/useListeningLoop';
import { LoopContentType, LoopItem } from './types';

export default function ListeningLoopScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    hskId?: string;
    lessonId?: string;
    textId?: string;
  }>();

  const parseNum = (val?: string) => (val && !isNaN(Number(val)) ? Number(val) : null);

  // Content Selection state
  const [contentType, setContentType] = useState<LoopContentType>(
    params.type === 'texts' ? 'texts' : 'sentences'
  );
  const [scope, setScope] = useState<'hsk' | 'lesson'>('hsk');
  const [selectedHskId, setSelectedHskId] = useState<number | null>(parseNum(params.hskId));
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(parseNum(params.lessonId));
  const [breakTextsIntoSentences, setBreakTextsIntoSentences] = useState(true);

  // Metadata
  const [allHsks, setAllHsks] = useState<HSKType[]>([]);
  const [allLessons, setAllLessons] = useState<LessonType[]>([]);

  // Settings modal visibility
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Raw DB data
  const [dbSentences, setDbSentences] = useState<SentenceType[]>([]);
  const [dbTexts, setDbTexts] = useState<TextType[]>([]);

  // ── Load Metadata ──────────────────────────────────────────────────────────
  const loadMetadata = useCallback(() => {
    try {
      const hsks = (getAllHSKs() as HSKType[]) || [];
      const lessons = (getAllLessons() as LessonType[]) || [];
      setAllHsks(hsks);
      setAllLessons(lessons);
    } catch (e) {
      console.error('loadMetadata error in ListeningLoop:', e);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // ── Fetch Sentences & Texts based on filters ───────────────────────────────
  const fetchContent = useCallback(() => {
    try {
      if (params.textId) {
        const tId = Number(params.textId);
        const s = (getSentencesByTextId(tId) as SentenceType[]) || [];
        setDbSentences(s);
        return;
      }

      if (scope === 'hsk') {
        if (selectedHskId !== null) {
          const s = (getSentencesByHSKId(selectedHskId) as SentenceType[]) || [];
          const t = (getTextsByHSKId(selectedHskId) as TextType[]) || [];
          setDbSentences(s);
          setDbTexts(t);
        } else {
          const s = (getAllSentences() as SentenceType[]) || [];
          const t = (getAllTexts() as TextType[]) || [];
          setDbSentences(s);
          setDbTexts(t);
        }
      } else {
        if (selectedLessonId !== null) {
          const s = (getSentencesByLessonId(selectedLessonId) as SentenceType[]) || [];
          const t = (getTextsByLessonId(selectedLessonId) as TextType[]) || [];
          setDbSentences(s);
          setDbTexts(t);
        } else {
          const s = (getAllSentences() as SentenceType[]) || [];
          const t = (getAllTexts() as TextType[]) || [];
          setDbSentences(s);
          setDbTexts(t);
        }
      }
    } catch (e) {
      console.error('fetchContent error in ListeningLoop:', e);
    }
  }, [scope, selectedHskId, selectedLessonId, params.textId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // ── Build Loop Items ───────────────────────────────────────────────────────
  const loopItems: LoopItem[] = useMemo(() => {
    if (contentType === 'sentences') {
      return dbSentences.map((s, idx) => ({
        id: `sentence-${s.id ?? idx}`,
        originalId: s.id ?? idx,
        type: 'sentence' as const,
        content: (s.content || '').trim(),
        pinyin: s.pinyin || '',
        meaning: s.meaning || '',
        hskId: s.hskId,
        lessonId: s.lessonId,
        textId: s.textId,
      }));
    }

    // Texts mode
    if (!breakTextsIntoSentences) {
      return dbTexts.map((t, idx) => ({
        id: `text-${t.id ?? idx}`,
        originalId: t.id ?? idx,
        type: 'text' as const,
        title: t.title || `Text ${idx + 1}`,
        content: (t.content || '').trim(),
        pinyin: t.pinyin || '',
        meaning: t.meaning || '',
        hskId: t.hskId,
        lessonId: t.lessonId,
      }));
    }

    // Break each text into sentences for fine-grained listening loop
    const brokenItems: LoopItem[] = [];
    dbTexts.forEach((t, tIdx) => {
      const rawSentences = (t.content || '')
        .split(/(?<=[。！？\n])/)
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length > 0);

      rawSentences.forEach((chunk, cIdx) => {
        brokenItems.push({
          id: `text-${t.id ?? tIdx}-line-${cIdx}`,
          originalId: t.id ?? tIdx,
          type: 'text-sentence' as const,
          title: t.title ? `${t.title} (${cIdx + 1})` : `Line ${cIdx + 1}`,
          content: chunk,
          pinyin: '',
          meaning: '',
          hskId: t.hskId,
          lessonId: t.lessonId,
        });
      });
    });

    return brokenItems;
  }, [contentType, dbSentences, dbTexts, breakTextsIntoSentences]);

  // ── 10 by 10 Pagination & Batching State ────────────────────────────────────
  const PAGE_SIZE = 10;
  const [currentBatch, setCurrentBatch] = useState(0);
  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);

  const totalBatches = Math.max(1, Math.ceil(loopItems.length / PAGE_SIZE));
  const batchOffset = currentBatch * PAGE_SIZE;

  // Initial items for the current batch
  const initialBatchItems = useMemo(() => {
    return loopItems.slice(batchOffset, Math.min(batchOffset + PAGE_SIZE, loopItems.length));
  }, [loopItems, batchOffset]);

  // ── Loop Engine Hook ───────────────────────────────────────────────────────
  const {
    playlist,
    updatePlaylist,
    appendPlaylist,
    currentIndex,
    currentItem,
    isPlaying,
    isSpeaking,
    isWaitingInterval,
    intervalCountdown,
    repeatCounter,
    loopMode,
    setLoopMode,
    repeatCount,
    setRepeatCount,
    interval,
    setInterval,
    speed,
    setSpeed,
    showPinyin,
    setShowPinyin,
    showMeaning,
    setShowMeaning,
    play,
    pause,
    togglePlayPause,
    next,
    prev,
    jumpToIndex,
  } = useListeningLoop(initialBatchItems);

  // When filter inputs change, reset to batch 0
  useEffect(() => {
    setCurrentBatch(0);
    setLoadedCount(PAGE_SIZE);
  }, [contentType, scope, selectedHskId, selectedLessonId, breakTextsIntoSentences, params.textId]);

  // When loopItems or batch changes, load that batch of 10 items
  useEffect(() => {
    const chunk = loopItems.slice(batchOffset, Math.min(batchOffset + PAGE_SIZE, loopItems.length));
    updatePlaylist(chunk, true);
  }, [loopItems, batchOffset, updatePlaylist]);

  // Batch switcher handler
  const handleSelectBatch = (batchIdx: number) => {
    if (batchIdx === currentBatch || batchIdx < 0 || batchIdx >= totalBatches) return;
    setCurrentBatch(batchIdx);
    setLoadedCount(PAGE_SIZE);
  };

  // Load next 10 items to active queue without interrupting playback
  const handleLoadNext10 = () => {
    const nextStart = batchOffset + playlist.length;
    const nextChunk = loopItems.slice(nextStart, Math.min(nextStart + PAGE_SIZE, loopItems.length));
    if (nextChunk.length > 0) {
      appendPlaylist(nextChunk);
      setLoadedCount((prev) => prev + nextChunk.length);
    }
  };

  const hasMoreToLoad = batchOffset + playlist.length < loopItems.length;

  // Clean pause on screen blur
  useFocusEffect(
    useCallback(() => {
      return () => {
        pause();
      };
    }, [pause])
  );

  const handleToggleLoopMode = () => {
    const modes: ('repeat-all' | 'repeat-one' | 'shuffle')[] = [
      'repeat-all',
      'repeat-one',
      'shuffle',
    ];
    const nextIdx = (modes.indexOf(loopMode) + 1) % modes.length;
    setLoopMode(modes[nextIdx]);
  };

  return (
    <ThemedView style={styles.container}>
      <Bg1 />

      {/* Screen Header */}
      <Header
        useBackArrow
        label="Listening Loop"
        subtitle="听力循环 • Shadowing & Repeat"
        items={[
          <TouchableOpacity
            key="play-toggle"
            onPress={togglePlayPause}
            activeOpacity={0.7}
            style={[styles.headerIconBtn, isPlaying && styles.headerIconBtnActive]}
          >
            <Lucide
              name={isPlaying ? 'pause' : 'play'}
              size={16}
              color={isPlaying ? '#8b5cf6' : '#475569'}
            />
          </TouchableOpacity>,
          <TouchableOpacity
            key="settings"
            onPress={() => setSettingsModalVisible(true)}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Lucide name="sliders" size={16} color="#475569" />
          </TouchableOpacity>,
        ]}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Hero Loop Player */}
        <LoopHeroPlayer
          currentItem={currentItem}
          currentIndex={currentIndex}
          totalItems={playlist.length}
          batchOffset={batchOffset}
          totalAvailable={loopItems.length}
          currentBatch={currentBatch}
          totalBatches={totalBatches}
          isPlaying={isPlaying}
          isSpeaking={isSpeaking}
          isWaitingInterval={isWaitingInterval}
          intervalCountdown={intervalCountdown}
          repeatCounter={repeatCounter}
          repeatCount={repeatCount}
          loopMode={loopMode}
          speed={speed}
          interval={interval}
          showPinyin={showPinyin}
          showMeaning={showMeaning}
          onTogglePlayPause={togglePlayPause}
          onNext={next}
          onPrev={prev}
          onToggleLoopMode={handleToggleLoopMode}
          onTogglePinyin={() => setShowPinyin((p) => !p)}
          onToggleMeaning={() => setShowMeaning((m) => !m)}
          onOpenSettings={() => setSettingsModalVisible(true)}
        />

        {/* Content & Scope Filter Bar */}
        <LoopFilterBar
          contentType={contentType}
          onSelectContentType={setContentType}
          scope={scope}
          onSelectScope={setScope}
          selectedHskId={selectedHskId}
          onSelectHskId={setSelectedHskId}
          selectedLessonId={selectedLessonId}
          onSelectLessonId={setSelectedLessonId}
          allHsks={allHsks}
          allLessons={allLessons}
          breakTextsIntoSentences={breakTextsIntoSentences}
          onToggleBreakTexts={() => setBreakTextsIntoSentences((p) => !p)}
        />

        {/* Scrollable Playlist Queue with Active Item Highlight & 10-by-10 Batch Controls */}
        <LoopPlaylistQueue
          playlist={playlist}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          onSelectItem={jumpToIndex}
          showPinyin={showPinyin}
          showMeaning={showMeaning}
          totalAvailable={loopItems.length}
          currentBatch={currentBatch}
          totalBatches={totalBatches}
          batchOffset={batchOffset}
          onSelectBatch={handleSelectBatch}
          onLoadNext10={handleLoadNext10}
          hasMoreToLoad={hasMoreToLoad}
        />
      </ScrollView>

      {/* Settings Modal */}
      <LoopSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        repeatCount={repeatCount}
        onSelectRepeatCount={setRepeatCount}
        interval={interval}
        onSelectInterval={setInterval}
        speed={speed}
        onSelectSpeed={setSpeed}
        loopMode={loopMode}
        onSelectLoopMode={setLoopMode}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerIconBtn: {
    padding: 7,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtnActive: {
    backgroundColor: '#f3e8ff',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 5,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 5,
  },
});

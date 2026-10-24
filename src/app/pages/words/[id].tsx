import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import {
  deleteWords,
  getAllWords,
  getHSKById,
  getLessonById,
  getWordsByCharacterId,
  getWordsByHSKId,
  getWordsByLessonId,
  getWordsByRuleId,
  getWordsBySentenceId,
  getWordsByTextId,
} from '@/db/utils';
import { WordType } from '@/types';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { randomColors } from '@/constants/theme';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { WordCard } from '@/components/cards/WordCard';
import {
  CollapsibleControlBar,
  HeaderFilterButton,
} from '@/components/common/CollapsibleControlBar';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { OptionsMenuModal } from '@/components/common/OptionsMenuModal';
import { speakChineseText } from '@/utils/tts';

const PAGE_SIZE = 30;

export default function WordsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    hskId?: string;
    lessonId?: string;
    textId?: string;
    sentenceId?: string;
    wordId?: string;
    characterId?: string;
    caracterid?: string;
    ruleId?: string;
    scope?: string;
    search?: string;
  }>();

  const parseNum = (val?: string) => (val && !isNaN(Number(val)) ? Number(val) : 0);

  const hskId = parseNum(params.hskId);
  const lessonId = parseNum(params.lessonId);
  const textId = parseNum(params.textId);
  const sentenceId = parseNum(params.sentenceId);
  const characterId = parseNum(params.characterId || params.caracterid);
  const ruleId = parseNum(params.ruleId);
  const genericId = parseNum(params.id);
  const isGlobalScope = params.scope === 'global';

  const [words, setWords] = useState<WordType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(params.search || '');
  const [isControlBarOpen, setIsControlBarOpen] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);

  // Selection mode & card menu state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeCardWord, setActiveCardWord] = useState<WordType | null>(null);

  // ── Pinch-to-zoom column control ──────────────────────────────────
  const MIN_COLS = 2;
  const MAX_COLS = 6;
  const [numColumns, setNumColumns] = useState(4);
  const numColumnsRef = useRef(numColumns);
  useEffect(() => {
    numColumnsRef.current = numColumns;
  }, [numColumns]);

  const [showColsHint, setShowColsHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartColsRef = useRef<number>(4);

  // Load persisted column count
  useEffect(() => {
    AsyncStorage.getItem('words_numColumns').then((v) => {
      if (v) {
        const n = parseInt(v, 10);
        if (n >= MIN_COLS && n <= MAX_COLS) setNumColumns(n);
      }
    });
  }, []);

  const pinchResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gs) => gs.numberActiveTouches === 2,
      onMoveShouldSetPanResponder: (_, gs) => gs.numberActiveTouches === 2,
      onStartShouldSetPanResponderCapture: (_, gs) => gs.numberActiveTouches === 2,
      onMoveShouldSetPanResponderCapture: (_, gs) => gs.numberActiveTouches === 2,
      onPanResponderGrant: (e) => {
        const touches = e.nativeEvent.touches;
        if (!touches || touches.length < 2) return;
        const dx = touches[0].pageX - touches[1].pageX;
        const dy = touches[0].pageY - touches[1].pageY;
        pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
        pinchStartColsRef.current = numColumnsRef.current;
      },
      onPanResponderMove: (e) => {
        const touches = e.nativeEvent.touches;
        if (!touches || touches.length < 2 || pinchStartDistRef.current === null) return;
        const dx = touches[0].pageX - touches[1].pageX;
        const dy = touches[0].pageY - touches[1].pageY;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        // Spreading fingers apart (zoom in) -> fewer cols (bigger cards)
        // Pinching fingers together (zoom out) -> more cols (smaller cards)
        const diff = currentDist - pinchStartDistRef.current;
        const colDelta = Math.round(diff / 55);
        const next = Math.max(MIN_COLS, Math.min(MAX_COLS, pinchStartColsRef.current - colDelta));

        if (next !== numColumnsRef.current) {
          setNumColumns(next);
          setShowColsHint(true);
          if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
          hintTimerRef.current = setTimeout(() => setShowColsHint(false), 1400);
          AsyncStorage.setItem('words_numColumns', String(next));
        }
      },
      onPanResponderRelease: () => {
        pinchStartDistRef.current = null;
      },
    })
  ).current;

  useEffect(() => {
    if (params.search !== undefined) {
      setSearchQuery(params.search);
    }
  }, [params.search]);

  // Handle hardware back button to cancel selection mode
  useEffect(() => {
    if (!isSelectionMode) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      exitSelectionMode();
      return true;
    });
    return () => subscription.remove();
  }, [isSelectionMode]);

  const getFilterBadgeLabel = (): string | null => {
    let baseLabel: string | null = null;
    if (hskId > 0) baseLabel = `HSK Level ${hskId}`;
    else if (lessonId > 0) baseLabel = `Lesson ${lessonId}`;
    else if (textId > 0) baseLabel = `Text ${textId}`;
    else if (sentenceId > 0) baseLabel = `Sentence ${sentenceId}`;
    else if (characterId > 0) baseLabel = `Character ${characterId}`;
    else if (ruleId > 0) baseLabel = `Rule ${ruleId}`;
    else if (genericId > 0) baseLabel = `ID ${genericId}`;

    if (isGlobalScope) {
      return baseLabel ? `${baseLabel} (Global)` : 'All DB Search';
    }
    return baseLabel;
  };

  const activeFilterLabel = getFilterBadgeLabel();

  const loadData = useCallback(() => {
    try {
      let data: WordType[] = [];

      if (isGlobalScope) {
        data = getAllWords() as unknown as WordType[];
      } else if (hskId > 0) {
        data = getWordsByHSKId(hskId) as unknown as WordType[];
      } else if (lessonId > 0) {
        data = getWordsByLessonId(lessonId) as unknown as WordType[];
      } else if (textId > 0) {
        data = getWordsByTextId(textId) as unknown as WordType[];
      } else if (sentenceId > 0) {
        data = getWordsBySentenceId(sentenceId) as unknown as WordType[];
      } else if (characterId > 0) {
        data = getWordsByCharacterId(characterId) as unknown as WordType[];
      } else if (ruleId > 0) {
        data = getWordsByRuleId(ruleId) as unknown as WordType[];
      } else if (genericId > 0) {
        data = getWordsByLessonId(genericId) as unknown as WordType[];
        if (!data || data.length === 0) {
          data = getWordsByHSKId(genericId) as unknown as WordType[];
        }
      } else {
        data = getAllWords() as unknown as WordType[];
      }

      setWords(data || []);
    } catch (e) {
      console.error('Failed to load words:', e);
    }
  }, [isGlobalScope, hskId, lessonId, textId, sentenceId, characterId, ruleId, genericId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      exitSelectionMode();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, [loadData]);

  const q = searchQuery.toLowerCase().trim();
  const filteredWords = words.filter(
    (w) =>
      !q ||
      (w.content || '').toLowerCase().includes(q) ||
      (w.pinyin || '').toLowerCase().includes(q) ||
      (w.meaning || '').toLowerCase().includes(q)
  );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, hskId, lessonId, textId, sentenceId, characterId, ruleId, genericId]);

  const displayedWords = filteredWords.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredWords.length));
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 180;
    if (isCloseToBottom && visibleCount < filteredWords.length) {
      handleLoadMore();
    }
  };

  const handlePlayAudio = useCallback((id: number, text: string) => {
    setPlayingId(id);
    speakChineseText(
      text,
      () => setPlayingId(id),
      () => setPlayingId(null)
    );
  }, []);

  const handleOpenListeningLoop = () => {
    let effLessonId = lessonId > 0 ? lessonId : 0;
    let effHskId = hskId > 0 ? hskId : 0;

    if (!effLessonId && genericId > 0) {
      const l = getLessonById(genericId);
      if (l) {
        effLessonId = l.id;
        if (!effHskId && l.hskId) effHskId = l.hskId;
      } else {
        const h = getHSKById(genericId);
        if (h) effHskId = h.id;
      }
    } else if (effLessonId > 0 && !effHskId) {
      const l = getLessonById(effLessonId);
      if (l?.hskId) effHskId = l.hskId;
    }

    const targetScope = effLessonId > 0 ? 'lesson' : 'hsk';
    const idsParam = filteredWords.map((w) => w.id).filter(Boolean).join(',');

    const queryParams: Record<string, string> = {
      type: 'words',
      scope: targetScope,
    };
    if (effHskId > 0) queryParams.hskId = String(effHskId);
    if (effLessonId > 0) queryParams.lessonId = String(effLessonId);
    if (textId > 0) queryParams.textId = String(textId);
    if (sentenceId > 0) queryParams.sentenceId = String(sentenceId);
    if (characterId > 0) queryParams.characterId = String(characterId);
    if (ruleId > 0) queryParams.ruleId = String(ruleId);
    if (searchQuery.trim()) queryParams.search = searchQuery.trim();
    if (idsParam) queryParams.wordIds = idsParam;
    if (activeFilterLabel) {
      queryParams.filterLabel = searchQuery.trim()
        ? `${activeFilterLabel} • "${searchQuery.trim()}"`
        : activeFilterLabel;
    } else if (searchQuery.trim()) {
      queryParams.filterLabel = `Search: "${searchQuery.trim()}"`;
    }

    router.push({
      pathname: '/pages/listeningLoop',
      params: queryParams,
    } as any);
  };

  // ── Selection mode helpers ──────────────────────────────────────────────
  const enterSelectionMode = useCallback((id: number) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setActiveCardWord(null);
  }, []);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  }, []);

  const isSelectionModeRef = useRef(isSelectionMode);
  useEffect(() => {
    isSelectionModeRef.current = isSelectionMode;
  }, [isSelectionMode]);

  const handleCardPress = useCallback((word: WordType) => {
    if (isSelectionModeRef.current) {
      toggleSelection(word.id!);
    } else {
      router.push(`/pages/wordDetails/${word.id}` as any);
    }
  }, [toggleSelection, router]);

  const handleCardLongPress = useCallback((word: WordType) => {
    enterSelectionMode(word.id!);
  }, [enterSelectionMode]);

  const handleCardOptionsPress = useCallback((word: WordType) => {
    setActiveCardWord(word);
    setMenuVisible(true);
  }, []);

  const renderItem = useCallback(
    ({ item: word, index }: { item: WordType; index: number }) => {
      const cardBg = randomColors[index % randomColors.length];
      const isSelected = selectedIds.has(word.id!);
      return (
        <WordCard
          word={word}
          index={index}
          numColumns={numColumns}
          searchQuery={searchQuery}
          showPinyin={showPinyin}
          showMeaning={showMeaning}
          cardBg={cardBg}
          isPlaying={playingId === (word.id || index + 1)}
          onPlayAudio={handlePlayAudio}
          isSelected={isSelected}
          isSelectionMode={isSelectionMode}
          onLongPress={handleCardLongPress}
          onPress={handleCardPress}
          onOptionsPress={handleCardOptionsPress}
        />
      );
    },
    [
      numColumns,
      searchQuery,
      showPinyin,
      showMeaning,
      playingId,
      selectedIds,
      isSelectionMode,
      handlePlayAudio,
      handleCardLongPress,
      handleCardPress,
      handleCardOptionsPress,
    ]
  );

  const isAllSelected = filteredWords.length > 0 && selectedIds.size === filteredWords.length;

  const selectAll = () => {
    setIsSelectionMode(true);
    setSelectedIds(new Set(filteredWords.map((w) => w.id!).filter(Boolean)));
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      selectAll();
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Delete Words',
      `Are you sure you want to permanently delete ${selectedIds.size} word${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteWords([...selectedIds]);
              exitSelectionMode();
              loadData();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete words.');
            }
          },
        },
      ]
    );
  };

  // Build options for the modal depending on context
  const buildMenuOptions = () => {
    if (activeCardWord) {
      // Single-card menu opened via 3-dots
      const wId = activeCardWord.id!;
      const isAlreadySelected = selectedIds.has(wId);
      return [
        {
          id: 'view',
          label: 'View Details',
          iconName: 'external-link',
          color: '#059669',
          onPress: () => {
            setMenuVisible(false);
            setActiveCardWord(null);
            router.push(`/pages/wordDetails/${wId}` as any);
          },
        },
        {
          id: 'select',
          label: isAlreadySelected ? 'Deselect' : 'Select',
          iconName: 'check-square',
          color: '#059669',
          onPress: () => {
            if (!isSelectionMode) {
              setIsSelectionMode(true);
              setSelectedIds(new Set([wId]));
            } else {
              toggleSelection(wId);
            }
            setMenuVisible(false);
            setActiveCardWord(null);
          },
        },
        {
          id: 'delete',
          label: `Delete "${activeCardWord.content}"`,
          iconName: 'trash-2',
          destructive: true,
          onPress: () => {
            setMenuVisible(false);
            setActiveCardWord(null);
            Alert.alert(
              'Delete Word',
              `Are you sure you want to delete "${activeCardWord.content}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    try { deleteWords([wId]); loadData(); } catch (e) { Alert.alert('Error', 'Failed to delete.'); }
                  },
                },
              ]
            );
          },
        },
      ];
    }

    // Generic header-level menu
    return [
      ...(isSelectionMode && selectedIds.size > 0
        ? [
            {
              id: 'delete',
              label: `Delete ${selectedIds.size} selected`,
              iconName: 'trash-2',
              destructive: true,
              onPress: handleDeleteSelected,
            },
          ]
        : []),
      {
        id: 'selectAll',
        label: 'Select All',
        iconName: 'check-square',
        color: '#059669',
        onPress: () => { selectAll(); setMenuVisible(false); },
      },
      ...(isSelectionMode
        ? [
            {
              id: 'cancel',
              label: 'Cancel Selection',
              iconName: 'x-circle',
              color: '#64748b',
              onPress: () => { exitSelectionMode(); setMenuVisible(false); },
            },
          ]
        : [
            {
              id: 'startSelect',
              label: 'Select Items',
              iconName: 'check-square',
              color: '#059669',
              onPress: () => { setIsSelectionMode(true); setMenuVisible(false); },
            },
            {
              id: 'add',
              label: 'Add New Word',
              iconName: 'plus-circle',
              color: '#059669',
              onPress: () => { setMenuVisible(false); router.push('/pages/addWord'); },
            },
          ]),
    ];
  };

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={!isSelectionMode}
        label={isSelectionMode ? `${selectedIds.size} selected` : 'Words'}
        subtitle={!isSelectionMode ? (activeFilterLabel || undefined) : undefined}
        onBack={isSelectionMode ? exitSelectionMode : undefined}
        items={
          isSelectionMode
            ? [
                <TouchableOpacity
                  key="selectAll"
                  onPress={toggleSelectAll}
                  activeOpacity={0.8}
                  style={[
                    styles.headerSelectAllBtn,
                    isAllSelected && styles.headerSelectAllBtnActive,
                  ]}
                >
                  <Lucide
                    name={isAllSelected ? "check-check" : "check-square"}
                    size={19}
                    color={isAllSelected ? "#2563eb" : "#475569"}
                  />
                </TouchableOpacity>,
                <TouchableOpacity
                  key="trash"
                  onPress={handleDeleteSelected}
                  activeOpacity={0.8}
                  style={[styles.headerTrashBtn, selectedIds.size === 0 && { opacity: 0.4 }]}
                  disabled={selectedIds.size === 0}
                >
                  <Lucide name="trash-2" size={19} color="#ffffff" />
                </TouchableOpacity>,
              ]
            : [
                <HeaderFilterButton
                  key="filter-toggle"
                  isOpen={isControlBarOpen}
                  onToggle={() => setIsControlBarOpen((prev) => !prev)}
                  hasActiveFilter={Boolean(searchQuery)}
                  accentColor="#059669"
                />,
                <TouchableOpacity
                  key="loop"
                  onPress={handleOpenListeningLoop}
                  activeOpacity={0.7}
                  style={styles.actionBtnIcon}
                >
                  <Lucide name="headphones" size={19} color="#ec4899" />
                </TouchableOpacity>,
                <TouchableOpacity
                  key="add"
                  onPress={() => router.push('/pages/addWord')}
                  activeOpacity={0.7}
                  style={styles.actionBtnIcon}
                >
                  <Lucide name="plus" size={20} color="#373737ff" />
                </TouchableOpacity>,
              ]
        }
      />

      <CollapsibleControlBar
        isOpen={isControlBarOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search words, pinyin, meaning..."
        filterBadgeLabel={activeFilterLabel || undefined}
        count={filteredWords.length}
        totalCount={words.length}
        countLabel="words"
        singleUnit="word"
        accentColor="#059669"
        showPinyin={showPinyin}
        setShowPinyin={setShowPinyin}
        showMeaning={showMeaning}
        setShowMeaning={setShowMeaning}
      />

      <View style={styles.scrollWrapper} {...pinchResponder.panHandlers}>
        <FlatList
          key={`words-grid-${numColumns}`}
          data={displayedWords}
          keyExtractor={(item, index) => String(item.id || index)}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          renderItem={renderItem}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10b981"
              colors={['#10b981']}
            />
          }
          ListFooterComponent={
            filteredWords.length > 0 ? (
              <LoadMoreFooter
                currentCount={displayedWords.length}
                totalCount={filteredWords.length}
                pageSize={PAGE_SIZE}
                accentColor="#10b981"
                itemLabel="words"
                onLoadMore={handleLoadMore}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Lucide name="languages" size={40} color="#cbd5e1" />
              <ThemedText style={styles.emptyText}>
                {searchQuery
                  ? 'No matching words found'
                  : activeFilterLabel
                  ? `No words found for ${activeFilterLabel}`
                  : 'No vocabulary words available'}
              </ThemedText>
            </View>
          }
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={5}
          removeClippedSubviews={true}
        />

        {showColsHint && (
          <View style={styles.colsHintBadge} pointerEvents="none">
            <Lucide name="grid" size={15} color="#ffffff" />
            <Text style={styles.colsHintText}>{numColumns} Columns</Text>
          </View>
        )}
      </View>

      <OptionsMenuModal
        visible={menuVisible}
        onClose={() => { setMenuVisible(false); setActiveCardWord(null); }}
        title={activeCardWord ? `"${activeCardWord.content}" Options` : isSelectionMode ? `${selectedIds.size} selected` : 'Options'}
        options={buildMenuOptions()}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actionBtnIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  headerSelectAllBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  headerSelectAllBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  headerTrashBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollWrapper: {
    width: '100%',
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    width: '100%',
    flex: 1,
  },
  colsHintBadge: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 100,
  },
  colsHintText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  columnWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: 2,
    paddingBottom: 24,
    paddingTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

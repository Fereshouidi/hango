import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import {
  deleteWords,
  getAllWords,
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

const PAGE_SIZE = 10;

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

  const handlePlayAudio = (id: number, text: string) => {
    setPlayingId(id);
    speakChineseText(
      text,
      () => setPlayingId(id),
      () => setPlayingId(null)
    );
  };

  // ── Selection mode helpers ──────────────────────────────────────────────
  const enterSelectionMode = (id: number) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setActiveCardWord(null);
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredWords.map((w) => w.id!).filter(Boolean)));
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
                  key="trash"
                  onPress={handleDeleteSelected}
                  activeOpacity={0.8}
                  style={styles.headerTrashBtn}
                >
                  <Lucide name="trash-2" size={18} color="#ffffff" />
                  <Text style={styles.headerTrashText}>
                    Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                  </Text>
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

      <ScrollView
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
      >
        {filteredWords.length > 0 ? (
          <>
            {displayedWords.map((word, index) => {
              const cardBg = randomColors[index % randomColors.length];
              const isSelected = selectedIds.has(word.id!);
              return (
                <WordCard
                  key={word.id || index}
                  word={word}
                  index={index}
                  showPinyin={showPinyin}
                  showMeaning={showMeaning}
                  cardBg={cardBg}
                  isPlaying={playingId === (word.id || index + 1)}
                  onPlayAudio={handlePlayAudio}
                  isSelected={isSelected}
                  isSelectionMode={isSelectionMode}
                  onLongPress={() => enterSelectionMode(word.id!)}
                  onPress={isSelectionMode ? () => toggleSelection(word.id!) : undefined}
                  onOptionsPress={() => {
                    setActiveCardWord(word);
                    setMenuVisible(true);
                  }}
                />
              );
            })}

            <LoadMoreFooter
              currentCount={displayedWords.length}
              totalCount={filteredWords.length}
              pageSize={PAGE_SIZE}
              accentColor="#10b981"
              itemLabel="words"
              onLoadMore={handleLoadMore}
            />
          </>
        ) : (
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
        )}
      </ScrollView>

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
  headerTrashBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerTrashText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollView: {
    width: '100%',
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 0,
    paddingBottom: 24,
    paddingTop: 8,
    // gap: 6,
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

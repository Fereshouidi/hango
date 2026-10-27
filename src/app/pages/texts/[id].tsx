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
  deleteText,
  deleteTexts,
  getAllTexts,
  getCharacterById,
  getHSKById,
  getLessonById,
  getRuleById,
  getSentenceById,
  getTextById,
  getTextsByCharacterId,
  getTextsByHSKId,
  getTextsByLessonId,
  getTextsByRuleId,
  getTextsBySentenceId,
  getTextsByWordId,
  getWordById,
} from '@/db/utils';
import { TextType } from '@/types';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { randomColors } from '@/constants/theme';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { TextCard } from '@/components/cards/TextCard';
import {
  CollapsibleControlBar,
  HeaderFilterButton,
} from '@/components/common/CollapsibleControlBar';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { EmptyState } from '@/components/common/EmptyState';
import { OptionsMenuModal } from '@/components/common/OptionsMenuModal';
import { speakChineseText } from '@/utils/tts';

const PAGE_SIZE = 10;

export default function TextsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    hskId?: string;
    lessonId?: string;
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
  const sentenceId = parseNum(params.sentenceId);
  const wordId = parseNum(params.wordId);
  const characterId = parseNum(params.characterId || params.caracterid);
  const ruleId = parseNum(params.ruleId);
  const genericId = parseNum(params.id);
  const isGlobalScope = params.scope === 'global';

  const [texts, setTexts] = useState<TextType[]>([]);
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
  const [activeCardText, setActiveCardText] = useState<TextType | null>(null);

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
    else if (sentenceId > 0) baseLabel = `Sentence ${sentenceId}`;
    else if (wordId > 0) baseLabel = `Word ${wordId}`;
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
      let data: TextType[] = [];

      if (isGlobalScope) {
        data = getAllTexts() as unknown as TextType[];
      } else if (hskId > 0) {
        data = getTextsByHSKId(hskId) as unknown as TextType[];
      } else if (lessonId > 0) {
        data = getTextsByLessonId(lessonId) as unknown as TextType[];
      } else if (sentenceId > 0) {
        data = getTextsBySentenceId(sentenceId) as unknown as TextType[];
      } else if (wordId > 0) {
        data = getTextsByWordId(wordId) as unknown as TextType[];
      } else if (characterId > 0) {
        data = getTextsByCharacterId(characterId) as unknown as TextType[];
      } else if (ruleId > 0) {
        data = getTextsByRuleId(ruleId) as unknown as TextType[];
      } else if (genericId > 0) {
        data = getTextsByLessonId(genericId) as unknown as TextType[];
        if (!data || data.length === 0) {
          data = getTextsByHSKId(genericId) as unknown as TextType[];
        }
      } else {
        data = getAllTexts() as unknown as TextType[];
      }

      setTexts(data || []);
    } catch (e) {
      console.error('Failed to load texts:', e);
    }
  }, [isGlobalScope, hskId, lessonId, sentenceId, wordId, characterId, ruleId, genericId]);

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

  const wideSearchHighlightStyle = searchQuery.trim() ? { color: '#ef4444', fontWeight: '700' as const } : undefined;

  const q = searchQuery.toLowerCase().trim();
  const filteredTexts = texts.filter(
    (t) =>
      !q ||
      (t.title || '').toLowerCase().includes(q) ||
      (t.content || '').toLowerCase().includes(q) ||
      (t.pinyin || '').toLowerCase().includes(q) ||
      (t.meaning || '').toLowerCase().includes(q)
  );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, hskId, lessonId, sentenceId, wordId, characterId, ruleId, genericId]);

  const displayedTexts = filteredTexts.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredTexts.length));
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 180;
    if (isCloseToBottom && visibleCount < filteredTexts.length) {
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

  // Selection mode helpers
  const enterSelectionMode = (id: number) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setActiveCardText(null);
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

  const isAllSelected = filteredTexts.length > 0 && selectedIds.size === filteredTexts.length;

  const selectAll = () => {
    setIsSelectionMode(true);
    setSelectedIds(new Set(filteredTexts.map((t) => t.id!).filter(Boolean)));
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
      'Delete Texts',
      `Are you sure you want to permanently delete ${selectedIds.size} text${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteTexts([...selectedIds]);
              exitSelectionMode();
              loadData();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete texts.');
            }
          },
        },
      ]
    );
  };

  const buildMenuOptions = () => {
    if (activeCardText) {
      const tId = activeCardText.id!;
      const isAlreadySelected = selectedIds.has(tId);
      return [
        {
          id: 'view',
          label: 'View Details',
          iconName: 'external-link',
          color: '#3b82f6',
          onPress: () => { setMenuVisible(false); setActiveCardText(null); router.push(`/pages/textDetails/${tId}` as any); },
        },
        {
          id: 'select',
          label: isAlreadySelected ? 'Deselect' : 'Select',
          iconName: 'check-square',
          color: '#3b82f6',
          onPress: () => {
            if (!isSelectionMode) { setIsSelectionMode(true); setSelectedIds(new Set([tId])); }
            else toggleSelection(tId);
            setMenuVisible(false); setActiveCardText(null);
          },
        },
        {
          id: 'delete',
          label: 'Delete this text',
          iconName: 'trash-2',
          destructive: true,
          onPress: () => {
            setMenuVisible(false); setActiveCardText(null);
            Alert.alert('Delete Text', 'Delete this text permanently?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { try { deleteText(tId); loadData(); } catch { Alert.alert('Error', 'Failed to delete.'); } } },
            ]);
          },
        },
      ];
    }
    return [
      ...(isSelectionMode && selectedIds.size > 0
        ? [{ id: 'delete', label: `Delete ${selectedIds.size} selected`, iconName: 'trash-2', destructive: true, onPress: handleDeleteSelected }]
        : []),
      { id: 'selectAll', label: 'Select All', iconName: 'check-square', color: '#3b82f6', onPress: () => { selectAll(); setMenuVisible(false); } },
      ...(isSelectionMode
        ? [{ id: 'cancel', label: 'Cancel Selection', iconName: 'x-circle', color: '#64748b', onPress: () => { exitSelectionMode(); setMenuVisible(false); } }]
        : [
            { id: 'startSelect', label: 'Select Items', iconName: 'check-square', color: '#3b82f6', onPress: () => { setIsSelectionMode(true); setMenuVisible(false); } },
            { id: 'add', label: 'Add New Text', iconName: 'plus-circle', color: '#3b82f6', onPress: () => { setMenuVisible(false); router.push('/pages/addText'); } },
          ]),
    ];
  };

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={!isSelectionMode}
        label={isSelectionMode ? `${selectedIds.size} Selected` : 'Texts'}
        subtitle={activeFilterLabel || undefined}
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
                  accentColor="#3b82f6"
                />,
                <TouchableOpacity
                  key="loop"
                  onPress={() =>
                    router.push(
                      `/pages/listeningLoop?type=texts${hskId ? `&hskId=${hskId}` : ''}${lessonId ? `&lessonId=${lessonId}` : ''}` as any
                    )
                  }
                   style={styles.actionBtnIcon}
                  activeOpacity={0.7}
                >
                  <Lucide name="headphones" size={19} color="#ec4899" />
                </TouchableOpacity>,
                <TouchableOpacity
                  key="add"
                  onPress={() => router.push('/pages/addText')}
                   style={styles.actionBtnIcon}
                  activeOpacity={0.7}
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
        placeholder="Search passages, pinyin, meaning..."
        filterBadgeLabel={activeFilterLabel || undefined}
        count={filteredTexts.length}
        totalCount={texts.length}
        countLabel="texts"
        singleUnit="text"
        accentColor="#3b82f6"
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
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
      >
        {filteredTexts.length > 0 ? (
          <>
            {displayedTexts.map((textItem, index) => {
              const cardBg = randomColors[index % randomColors.length];
              const textObjId = textItem.id!;
              const isSelected = selectedIds.has(textObjId);

              return (
                <TextCard
                  key={textObjId || index}
                  textObj={textItem}
                  index={index}
                  searchQuery={searchQuery}
                  highlightStyle={wideSearchHighlightStyle}
                  showPinyin={showPinyin}
                  showMeaning={showMeaning}
                  cardBg={cardBg}
                  isPlaying={playingId === (textObjId || index + 1)}
                  onPlayAudio={handlePlayAudio}
                  isSelected={isSelected}
                  isSelectionMode={isSelectionMode}
                  onLongPress={() => enterSelectionMode(textObjId)}
                  onPress={isSelectionMode ? () => toggleSelection(textObjId) : undefined}
                  onOptionsPress={() => { setActiveCardText(textItem); setMenuVisible(true); }}
                />
              );
            })}

            <LoadMoreFooter
              currentCount={displayedTexts.length}
              totalCount={filteredTexts.length}
              pageSize={PAGE_SIZE}
              accentColor="#3b82f6"
              itemLabel="texts"
              onLoadMore={handleLoadMore}
            />
          </>
        ) : (
          <EmptyState
            type="texts"
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            filterLabel={activeFilterLabel || undefined}
            onClearFilter={() => router.push('/pages/texts/0?scope=global' as any)}
          />
        )}
      </ScrollView>

      <OptionsMenuModal
        visible={menuVisible}
        onClose={() => { setMenuVisible(false); setActiveCardText(null); }}
        title={activeCardText ? 'Text Options' : isSelectionMode ? `${selectedIds.size} selected` : 'Options'}
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
  scrollView: {
    width: '100%',
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: 5,
    paddingBottom: 24,
    paddingTop: 5,
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


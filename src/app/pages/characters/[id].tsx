import { CharacterCard } from '@/components/cards/CharacterCard';
import {
  CollapsibleControlBar,
  HeaderFilterButton,
} from '@/components/common/CollapsibleControlBar';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { OptionsMenuModal } from '@/components/common/OptionsMenuModal';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { randomColors } from '@/constants/theme';
import {
  deleteCharacter,
  deleteCharacters,
  getAllCharacters,
  getCharactersByHSKId,
  getCharactersByLessonId,
  getCharactersByRuleId,
  getCharactersBySentenceId,
  getCharactersByTextId,
  getCharactersByWordId
} from '@/db/utils';
import { CharacterType } from '@/types';
import { speakChineseText } from '@/utils/tts';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

const PAGE_SIZE = 10;

export default function CharactersScreen() {
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
  const wordId = parseNum(params.wordId);
  const ruleId = parseNum(params.ruleId);
  const genericId = parseNum(params.id);
  const isGlobalScope = params.scope === 'global';

  const [characters, setCharacters] = useState<CharacterType[]>([]);
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
  const [activeCardChar, setActiveCardChar] = useState<CharacterType | null>(null);

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
    else if (wordId > 0) baseLabel = `Word ${wordId}`;
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
      let data: CharacterType[] = [];

      if (isGlobalScope) {
        data = getAllCharacters() as unknown as CharacterType[];
      } else if (hskId > 0) {
        data = getCharactersByHSKId(hskId) as unknown as CharacterType[];
      } else if (lessonId > 0) {
        data = getCharactersByLessonId(lessonId) as unknown as CharacterType[];
      } else if (textId > 0) {
        data = getCharactersByTextId(textId) as unknown as CharacterType[];
      } else if (sentenceId > 0) {
        data = getCharactersBySentenceId(sentenceId) as unknown as CharacterType[];
      } else if (wordId > 0) {
        data = getCharactersByWordId(wordId) as unknown as CharacterType[];
      } else if (ruleId > 0) {
        data = getCharactersByRuleId(ruleId) as unknown as CharacterType[];
      } else if (genericId > 0) {
        data = getCharactersByLessonId(genericId) as unknown as CharacterType[];
        if (!data || data.length === 0) {
          data = getCharactersByHSKId(genericId) as unknown as CharacterType[];
        }
      } else {
        data = getAllCharacters() as unknown as CharacterType[];
      }

      setCharacters(data || []);
    } catch (e) {
      console.error('Failed to load characters:', e);
    }
  }, [isGlobalScope, hskId, lessonId, textId, sentenceId, wordId, ruleId, genericId]);

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
  const filteredCharacters = characters.filter(
    (c) =>
      !q ||
      (c.content || '').toLowerCase().includes(q) ||
      (c.pinyin || '').toLowerCase().includes(q) ||
      (c.meaning || '').toLowerCase().includes(q)
  );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, hskId, lessonId, textId, sentenceId, wordId, ruleId, genericId]);

  const displayedCharacters = filteredCharacters.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredCharacters.length));
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 180;
    if (isCloseToBottom && visibleCount < filteredCharacters.length) {
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
    setActiveCardChar(null);
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

  const isAllSelected = filteredCharacters.length > 0 && selectedIds.size === filteredCharacters.length;

  const selectAll = () => {
    setIsSelectionMode(true);
    setSelectedIds(new Set(filteredCharacters.map((c) => c.id!).filter(Boolean)));
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
      'Delete Characters',
      `Are you sure you want to permanently delete ${selectedIds.size} character${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteCharacters([...selectedIds]);
              exitSelectionMode();
              loadData();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete characters.');
            }
          },
        },
      ]
    );
  };

  const buildMenuOptions = () => {
    if (activeCardChar) {
      const cId = activeCardChar.id!;
      const isAlreadySelected = selectedIds.has(cId);
      return [
        {
          id: 'view',
          label: 'View Details',
          iconName: 'external-link',
          color: '#ec4899',
          onPress: () => { setMenuVisible(false); setActiveCardChar(null); router.push(`/pages/characterDetails/${cId}` as any); },
        },
        {
          id: 'select',
          label: isAlreadySelected ? 'Deselect' : 'Select',
          iconName: 'check-square',
          color: '#ec4899',
          onPress: () => {
            if (!isSelectionMode) { setIsSelectionMode(true); setSelectedIds(new Set([cId])); }
            else toggleSelection(cId);
            setMenuVisible(false); setActiveCardChar(null);
          },
        },
        {
          id: 'delete',
          label: `Delete "${activeCardChar.content}"`,
          iconName: 'trash-2',
          destructive: true,
          onPress: () => {
            setMenuVisible(false); setActiveCardChar(null);
            Alert.alert('Delete Character', `Delete "${activeCardChar.content}" permanently?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { try { deleteCharacter(cId); loadData(); } catch { Alert.alert('Error', 'Failed to delete.'); } } },
            ]);
          },
        },
      ];
    }
    return [
      ...(isSelectionMode && selectedIds.size > 0
        ? [{ id: 'delete', label: `Delete ${selectedIds.size} selected`, iconName: 'trash-2', destructive: true, onPress: handleDeleteSelected }]
        : []),
      { id: 'selectAll', label: 'Select All', iconName: 'check-square', color: '#ec4899', onPress: () => { selectAll(); setMenuVisible(false); } },
      ...(isSelectionMode
        ? [{ id: 'cancel', label: 'Cancel Selection', iconName: 'x-circle', color: '#64748b', onPress: () => { exitSelectionMode(); setMenuVisible(false); } }]
        : [
          { id: 'startSelect', label: 'Select Items', iconName: 'check-square', color: '#ec4899', onPress: () => { setIsSelectionMode(true); setMenuVisible(false); } },
          { id: 'add', label: 'Add New Character', iconName: 'plus-circle', color: '#ec4899', onPress: () => { setMenuVisible(false); router.push('/pages/addCharacter'); } },
        ]),
    ];
  };

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={!isSelectionMode}
        label={isSelectionMode ? `${selectedIds.size} Selected` : 'Characters'}
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
                accentColor="#ec4899"
              />,
              <TouchableOpacity
                key="add"
                onPress={() => router.push('/pages/addCharacter')}
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
        placeholder="Search characters, pinyin, meaning..."
        filterBadgeLabel={activeFilterLabel || undefined}
        count={filteredCharacters.length}
        totalCount={characters.length}
        countLabel="characters"
        singleUnit="character"
        accentColor="#ec4899"
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
            tintColor="#ec4899"
            colors={['#ec4899']}
          />
        }
      >
        {filteredCharacters.length > 0 ? (
          <>
            <View style={styles.gridContainer}>
              {displayedCharacters.map((char, index) => {
                const cardBg = randomColors[index % randomColors.length];
                const charId = char.id!;
                const isSelected = selectedIds.has(charId);

                return (
                  <View key={charId || index} style={{ width: '48.5%' }}>
                    <CharacterCard
                      char={char}
                      index={index}
                      showPinyin={showPinyin}
                      showMeaning={showMeaning}
                      cardBg={cardBg}
                      isPlaying={playingId === (charId || index + 1)}
                      onPlayAudio={handlePlayAudio}
                      isSelected={isSelected}
                      isSelectionMode={isSelectionMode}
                      onLongPress={() => enterSelectionMode(charId)}
                      onPress={isSelectionMode ? () => toggleSelection(charId) : undefined}
                      onOptionsPress={() => { setActiveCardChar(char); setMenuVisible(true); }}
                    />
                  </View>
                );
              })}
            </View>

            <LoadMoreFooter
              currentCount={displayedCharacters.length}
              totalCount={filteredCharacters.length}
              pageSize={PAGE_SIZE}
              accentColor="#ec4899"
              itemLabel="characters"
              onLoadMore={handleLoadMore}
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Lucide name="spell-check" size={40} color="#cbd5e1" />
            <ThemedText style={styles.emptyText}>
              {searchQuery
                ? 'No matching characters found'
                : activeFilterLabel
                  ? `No characters found for ${activeFilterLabel}`
                  : 'No characters available'}
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <OptionsMenuModal
        visible={menuVisible}
        onClose={() => { setMenuVisible(false); setActiveCardChar(null); }}
        title={activeCardChar ? `"${activeCardChar.content}" Options` : isSelectionMode ? `${selectedIds.size} selected` : 'Options'}
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
    paddingTop: 8,
    paddingBottom: 30,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },
});


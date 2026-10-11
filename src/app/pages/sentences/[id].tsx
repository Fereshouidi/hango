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
  deleteSentence,
  deleteSentences,
  getAllSentences,
  getSentencesByCharacterId,
  getSentencesByHSKId,
  getSentencesByLessonId,
  getSentencesByRuleId,
  getSentencesByTextId,
  getSentencesByWordId,
} from '@/db/utils';
import { SentenceType } from '@/types';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { randomColors } from '@/constants/theme';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SentenceCard } from '@/components/cards/SentenceCard';
import {
  CollapsibleControlBar,
  HeaderFilterButton,
} from '@/components/common/CollapsibleControlBar';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { OptionsMenuModal } from '@/components/common/OptionsMenuModal';
import { speakChineseText } from '@/utils/tts';

const PAGE_SIZE = 10;

export default function SentencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    hskId?: string;
    lessonId?: string;
    textId?: string;
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
  const wordId = parseNum(params.wordId);
  const characterId = parseNum(params.characterId || params.caracterid);
  const ruleId = parseNum(params.ruleId);
  const genericId = parseNum(params.id);
  const isGlobalScope = params.scope === 'global';

  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(params.search || '');
  const [isControlBarOpen, setIsControlBarOpen] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeCardSentence, setActiveCardSentence] = useState<SentenceType | null>(null);

  useEffect(() => {
    if (params.search !== undefined) setSearchQuery(params.search);
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
    else if (wordId > 0) baseLabel = `Word ${wordId}`;
    else if (characterId > 0) baseLabel = `Character ${characterId}`;
    else if (ruleId > 0) baseLabel = `Rule ${ruleId}`;
    else if (genericId > 0) baseLabel = `ID ${genericId}`;
    if (isGlobalScope) return baseLabel ? `${baseLabel} (Global)` : 'All DB Search';
    return baseLabel;
  };

  const activeFilterLabel = getFilterBadgeLabel();

  const loadData = useCallback(() => {
    try {
      let data: SentenceType[] = [];
      if (isGlobalScope) data = getAllSentences() as unknown as SentenceType[];
      else if (hskId > 0) data = getSentencesByHSKId(hskId) as unknown as SentenceType[];
      else if (lessonId > 0) data = getSentencesByLessonId(lessonId) as unknown as SentenceType[];
      else if (textId > 0) data = getSentencesByTextId(textId) as unknown as SentenceType[];
      else if (wordId > 0) data = getSentencesByWordId(wordId) as unknown as SentenceType[];
      else if (characterId > 0) data = getSentencesByCharacterId(characterId) as unknown as SentenceType[];
      else if (ruleId > 0) data = getSentencesByRuleId(ruleId) as unknown as SentenceType[];
      else if (genericId > 0) {
        data = getSentencesByLessonId(genericId) as unknown as SentenceType[];
        if (!data || data.length === 0) data = getSentencesByHSKId(genericId) as unknown as SentenceType[];
      } else data = getAllSentences() as unknown as SentenceType[];
      setSentences(data || []);
    } catch (e) { console.error('Failed to load sentences:', e); }
  }, [isGlobalScope, hskId, lessonId, textId, wordId, characterId, ruleId, genericId]);

  useFocusEffect(useCallback(() => { loadData(); exitSelectionMode(); }, [loadData]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 400);
  }, [loadData]);

  const q = searchQuery.toLowerCase().trim();
  const filteredSentences = sentences.filter(
    (s) => !q || (s.content || '').toLowerCase().includes(q) || (s.pinyin || '').toLowerCase().includes(q) || (s.meaning || '').toLowerCase().includes(q)
  );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchQuery, hskId, lessonId, textId, wordId, characterId, ruleId, genericId]);

  const displayedSentences = filteredSentences.slice(0, visibleCount);
  const handleLoadMore = () => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredSentences.length));
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 180 && visibleCount < filteredSentences.length) handleLoadMore();
  };
  const handlePlayAudio = (id: number, text: string) => {
    setPlayingId(id);
    speakChineseText(text, () => setPlayingId(id), () => setPlayingId(null));
  };

  const exitSelectionMode = () => { setIsSelectionMode(false); setSelectedIds(new Set()); setActiveCardSentence(null); };
  const enterSelectionMode = (id: number) => { setIsSelectionMode(true); setSelectedIds(new Set([id])); };
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
  const selectAll = () => setSelectedIds(new Set(filteredSentences.map((s) => s.id!).filter(Boolean)));

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert('Delete Sentences', `Delete ${selectedIds.size} sentence${selectedIds.size > 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { try { deleteSentences([...selectedIds]); exitSelectionMode(); loadData(); } catch { Alert.alert('Error', 'Failed to delete sentences.'); } } },
    ]);
  };

  const buildMenuOptions = () => {
    if (activeCardSentence) {
      const sId = activeCardSentence.id!;
      const isAlreadySelected = selectedIds.has(sId);
      return [
        {
          id: 'view',
          label: 'View Details',
          iconName: 'external-link',
          color: '#8b5cf6',
          onPress: () => { setMenuVisible(false); setActiveCardSentence(null); router.push(`/pages/sentenceDetails/${sId}` as any); },
        },
        {
          id: 'select',
          label: isAlreadySelected ? 'Deselect' : 'Select',
          iconName: 'check-square',
          color: '#8b5cf6',
          onPress: () => {
            if (!isSelectionMode) { setIsSelectionMode(true); setSelectedIds(new Set([sId])); }
            else toggleSelection(sId);
            setMenuVisible(false); setActiveCardSentence(null);
          },
        },
        {
          id: 'delete',
          label: `Delete this sentence`,
          iconName: 'trash-2',
          destructive: true,
          onPress: () => {
            setMenuVisible(false); setActiveCardSentence(null);
            Alert.alert('Delete Sentence', 'Delete this sentence permanently?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { try { deleteSentence(sId); loadData(); } catch { Alert.alert('Error', 'Failed to delete.'); } } },
            ]);
          },
        },
      ];
    }
    return [
      ...(isSelectionMode && selectedIds.size > 0
        ? [{ id: 'delete', label: `Delete ${selectedIds.size} selected`, iconName: 'trash-2', destructive: true, onPress: handleDeleteSelected }]
        : []),
      { id: 'selectAll', label: 'Select All', iconName: 'check-square', color: '#8b5cf6', onPress: () => { selectAll(); setMenuVisible(false); } },
      ...(isSelectionMode
        ? [{ id: 'cancel', label: 'Cancel Selection', iconName: 'x-circle', color: '#64748b', onPress: () => { exitSelectionMode(); setMenuVisible(false); } }]
        : [
            { id: 'startSelect', label: 'Select Items', iconName: 'check-square', color: '#8b5cf6', onPress: () => { setIsSelectionMode(true); setMenuVisible(false); } },
            { id: 'add', label: 'Add New Sentence', iconName: 'plus-circle', color: '#8b5cf6', onPress: () => { setMenuVisible(false); router.push('/pages/addSentence'); } },
          ]),
    ];
  };

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />
      <Header
        useBackArrow={!isSelectionMode}
        label={isSelectionMode ? `${selectedIds.size} selected` : 'Sentences'}
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
                  accentColor="#8b5cf6"
                />,
                <TouchableOpacity
                  key="loop"
                  onPress={() =>
                    router.push(
                      `/pages/listeningLoop?type=sentences${hskId ? `&hskId=${hskId}` : ''}${lessonId ? `&lessonId=${lessonId}` : ''}${textId ? `&textId=${textId}` : ''}` as any
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Lucide name="headphones" size={19} color="#ec4899" style={styles.actionBtnIcon} />
                </TouchableOpacity>,
                <TouchableOpacity key="add" onPress={() => router.push('/pages/addSentence')} activeOpacity={0.7}>
                  <Lucide name="plus" size={20} color="#373737ff" style={styles.actionBtnIcon} />
                </TouchableOpacity>,
              ]
        }
      />

      <CollapsibleControlBar
        isOpen={isControlBarOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search sentences, pinyin, meaning..."
        filterBadgeLabel={activeFilterLabel || undefined}
        count={filteredSentences.length}
        totalCount={sentences.length}
        countLabel="sentences"
        singleUnit="sentence"
        accentColor="#8b5cf6"
        showPinyin={showPinyin}
        setShowPinyin={setShowPinyin}
        showMeaning={showMeaning}
        setShowMeaning={setShowMeaning}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView} showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={32}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} />}>
        {filteredSentences.length > 0 ? (
          <>
            {displayedSentences.map((sentence, index) => (
              <SentenceCard
                key={sentence.id || index}
                sentence={sentence}
                index={index}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                cardBg={randomColors[index % randomColors.length]}
                isPlaying={playingId === (sentence.id || index + 1)}
                onPlayAudio={handlePlayAudio}
                isSelected={selectedIds.has(sentence.id!)}
                isSelectionMode={isSelectionMode}
                onLongPress={() => enterSelectionMode(sentence.id!)}
                onPress={isSelectionMode ? () => toggleSelection(sentence.id!) : undefined}
                onOptionsPress={() => { setActiveCardSentence(sentence); setMenuVisible(true); }}
              />
            ))}
            <LoadMoreFooter currentCount={displayedSentences.length} totalCount={filteredSentences.length} pageSize={PAGE_SIZE} accentColor="#8b5cf6" itemLabel="sentences" onLoadMore={handleLoadMore} />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Lucide name="message-square-text" size={40} color="#cbd5e1" />
            <ThemedText style={styles.emptyText}>{searchQuery ? 'No matching sentences found' : activeFilterLabel ? `No sentences found for ${activeFilterLabel}` : 'No sentences available'}</ThemedText>
          </View>
        )}
      </ScrollView>

      <OptionsMenuModal
        visible={menuVisible}
        onClose={() => { setMenuVisible(false); setActiveCardSentence(null); }}
        title={activeCardSentence ? 'Sentence Options' : isSelectionMode ? `${selectedIds.size} selected` : 'Options'}
        options={buildMenuOptions()}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actionBtnIcon: { fontSize: 22, backgroundColor: '#e8e8e8ff', borderRadius: 50, width: 40, height: 40, textAlign: 'center', textAlignVertical: 'center', borderWidth: 1, borderColor: '#414040ff' },
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
  scrollView: { width: '100%', flex: 1 },
  scrollContent: { width: '100%', paddingHorizontal: 8, paddingBottom: 24, paddingTop: 8 },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});

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
  deleteRule,
  deleteRules,
  getAllRules,
  getCharacterById,
  getHSKById,
  getLessonById,
  getRuleById,
  getRulesByCharacterId,
  getRulesByHSKId,
  getRulesByLessonId,
  getRulesBySentenceId,
  getRulesByTextId,
  getRulesByWordId,
  getSentenceById,
  getTextById,
  getWordById,
} from '@/db/utils';
import { RuleType } from '@/types';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { randomColors } from '@/constants/theme';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { RuleCard } from '@/components/cards/RuleCard';
import {
  CollapsibleControlBar,
  HeaderFilterButton,
} from '@/components/common/CollapsibleControlBar';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { EmptyState } from '@/components/common/EmptyState';
import { OptionsMenuModal } from '@/components/common/OptionsMenuModal';
import { speakEnglishText } from '@/utils/tts';

const PAGE_SIZE = 10;

export default function RulesScreen() {
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
  const characterId = parseNum(params.characterId || params.caracterid);
  const ruleId = parseNum(params.ruleId);
  const genericId = parseNum(params.id);
  const isGlobalScope = params.scope === 'global';

  const [rules, setRules] = useState<RuleType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(params.search || '');
  const [isControlBarOpen, setIsControlBarOpen] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);

  // Selection mode & card menu state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeCardRule, setActiveCardRule] = useState<RuleType | null>(null);

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
      let data: RuleType[] = [];

      if (isGlobalScope) {
        data = getAllRules() as unknown as RuleType[];
      } else if (hskId > 0) {
        data = getRulesByHSKId(hskId) as unknown as RuleType[];
      } else if (lessonId > 0) {
        data = getRulesByLessonId(lessonId) as unknown as RuleType[];
      } else if (textId > 0) {
        data = getRulesByTextId(textId) as unknown as RuleType[];
      } else if (sentenceId > 0) {
        data = getRulesBySentenceId(sentenceId) as unknown as RuleType[];
      } else if (wordId > 0) {
        data = getRulesByWordId(wordId) as unknown as RuleType[];
      } else if (characterId > 0) {
        data = getRulesByCharacterId(characterId) as unknown as RuleType[];
      } else if (genericId > 0) {
        data = getRulesByLessonId(genericId) as unknown as RuleType[];
        if (!data || data.length === 0) {
          data = getRulesByHSKId(genericId) as unknown as RuleType[];
        }
      } else {
        data = getAllRules() as unknown as RuleType[];
      }

      setRules(data || []);
    } catch (e) {
      console.error('Failed to load rules:', e);
    }
  }, [isGlobalScope, hskId, lessonId, textId, sentenceId, wordId, characterId, genericId]);

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
  const filteredRules = rules.filter(
    (r) =>
      !q ||
      ((r as any).title || '').toLowerCase().includes(q) ||
      (r.content || '').toLowerCase().includes(q)
  );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, hskId, lessonId, textId, sentenceId, wordId, characterId, genericId]);

  const displayedRules = filteredRules.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredRules.length));
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 180;
    if (isCloseToBottom && visibleCount < filteredRules.length) {
      handleLoadMore();
    }
  };

  const handlePlayAudio = (id: number, text: string) => {
    setPlayingId(id);
    speakEnglishText(
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
    setActiveCardRule(null);
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

  const isAllSelected = filteredRules.length > 0 && selectedIds.size === filteredRules.length;

  const selectAll = () => {
    setIsSelectionMode(true);
    setSelectedIds(new Set(filteredRules.map((r) => r.id!).filter(Boolean)));
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
      'Delete Rules',
      `Are you sure you want to permanently delete ${selectedIds.size} rule${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteRules([...selectedIds]);
              exitSelectionMode();
              loadData();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete rules.');
            }
          },
        },
      ]
    );
  };

  const buildMenuOptions = () => {
    if (activeCardRule) {
      const rId = activeCardRule.id!;
      const rTitle = (activeCardRule as any).title || 'this rule';
      const isAlreadySelected = selectedIds.has(rId);
      return [
        {
          id: 'view',
          label: 'View Details',
          iconName: 'external-link',
          color: '#6366f1',
          onPress: () => { setMenuVisible(false); setActiveCardRule(null); router.push(`/pages/ruleDetails/${rId}` as any); },
        },
        {
          id: 'select',
          label: isAlreadySelected ? 'Deselect' : 'Select',
          iconName: 'check-square',
          color: '#6366f1',
          onPress: () => {
            if (!isSelectionMode) { setIsSelectionMode(true); setSelectedIds(new Set([rId])); }
            else toggleSelection(rId);
            setMenuVisible(false); setActiveCardRule(null);
          },
        },
        {
          id: 'delete',
          label: `Delete "${rTitle}"`,
          iconName: 'trash-2',
          destructive: true,
          onPress: () => {
            setMenuVisible(false); setActiveCardRule(null);
            Alert.alert('Delete Rule', `Delete "${rTitle}" permanently?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { try { deleteRule(rId); loadData(); } catch { Alert.alert('Error', 'Failed to delete.'); } } },
            ]);
          },
        },
      ];
    }
    return [
      ...(isSelectionMode && selectedIds.size > 0
        ? [{ id: 'delete', label: `Delete ${selectedIds.size} selected`, iconName: 'trash-2', destructive: true, onPress: handleDeleteSelected }]
        : []),
      { id: 'selectAll', label: 'Select All', iconName: 'check-square', color: '#6366f1', onPress: () => { selectAll(); setMenuVisible(false); } },
      ...(isSelectionMode
        ? [{ id: 'cancel', label: 'Cancel Selection', iconName: 'x-circle', color: '#64748b', onPress: () => { exitSelectionMode(); setMenuVisible(false); } }]
        : [
            { id: 'startSelect', label: 'Select Items', iconName: 'check-square', color: '#6366f1', onPress: () => { setIsSelectionMode(true); setMenuVisible(false); } },
            { id: 'add', label: 'Add New Rule', iconName: 'plus-circle', color: '#6366f1', onPress: () => { setMenuVisible(false); router.push('/pages/addRule'); } },
          ]),
    ];
  };

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={!isSelectionMode}
        label={isSelectionMode ? `${selectedIds.size} Selected` : 'Grammar Rules'}
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
                  accentColor="#6366f1"
                />,
                <TouchableOpacity
                  key="add"
                  onPress={() => router.push('/pages/addRule')}
                  activeOpacity={0.7}
                  style={styles.actionBtnIcon} 
                >
                  <Lucide name="plus" size={20} color="#373737ff"/>
                </TouchableOpacity>,
              ]
        }
      />

      <CollapsibleControlBar
        isOpen={isControlBarOpen}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search grammar rules & notes..."
        filterBadgeLabel={activeFilterLabel || undefined}
        count={filteredRules.length}
        totalCount={rules.length}
        countLabel="rules"
        singleUnit="rule"
        accentColor="#6366f1"
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
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
      >
        {filteredRules.length > 0 ? (
          <>
            {displayedRules.map((rule, index) => {
              const cardBg = randomColors[index % randomColors.length];
              const ruleId = rule.id!;
              const isSelected = selectedIds.has(ruleId);

              return (
                <RuleCard
                  key={ruleId || index}
                  rule={rule}
                  index={index}
                  cardBg={cardBg}
                  isPlaying={playingId === (ruleId || index + 1)}
                  onPlayAudio={handlePlayAudio}
                  isSelected={isSelected}
                  isSelectionMode={isSelectionMode}
                  onLongPress={() => enterSelectionMode(ruleId)}
                  onPress={isSelectionMode ? () => toggleSelection(ruleId) : undefined}
                  onOptionsPress={() => { setActiveCardRule(rule); setMenuVisible(true); }}
                  searchQuery={searchQuery}
                  highlightStyle={wideSearchHighlightStyle}
                />
              );
            })}

            <LoadMoreFooter
              currentCount={displayedRules.length}
              totalCount={filteredRules.length}
              pageSize={PAGE_SIZE}
              accentColor="#6366f1"
              itemLabel="rules"
              onLoadMore={handleLoadMore}
            />
          </>
        ) : (
          <EmptyState
            type="rules"
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            filterLabel={activeFilterLabel || undefined}
            onClearFilter={() => router.push('/pages/rules/0?scope=global' as any)}
          />
        )}
      </ScrollView>

      <OptionsMenuModal
        visible={menuVisible}
        onClose={() => { setMenuVisible(false); setActiveCardRule(null); }}
        title={activeCardRule ? 'Rule Options' : isSelectionMode ? `${selectedIds.size} selected` : 'Options'}
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
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 5,
    paddingTop: 8,
    paddingBottom: 30,
    gap: 6,
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


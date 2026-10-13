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
import { deleteLesson, deleteLessons, getAllHSKs, getAllLessons, getHSKById, getLessonsByHSKId } from '@/db/utils';
import { HSKType, LessonType } from '@/types';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { randomColors } from '@/constants/theme';
import Lucide from '@react-native-vector-icons/lucide';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LessonCard } from '@/components/cards/LessonCard';
import {
  CollapsibleControlBar,
  HeaderFilterButton,
} from '@/components/common/CollapsibleControlBar';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { OptionsMenuModal } from '@/components/common/OptionsMenuModal';
import { speakChineseText } from '@/utils/tts';

const PAGE_SIZE = 10;

const Lessons = () => {
  const params = useLocalSearchParams<{ id?: string; hskId?: string }>();
  const rawId = params.hskId || params.id;
  const hskId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : 0;
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [hskInfo, setHskInfo] = useState<HSKType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isControlBarOpen, setIsControlBarOpen] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Selection mode & card menu state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeCardLesson, setActiveCardLesson] = useState<LessonType | null>(null);

  // Handle hardware back button to cancel selection mode
  useEffect(() => {
    if (!isSelectionMode) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      exitSelectionMode();
      return true;
    });
    return () => subscription.remove();
  }, [isSelectionMode]);

  const loadData = useCallback(() => {
    try {
      let data: LessonType[] = [];
      if (hskId > 0) {
        data = getLessonsByHSKId(hskId) as unknown as LessonType[];
        setHskInfo(getHSKById(hskId));
      } else {
        data = getAllLessons() as unknown as LessonType[];
        setHskInfo(null);
      }
      setLessons(data || []);
    } catch (e) {
      console.error('Failed to load lessons:', e);
    }
  }, [hskId]);

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

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [hskId]);

  const filteredLessons = lessons.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      l.title.toLowerCase().includes(q) ||
      String(l.num).includes(q) ||
      `lesson ${l.num}`.toLowerCase().includes(q)
    );
  });

  const displayedLessons = filteredLessons.slice(0, visibleCount);

  const handlePlayAudio = (id: number, text: string) => {
    setPlayingId(id);
    speakChineseText(
      text,
      () => setPlayingId(id),
      () => setPlayingId(null)
    );
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredLessons.length));
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 180;
    if (isCloseToBottom && visibleCount < filteredLessons.length) {
      handleLoadMore();
    }
  };

  // Selection mode helpers
  const enterSelectionMode = (id: number) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setActiveCardLesson(null);
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

  const isAllSelected = lessons.length > 0 && selectedIds.size === lessons.length;

  const selectAll = () => {
    setIsSelectionMode(true);
    setSelectedIds(new Set(lessons.map((l) => l.id!).filter(Boolean)));
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
      'Delete Lessons',
      `Are you sure you want to permanently delete ${selectedIds.size} lesson${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteLessons([...selectedIds]);
              exitSelectionMode();
              loadData();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete lessons.');
            }
          },
        },
      ]
    );
  };

  const buildMenuOptions = () => {
    if (activeCardLesson) {
      const lId = activeCardLesson.id!;
      const lName = (activeCardLesson as any).name || (activeCardLesson as any).title || 'this lesson';
      const isAlreadySelected = selectedIds.has(lId);
      return [
        {
          id: 'view',
          label: 'View Details',
          iconName: 'external-link',
          color: '#2563eb',
          onPress: () => { setMenuVisible(false); setActiveCardLesson(null); router.push(`/pages/lessonDetails/${lId}` as any); },
        },
        {
          id: 'select',
          label: isAlreadySelected ? 'Deselect' : 'Select',
          iconName: 'check-square',
          color: '#2563eb',
          onPress: () => {
            if (!isSelectionMode) { setIsSelectionMode(true); setSelectedIds(new Set([lId])); }
            else toggleSelection(lId);
            setMenuVisible(false); setActiveCardLesson(null);
          },
        },
        {
          id: 'delete',
          label: `Delete "${lName}"`,
          iconName: 'trash-2',
          destructive: true,
          onPress: () => {
            setMenuVisible(false); setActiveCardLesson(null);
            Alert.alert('Delete Lesson', `Delete "${lName}" permanently?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { try { deleteLesson(lId); loadData(); } catch { Alert.alert('Error', 'Failed to delete.'); } } },
            ]);
          },
        },
      ];
    }
    return [
      ...(isSelectionMode && selectedIds.size > 0
        ? [{ id: 'delete', label: `Delete ${selectedIds.size} selected`, iconName: 'trash-2', destructive: true, onPress: handleDeleteSelected }]
        : []),
      { id: 'selectAll', label: 'Select All', iconName: 'check-square', color: '#2563eb', onPress: () => { selectAll(); setMenuVisible(false); } },
      ...(isSelectionMode
        ? [{ id: 'cancel', label: 'Cancel Selection', iconName: 'x-circle', color: '#64748b', onPress: () => { exitSelectionMode(); setMenuVisible(false); } }]
        : [
            { id: 'startSelect', label: 'Select Items', iconName: 'check-square', color: '#2563eb', onPress: () => { setIsSelectionMode(true); setMenuVisible(false); } },
            { id: 'add', label: 'Add New Lesson', iconName: 'plus-circle', color: '#2563eb', onPress: () => { setMenuVisible(false); router.push('/pages/addLesson'); } },
          ]),
    ];
  };

  return (
    <ThemedView
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
      }}
    >
      <Bg1 />
      <Header
        useBackArrow={!isSelectionMode}
        label={isSelectionMode ? `${selectedIds.size} Selected` : 'Lessons'}
        subtitle={!isSelectionMode && hskInfo ? hskInfo.name : undefined}
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
                  accentColor="#2563eb"
                />,
                <TouchableOpacity
                  key="add"
                  onPress={() => router.push('/pages/addLesson')}
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
        placeholder="Search lessons by title or number..."
        filterBadgeLabel={hskInfo?.name}
        count={filteredLessons.length}
        totalCount={lessons.length}
        countLabel="lessons"
        singleUnit="lesson"
        accentColor="#2563eb"
      />

      <ScrollView
        contentContainerStyle={{
          width: '100%',
          paddingHorizontal: 5,
          paddingBottom: 24,
          paddingTop: 10,
        }}
        style={{
          width: '100%',
          flex: 1,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563eb"
            colors={['#2563eb']}
          />
        }
      >
        {filteredLessons.length > 0 ? (
          <>
            {displayedLessons.map((lesson, index) => {
              const cardBg = randomColors[index % randomColors.length];
              const lessonId = lesson.id!;
              const isSelected = selectedIds.has(lessonId);

              return (
                <LessonCard
                  key={lessonId || index}
                  lesson={lesson}
                  index={index}
                  cardBg={cardBg}
                  isPlaying={playingId === lessonId}
                  onPlayAudio={handlePlayAudio}
                  accentColor="#2563eb"
                  isSelected={isSelected}
                  isSelectionMode={isSelectionMode}
                  onLongPress={() => enterSelectionMode(lessonId)}
                  onPress={isSelectionMode ? () => toggleSelection(lessonId) : undefined}
                  onOptionsPress={() => { setActiveCardLesson(lesson); setMenuVisible(true); }}
                />
              );
            })}

            <View style={{ width: '100%', marginTop: 12 }}>
              <LoadMoreFooter
                currentCount={displayedLessons.length}
                totalCount={filteredLessons.length}
                pageSize={PAGE_SIZE}
                accentColor="#2563eb"
                itemLabel="lessons"
                onLoadMore={handleLoadMore}
              />
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Lucide name="book-open" size={40} color="#cbd5e1" />
            <ThemedText style={styles.emptyText}>
              {searchQuery
                ? 'No matching lessons found'
                : hskInfo
                ? `No lessons found for ${hskInfo.name}`
                : 'No lessons found'}
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <OptionsMenuModal
        visible={menuVisible}
        onClose={() => { setMenuVisible(false); setActiveCardLesson(null); }}
        title={activeCardLesson ? 'Lesson Options' : isSelectionMode ? `${selectedIds.size} selected` : 'Options'}
        options={buildMenuOptions()}
      />
    </ThemedView>
  );
};

export default Lessons;

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
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
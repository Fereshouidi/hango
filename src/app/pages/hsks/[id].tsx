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
import { deleteHSK, deleteHSKs, getAllHSKs } from '@/db/utils';
import { HSKType } from '@/types';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { randomColors } from '@/constants/theme';
import Lucide from '@react-native-vector-icons/lucide';
import { router, useFocusEffect } from 'expo-router';
import { OptionsMenuModal } from '@/components/common/OptionsMenuModal';

const HSKs = () => {
  const [hsks, setHsks] = useState<HSKType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Selection mode & card menu state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeCardHsk, setActiveCardHsk] = useState<HSKType | null>(null);

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
      const data = getAllHSKs() as unknown as HSKType[];
      setHsks(data || []);
    } catch (e) {
      console.error('Failed to load HSKs:', e);
    }
  }, []);

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

  // Selection mode helpers
  const enterSelectionMode = (id: number) => {
    setIsSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    setActiveCardHsk(null);
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
    setSelectedIds(new Set(hsks.map((h) => h.id!).filter(Boolean)));
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Delete HSK Levels',
      `Are you sure you want to permanently delete ${selectedIds.size} HSK level${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteHSKs([...selectedIds]);
              exitSelectionMode();
              loadData();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete HSK levels.');
            }
          },
        },
      ]
    );
  };

  const buildMenuOptions = () => {
    if (activeCardHsk) {
      const hId = activeCardHsk.id!;
      const hName = activeCardHsk.name || 'this HSK';
      const isAlreadySelected = selectedIds.has(hId);
      return [
        {
          id: 'view',
          label: 'View Details',
          iconName: 'external-link',
          color: '#2563eb',
          onPress: () => {
            setMenuVisible(false); setActiveCardHsk(null);
            router.push({ pathname: '/pages/hskDetails/[id]', params: { id: hId, hskId: hId } } as any);
          },
        },
        {
          id: 'select',
          label: isAlreadySelected ? 'Deselect' : 'Select',
          iconName: 'check-square',
          color: '#2563eb',
          onPress: () => {
            if (!isSelectionMode) { setIsSelectionMode(true); setSelectedIds(new Set([hId])); }
            else toggleSelection(hId);
            setMenuVisible(false); setActiveCardHsk(null);
          },
        },
        {
          id: 'delete',
          label: `Delete "${hName}"`,
          iconName: 'trash-2',
          destructive: true,
          onPress: () => {
            setMenuVisible(false); setActiveCardHsk(null);
            Alert.alert('Delete HSK', `Delete "${hName}" permanently?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { try { deleteHSK(hId); loadData(); } catch { Alert.alert('Error', 'Failed to delete.'); } } },
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
            { id: 'add', label: 'Add New HSK', iconName: 'plus-circle', color: '#2563eb', onPress: () => { setMenuVisible(false); router.push('/pages/addHSK'); } },
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
        label={isSelectionMode ? `${selectedIds.size} Selected` : 'HSKs'}
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
                <TouchableOpacity
                  key="add"
                  onPress={() => router.push('/pages/addHSK')}
                  activeOpacity={0.7}
                >
                  <Lucide name="plus" size={20} color="#373737ff" style={styles.actionBtnIcon} />
                </TouchableOpacity>,
              ]
        }
      />

      <ScrollView
        contentContainerStyle={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingBottom: 20,
          paddingTop: 10,
          paddingHorizontal: 5,
        }}
        style={{
          width: '100%',
          flex: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563eb"
            colors={['#2563eb']}
          />
        }
      >
        {hsks?.length > 0 ? (
          hsks.map((hsk, index) => {
            const hskId = hsk.id!;
            const isSelected = selectedIds.has(hskId);
            const cardBg = randomColors[index % randomColors.length];

            return (
              <TouchableOpacity
                key={hskId || index}
                activeOpacity={0.8}
                onLongPress={() => enterSelectionMode(hskId)}
                onPress={() => {
                  if (isSelectionMode) {
                    toggleSelection(hskId);
                  } else {
                    router.push({
                      pathname: '/pages/hskDetails/[id]',
                      params: {
                        id: hsk.id,
                        hskId: hsk.id,
                      },
                    } as any);
                  }
                }}
                style={[
                  styles.hskCard,
                  {
                    backgroundColor: cardBg,
                  },
                  isSelected && styles.selectedHskCard,
                  isSelectionMode && !isSelected && { opacity: 0.85 },
                ]}
              >
                {isSelectionMode ? (
                  <View style={[styles.selectBadge, isSelected ? styles.selectBadgeSelected : styles.selectBadgeUnselected]}>
                    {isSelected && <Lucide name="check" size={14} color="#ffffff" />}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.cardMoreBtn}
                    onPress={() => { setActiveCardHsk(hsk); setMenuVisible(true); }}
                    activeOpacity={0.7}
                  >
                    <Lucide name="more-vertical" size={16} color="#ffffff" />
                  </TouchableOpacity>
                )}

                <Lucide name="award" size={32} color="#ffffff" style={{ opacity: 0.9 }} />

                <ThemedText style={styles.hskTitle}>
                  {hsk.name}
                </ThemedText>
              </TouchableOpacity>
            );
          })
        ) : (
          <ThemedText style={{ padding: 40, textAlign: 'center', width: '100%', color: '#94a3b8' }}>
            No HSKs found
          </ThemedText>
        )}
      </ScrollView>

      <OptionsMenuModal
        visible={menuVisible}
        onClose={() => { setMenuVisible(false); setActiveCardHsk(null); }}
        title={activeCardHsk ? `"${activeCardHsk.name}" Options` : isSelectionMode ? `${selectedIds.size} selected` : 'Options'}
        options={buildMenuOptions()}
      />
    </ThemedView>
  );
};

export default HSKs;

const styles = StyleSheet.create({
  actionBtnIcon: {
    fontSize: 22,
    backgroundColor: '#e8e8e8ff',
    borderRadius: 50,
    width: 40,
    height: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: '#414040ff',
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
  cardMoreBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hskCard: {
    display: 'flex',
    width: '48%',
    height: 160,
    margin: '1%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    // elevation: 2,
  },
  selectedHskCard: {
    borderColor: '#2a0f0fff',
    // backgroundColor: "#ff0000ff",
    // backdropFilter: "blur(81%)",
    borderWidth: 1.5,
  },
  selectBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBadgeSelected: {
    backgroundColor: '#2563eb',
  },
  selectBadgeUnselected: {
    borderColor: '#94a3b8',
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  hskTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
    color: '#ffffff',
  },
});
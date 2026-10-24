import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { LoopItem } from '../types';

interface LoopPlaylistQueueProps {
  playlist: LoopItem[];
  currentIndex: number;
  isPlaying: boolean;
  onSelectItem: (index: number) => void;
  showPinyin: boolean;
  showMeaning: boolean;
  // 10-by-10 pagination props
  totalAvailable?: number;
  currentBatch?: number;
  totalBatches?: number;
  batchOffset?: number;
  onSelectBatch?: (batchIdx: number) => void;
  onLoadNext10?: () => void;
  hasMoreToLoad?: boolean;
}

export const LoopPlaylistQueue: React.FC<LoopPlaylistQueueProps> = ({
  playlist,
  currentIndex,
  isPlaying,
  onSelectItem,
  showPinyin,
  showMeaning,
  totalAvailable,
  currentBatch = 0,
  totalBatches = 1,
  batchOffset = 0,
  onSelectBatch,
  onLoadNext10,
  hasMoreToLoad = false,
}) => {
  if (playlist.length === 0) return null;

  const total = totalAvailable ?? playlist.length;

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Lucide name="list-music" size={16} color="#8b5cf6" />
          <Text style={styles.title}>Loop Playlist Queue</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {playlist.length < total
              ? `${playlist.length} of ${total} items`
              : `${playlist.length} items`}
          </Text>
        </View>
      </View>

      {/* Batch Navigation (when more than 10 items exist in total) */}
      {totalBatches > 1 && onSelectBatch && (
        <View style={styles.batchSelectorContainer}>
          <View style={styles.batchSelectorHeader}>
            <Lucide name="layers" size={13} color="#64748b" />
            <Text style={styles.batchSelectorTitle}>Practice 10 by 10 (Batches):</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.batchScrollContent}
          >
            {Array.from({ length: totalBatches }).map((_, bIdx) => {
              const isSelected = bIdx === currentBatch;
              const startNum = bIdx * 10 + 1;
              const endNum = Math.min((bIdx + 1) * 10, total);
              return (
                <TouchableOpacity
                  key={`batch-${bIdx}`}
                  style={[styles.batchChip, isSelected && styles.batchChipActive]}
                  onPress={() => onSelectBatch(bIdx)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.batchChipText,
                      isSelected && styles.batchChipTextActive,
                    ]}
                  >
                    Batch {bIdx + 1} ({startNum}–{endNum})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Playlist List */}
      <View style={styles.listContainer}>
        {playlist.map((item, idx) => {
          const isActive = idx === currentIndex;
          const displayIdx = batchOffset + idx + 1;
          return (
            <TouchableOpacity
              key={`${item.id}-${idx}`}
              style={[styles.itemRow, isActive && styles.itemRowActive]}
              onPress={() => onSelectItem(idx)}
              activeOpacity={0.7}
            >
              {/* Index & Playing Indicator */}
              <View style={[styles.indexBox, isActive && styles.indexBoxActive]}>
                {isActive && isPlaying ? (
                  <Lucide name="volume-2" size={13} color="#ffffff" />
                ) : (
                  <Text style={[styles.indexText, isActive && styles.indexTextActive]}>
                    {displayIdx}
                  </Text>
                )}
              </View>

              {/* Content text */}
              <View style={styles.contentCol}>
                <View style={styles.itemMetaRow}>
                  {item.type === 'word' && (
                    <View style={styles.itemTypeBadgeWord}>
                      <Text style={styles.itemTypeBadgeWordText}>Word</Text>
                    </View>
                  )}
                  {showPinyin && Boolean(item.pinyin) && (
                    <Text
                      style={[styles.itemPinyin, isActive && styles.itemPinyinActive]}
                      numberOfLines={1}
                    >
                      {item.pinyin}
                    </Text>
                  )}
                </View>
                <Text
                  style={[styles.itemHanzi, isActive && styles.itemHanziActive]}
                  numberOfLines={2}
                >
                  {item.content}
                </Text>
                {showMeaning && Boolean(item.meaning) && (
                  <Text style={styles.itemMeaning} numberOfLines={1}>
                    {item.meaning}
                  </Text>
                )}
              </View>

              {/* Jump indicator icon */}
              <Lucide
                name={isActive ? 'disc' : 'play-circle'}
                size={16}
                color={isActive ? '#8b5cf6' : '#cbd5e1'}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Load More (+10) or Completed Status */}
      {hasMoreToLoad && onLoadNext10 ? (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={onLoadNext10}
          activeOpacity={0.7}
        >
          <Lucide name="plus-circle" size={15} color="#8b5cf6" />
          <Text style={styles.loadMoreText}>
            Load Next 10 to Queue ({total - playlist.length} remaining)
          </Text>
        </TouchableOpacity>
      ) : total > 10 ? (
        <View style={styles.completedRow}>
          <Lucide name="check-circle" size={13} color="#10b981" />
          <Text style={styles.completedText}>
            All {total} items loaded in queue
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffffd3',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  countBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  // Batch Selector styles
  batchSelectorContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  batchSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  batchSelectorTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  batchScrollContent: {
    gap: 6,
    paddingVertical: 2,
  },
  batchChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  batchChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
  },
  batchChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  batchChipTextActive: {
    color: '#ffffff',
  },
  // List styles
  listContainer: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemRowActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#c4b5fd',
  },
  indexBox: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBoxActive: {
    backgroundColor: '#8b5cf6',
  },
  indexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  indexTextActive: {
    color: '#ffffff',
  },
  contentCol: {
    flex: 1,
    gap: 2,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTypeBadgeWord: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  itemTypeBadgeWordText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  itemPinyin: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
  },
  itemPinyinActive: {
    color: '#7c3aed',
  },
  itemHanzi: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 19,
  },
  itemHanziActive: {
    color: '#8b5cf6',
  },
  itemMeaning: {
    fontSize: 10.5,
    color: '#64748b',
  },
  // Bottom actions
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    marginTop: 4,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c3aed',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    marginTop: 2,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
});

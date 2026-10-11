import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

interface LoadMoreFooterProps {
  currentCount: number;
  totalCount: number;
  pageSize?: number;
  accentColor?: string;
  itemLabel?: string;
  onLoadMore: () => void;
}

export const LoadMoreFooter: React.FC<LoadMoreFooterProps> = ({
  currentCount,
  totalCount,
  pageSize = 10,
  accentColor = '#3b82f6',
  itemLabel = 'items',
  onLoadMore,
}) => {
  if (totalCount <= 0) return null;

  const hasMore = currentCount < totalCount;
  const nextChunk = Math.min(pageSize, totalCount - currentCount);

  if (!hasMore) {
    return (
      <View style={styles.completedContainer}>
        <View style={[styles.completedDot, { backgroundColor: accentColor }]} />
        <Text style={styles.completedText}>
          All {totalCount} {itemLabel} loaded
        </Text>
      </View>
    );
  }

  const progressPercent = Math.min(100, Math.round((currentCount / totalCount) * 100));

  return (
    <View style={styles.container}>
      {/* Progress Info */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Showing <Text style={[styles.highlightText, { color: accentColor }]}>{currentCount}</Text> of{' '}
          <Text style={styles.totalText}>{totalCount}</Text> {itemLabel}
        </Text>
        <Text style={styles.percentText}>{progressPercent}%</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progressPercent}%`, backgroundColor: accentColor },
          ]}
        />
      </View>

      {/* Load More Button */}
      <TouchableOpacity
        style={[
          styles.loadMoreBtn,
          { borderColor: accentColor + '40', backgroundColor: accentColor + '10' },
        ]}
        onPress={onLoadMore}
        activeOpacity={0.7}
      >
        <Lucide name="chevron-down" size={16} color={accentColor} />
        <Text style={[styles.loadMoreText, { color: accentColor }]}>
          Load {nextChunk} More
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  progressRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  progressText: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '500',
  },
  highlightText: {
    fontWeight: '700',
  },
  totalText: {
    fontWeight: '700',
    color: '#334155',
  },
  percentText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 18,
    width: '100%',
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
});

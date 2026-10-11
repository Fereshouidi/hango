import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

interface SliderLoadMoreCardProps {
  currentCount?: number;
  totalCount?: number;
  pageSize?: number;
  color?: string;
  onLoadMore?: () => void;
  width?: number;
  remaining?: number;
  onPress?: () => void;
}

export const SliderLoadMoreCard: React.FC<SliderLoadMoreCardProps> = ({
  currentCount = 0,
  totalCount = 0,
  pageSize = 10,
  color = '#3b82f6',
  onLoadMore,
  width = 140,
  remaining: remainingProp,
  onPress,
}) => {
  const remaining = remainingProp !== undefined ? remainingProp : totalCount - currentCount;
  const nextChunk = Math.min(pageSize, remaining);
  const handlePress = onPress || onLoadMore || (() => {});

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width,
          borderColor: color + '40',
          backgroundColor: color + '0d',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '1a' }]}>
        <Lucide name="plus" size={18} color={color} />
      </View>

      <Text style={[styles.title, { color }]}>
        +{nextChunk} More
      </Text>

      <Text style={styles.subtext}>
        {currentCount} of {totalCount}
      </Text>

      <View style={styles.badge}>
        <Text style={[styles.badgeText, { color }]}>Load 10</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 6,
    minHeight: 110,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtext: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#ffffffaa',
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
});

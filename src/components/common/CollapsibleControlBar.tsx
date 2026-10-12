import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { SearchBar } from './SearchBar';
import { StudyToggleBar } from './StudyToggleBar';

export interface CollapsibleControlBarProps {
  isOpen: boolean;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  placeholder?: string;
  filterBadgeLabel?: string;
  count?: number;
  totalCount?: number;
  countLabel?: string;
  singleUnit?: string;
  accentColor?: string;
  // Optional study toggles
  showPinyin?: boolean;
  setShowPinyin?: (val: boolean) => void;
  showMeaning?: boolean;
  setShowMeaning?: (val: boolean) => void;
}

export const CollapsibleControlBar: React.FC<CollapsibleControlBarProps> = ({
  isOpen,
  searchQuery,
  onSearchChange,
  placeholder = 'Search...',
  filterBadgeLabel,
  count,
  totalCount,
  countLabel = 'items',
  singleUnit,
  accentColor = '#059669',
  showPinyin,
  setShowPinyin,
  showMeaning,
  setShowMeaning,
}) => {
  const anim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOpen ? 1 : 0,
      duration: 220,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const hasStudyToggles =
    showPinyin !== undefined &&
    setShowPinyin !== undefined &&
    showMeaning !== undefined &&
    setShowMeaning !== undefined;

  const maxHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, hasStudyToggles ? 130 : 96],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0, 0.3, 1],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  const borderBottomWidth = anim.interpolate({
    inputRange: [0, 0.05, 1],
    outputRange: [0, 1, 1],
  });

  const displayCount = () => {
    if (count === undefined) return null;
    const unit = count === 1 ? singleUnit || countLabel : countLabel;
    if (totalCount !== undefined && totalCount > count) {
      return `${count} / ${totalCount} ${unit}`;
    }
    return `${count} ${unit}`;
  };

  return (
    <Animated.View
      pointerEvents={isOpen ? 'auto' : 'none'}
      style={[
        styles.wrapper,
        {
          maxHeight,
          opacity,
          borderBottomWidth,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.contentContainer}>
        {/* Row 1: Search input and active filter badge */}
        <View style={styles.searchRow}>
          <SearchBar
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder={placeholder}
          />
          {filterBadgeLabel && (
            <View
              style={[
                styles.filterBadge,
                {
                  backgroundColor: `${accentColor}15`,
                  borderColor: `${accentColor}35`,
                },
              ]}
            >
              <Lucide name="filter" size={11} color={accentColor} />
              <Text
                style={[styles.filterBadgeText, { color: accentColor }]}
                numberOfLines={1}
              >
                {filterBadgeLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Row 2: Study toggles and/or item count */}
        <View style={styles.bottomRow}>
          {hasStudyToggles ? (
            <StudyToggleBar
              showPinyin={showPinyin!}
              setShowPinyin={setShowPinyin!}
              showMeaning={showMeaning!}
              setShowMeaning={setShowMeaning!}
              accentColor={accentColor}
            />
          ) : (
            <View style={styles.statusPill}>
              <Lucide name="layers" size={12} color="#64748b" />
              <Text style={styles.statusText}>
                {filterBadgeLabel ? 'Filtered view' : 'All items'}
              </Text>
            </View>
          )}

          {count !== undefined && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                <Text style={[styles.countNumber, { color: accentColor }]}>
                  {count}
                </Text>
                {totalCount !== undefined && totalCount > count ? (
                  <Text style={styles.countSubText}> / {totalCount}</Text>
                ) : null}{' '}
                {count === 1 ? singleUnit || countLabel : countLabel}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export const HeaderFilterButton: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
  hasActiveFilter?: boolean;
  accentColor?: string;
}> = ({
  isOpen,
  onToggle,
  hasActiveFilter = false,
  accentColor = '#059669',
}) => {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={styles.headerBtnWrapper}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <View
        style={[
          styles.headerBtn,
          isOpen && {
            backgroundColor: `${accentColor}18`,
            borderColor: accentColor,
          },
        ]}
      >
        <Lucide
          name="search"
          size={18}
          color={isOpen ? accentColor : '#373737ff'}
        />
      </View>
      {hasActiveFilter && (
        <View
          style={[styles.headerActiveDot, { backgroundColor: accentColor }]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fffffff5',
    borderBottomColor: '#e8edf2',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 90,
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 7,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 140,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 30,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  statusText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  countText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  countNumber: {
    fontWeight: '700',
  },
  countSubText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  // Header button styles
  headerBtnWrapper: {
    position: 'relative',
  },
  headerBtn: {
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
  headerActiveDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
});

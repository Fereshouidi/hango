import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

type SliderSectionProps = {
  title: string;
  icon: string;
  color: string;
  totalCount: number;
  selectedCount: number;
  expanded: boolean;
  onToggle: () => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  onAddNew?: () => void;
  addNewLabel?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterMode: 'all' | 'unassigned' | 'hsk';
  onFilterChange: (m: 'all' | 'unassigned' | 'hsk') => void;
  hasHskSelected: boolean;
  children: React.ReactNode;
};

export const SliderSection = ({
  title,
  icon,
  color,
  totalCount,
  selectedCount,
  expanded,
  onToggle,
  onSelectAll,
  onClearAll,
  onAddNew,
  addNewLabel,
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterChange,
  hasHskSelected,
  children,
}: SliderSectionProps) => (
  <View style={styles.section}>
    {/* Section Header */}
    <View style={styles.sectionHeader}>
      <TouchableOpacity
        style={styles.sectionHeaderLeft}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={[styles.sectionIcon, { backgroundColor: color }]}>
          <Lucide name={icon as any} size={16} color="#ffffff" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>({totalCount})</Text>

        {selectedCount > 0 && (
          <View style={[styles.badge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.badgeText, { color }]}>
              {selectedCount} selected
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.sectionHeaderRight}>
        {onAddNew && (
          <TouchableOpacity
            style={[
              styles.headerPlusBtn,
              { backgroundColor: color + '18', borderColor: color + '40' },
            ]}
            onPress={onAddNew}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Lucide name="plus" size={16} color={color} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.headerChevronBtn}
          onPress={onToggle}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Lucide
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#9ca3af"
          />
        </TouchableOpacity>
      </View>
    </View>

    {/* Section Body */}
    {expanded && (
      <View style={styles.sectionBody}>
        {/* Search Bar & Quick Select */}
        <View style={styles.searchAndActionsRow}>
          <View style={styles.searchBarContainer}>
            <Lucide name="search" size={14} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${title.toLowerCase()}...`}
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={onSearchChange}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange('')}>
                <Lucide name="x" size={14} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.quickActionButtons}>
            {onAddNew && (
              <TouchableOpacity
                style={[
                  styles.smallActionButton,
                  { backgroundColor: color, borderColor: color, flexDirection: 'row', alignItems: 'center', gap: 3 },
                ]}
                onPress={onAddNew}
                activeOpacity={0.8}
              >
                {/* <Lucide name="plus" size={12} color="#ffffff" /> */}
                <Text style={[styles.smallActionText, { color: '#ffffff', fontWeight: '700' }]}>
                  {addNewLabel || 'New'}
                </Text>
              </TouchableOpacity>
            )}
            {onSelectAll && (
              <TouchableOpacity
                style={[styles.smallActionButton, { borderColor: color }]}
                onPress={onSelectAll}
              >
                <Text style={[styles.smallActionText, { color }]}>Select All</Text>
              </TouchableOpacity>
            )}
            {selectedCount > 0 && onClearAll && (
              <TouchableOpacity
                style={[styles.smallActionButton, { borderColor: '#ef4444' }]}
                onPress={onClearAll}
              >
                <Text style={[styles.smallActionText, { color: '#ef4444' }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              filterMode === 'all' && [styles.filterChipActive, { backgroundColor: color }],
            ]}
            onPress={() => onFilterChange('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                filterMode === 'all' && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              filterMode === 'unassigned' && [styles.filterChipActive, { backgroundColor: color }],
            ]}
            onPress={() => onFilterChange('unassigned')}
          >
            <Text
              style={[
                styles.filterChipText,
                filterMode === 'unassigned' && styles.filterChipTextActive,
              ]}
            >
              Unassigned
            </Text>
          </TouchableOpacity>

          {hasHskSelected && (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterMode === 'hsk' && [styles.filterChipActive, { backgroundColor: color }],
              ]}
              onPress={() => onFilterChange('hsk')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterMode === 'hsk' && styles.filterChipTextActive,
                ]}
              >
                Match HSK
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Slider Content */}
        {children}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  section: {
    minHeight: 60,
    backgroundColor: '#ffffffe8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0d0c0c23',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    // elevation: 1,

  },
  sectionHeader: {
    backgroundColor: "transparent",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  sectionHeaderLeft: {
    backgroundColor: "transparent",
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerPlusBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerChevronBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionCount: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionBody: {
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
  },
  searchAndActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    height: 34,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
    paddingVertical: 0,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  smallActionButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  smallActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
});

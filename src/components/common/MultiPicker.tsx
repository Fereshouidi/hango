import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

export type MultiPickerProps<T extends { id: number }> = {
  label: string;
  icon: string;
  iconColor?: string;
  items: T[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  getLabel: (item: T) => string;
  placeholder: string;
  open: boolean;
  onToggleOpen: () => void;
};

const ITEM_HEIGHT = 44;

interface OptionRowProps {
  id: number;
  label: string;
  isSelected: boolean;
  onToggle: (id: number) => void;
  accentColor: string;
}

// Memoized individual option row so selecting one item does not re-render all others
const OptionRow = memo<OptionRowProps>(
  ({ id, label, isSelected, onToggle, accentColor }) => {
    return (
      <TouchableOpacity
        style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
        onPress={() => onToggle(id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dropdownOptionText,
            isSelected && [styles.dropdownOptionTextSelected, { color: accentColor }],
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {isSelected && <Lucide name="check" size={16} color={accentColor} />}
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.isSelected === next.isSelected &&
    prev.label === next.label &&
    prev.accentColor === next.accentColor
);

export function MultiPicker<T extends { id: number }>({
  label,
  icon,
  iconColor = '#ec489a',
  items,
  selectedIds,
  onToggle,
  getLabel,
  placeholder,
  open,
  onToggleOpen,
}: MultiPickerProps<T>) {
  const [search, setSearch] = useState('');

  // Selected items memoized
  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds]
  );

  // Filtered items based on search input
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      const text = getLabel(item).toLowerCase();
      return text.includes(q);
    });
  }, [items, search, getLabel]);

  const renderItem = useCallback(
    ({ item }: { item: T }) => {
      const isSel = selectedIds.has(item.id);
      return (
        <OptionRow
          id={item.id}
          label={getLabel(item)}
          isSelected={isSel}
          onToggle={onToggle}
          accentColor={iconColor}
        />
      );
    },
    [selectedIds, onToggle, getLabel, iconColor]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: T) => String(item.id), []);

  return (
    <View style={styles.pickerCol}>
      <View style={styles.labelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        {selectedItems.length > 0 && (
          <Text style={[styles.countBadge, { color: iconColor }]}>
            {selectedItems.length} selected
          </Text>
        )}
      </View>

      {/* Selected chips row */}
      {selectedItems.length > 0 && (
        <View style={styles.chipsRow}>
          {selectedItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, { backgroundColor: iconColor }]}
              onPress={() => onToggle(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {getLabel(item)}
              </Text>
              <Lucide name="x" size={11} color="#ffffff" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Trigger button */}
      <TouchableOpacity
        style={[styles.pickerBtn, open && { borderColor: iconColor }]}
        onPress={onToggleOpen}
        activeOpacity={0.7}
      >
        <Lucide name={icon as any} size={15} color={iconColor} />
        <Text style={styles.pickerBtnText} numberOfLines={1}>
          {selectedItems.length > 0
            ? `${selectedItems.length} selected (${selectedItems
                .map(getLabel)
                .join(', ')})`
            : placeholder}
        </Text>
        <Lucide
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#94a3b8"
        />
      </TouchableOpacity>

      {/* Dropdown list */}
      {open && (
        <View style={styles.dropdownContainer}>
          {/* Quick Search Bar */}
          {items.length > 5 && (
            <View style={styles.searchContainer}>
              <Lucide name="search" size={14} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${label.toLowerCase()}...`}
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {Boolean(search) && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Lucide name="x" size={14} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Virtualized high-performance list */}
          <FlatList
            data={filteredItems}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
            nestedScrollEnabled={true}
            style={styles.dropdownFlatList}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {search ? 'No matches found' : 'No items available'}
                </Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pickerCol: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    maxWidth: 160,
  },
  chipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerBtnText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 250,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#1e293b',
    paddingVertical: 2,
  },
  dropdownFlatList: {
    maxHeight: 200,
  },
  dropdownOption: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  dropdownOptionSelected: {
    backgroundColor: '#fdf2f8',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  dropdownOptionTextSelected: {
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
});

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
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
  const selectedItems = items.filter((i) => selectedIds.has(i.id));

  return (
    <View style={styles.pickerCol}>
      <Text style={styles.inputLabel}>{label}</Text>

      {/* Selected chips row */}
      {selectedItems.length > 0 && (
        <View style={styles.chipsRow}>
          {selectedItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.chip}
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
        style={styles.pickerBtn}
        onPress={onToggleOpen}
        activeOpacity={0.7}
      >
        <Lucide name={icon as any} size={15} color={iconColor} />
        <Text style={styles.pickerBtnText} numberOfLines={1}>
          {selectedItems.length > 0
            ? `${selectedItems.length} selected`
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
          <ScrollView
            nestedScrollEnabled
            style={styles.dropdownScrollView}
            keyboardShouldPersistTaps="handled"
          >
            {items.length === 0 ? (
              <View style={{ padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#94a3b8' }}>
                  No items available
                </Text>
              </View>
            ) : (
              items.map((item) => {
                const isSel = selectedIds.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dropdownOption,
                      isSel && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => onToggle(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        isSel && styles.dropdownOptionTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {getLabel(item)}
                    </Text>
                    {isSel && (
                      <Lucide name="check" size={15} color="#ec489a" />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pickerCol: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
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
    backgroundColor: '#ec489a',
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
    borderRadius: 10,
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownScrollView: {
    flexGrow: 0,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    color: '#ec489a',
    fontWeight: '600',
  },
});

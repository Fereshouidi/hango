import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { HSKType } from '@/types';

type LessonInfoCardProps = {
  num: string;
  onNumChange: (val: string) => void;
  title: string;
  onTitleChange: (val: string) => void;
  hsks: HSKType[];
  selectedHskId: number | null;
  onSelectHskId: (id: number) => void;
  showHskPicker: boolean;
  onToggleHskPicker: () => void;
};

export const LessonInfoCard = ({
  num,
  onNumChange,
  title,
  onTitleChange,
  hsks,
  selectedHskId,
  onSelectHskId,
  showHskPicker,
  onToggleHskPicker,
}: LessonInfoCardProps) => {
  const selectedHskName =
    hsks.find((h) => h.id === selectedHskId)?.name ?? 'Select HSK Level';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardHeaderIcon}>
            <Lucide name="sparkles" size={16} color="#3b82f6" />
          </View>
          <Text style={styles.cardTitle}>Lesson Details</Text>
        </View>
        {selectedHskId && (
          <View style={styles.hskBadge}>
            <Text style={styles.hskBadgeText}>{selectedHskName}</Text>
          </View>
        )}
      </View>

      {/* Lesson Number & Title */}
      <View style={styles.formRow}>
        <View style={[styles.fieldContainer, { flex: 0.35 }]}>
          <View style={styles.labelRow}>
            <Lucide name="hash" size={14} color="#6b7280" />
            <Text style={styles.label}>Lesson #</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1"
            placeholderTextColor="#9ca3af"
            value={num}
            onChangeText={onNumChange}
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>

        <View style={[styles.fieldContainer, { flex: 0.65 }]}>
          <View style={styles.labelRow}>
            <Lucide name="type" size={14} color="#6b7280" />
            <Text style={styles.label}>Title</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. Greetings"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={onTitleChange}
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Target HSK Level Picker */}
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <Lucide name="book-open" size={14} color="#6b7280" />
          <Text style={styles.label}>Target HSK Level</Text>
        </View>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={onToggleHskPicker}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pickerButtonText,
              !selectedHskId && { color: '#9ca3af' },
            ]}
          >
            {selectedHskName}
          </Text>
          <Lucide
            name={showHskPicker ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#6b7280"
          />
        </TouchableOpacity>

        {showHskPicker && (
          <View style={styles.pickerDropdown}>
            <ScrollView
              nestedScrollEnabled={true}
              style={{ maxHeight: 200 }}
              showsVerticalScrollIndicator={true}
            >
              {hsks.map((hsk) => (
                <TouchableOpacity
                  key={hsk.id}
                  style={[
                    styles.pickerOption,
                    selectedHskId === hsk.id && styles.pickerOptionSelected,
                  ]}
                  onPress={() => onSelectHskId(hsk.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedHskId === hsk.id && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {hsk.name}
                  </Text>
                  {selectedHskId === hsk.id && (
                    <Lucide name="check" size={16} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffffe8',
    borderColor: '#0d0c0c23',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    // elevation: 2,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  hskBadge: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  hskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldContainer: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  pickerButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  pickerDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#334155',
  },
  pickerOptionTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
});

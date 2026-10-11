import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { HSKType, LessonType } from '@/types';
import { FilterScope } from '../types';

interface FilterBarProps {
  filterScope: FilterScope;
  onScopeChange: (scope: FilterScope) => void;
  selectedHskId: number | null;
  onSelectHskId: (id: number | null) => void;
  selectedLessonId: number | null;
  onSelectLessonId: (id: number | null) => void;
  allHsks: HSKType[];
  allLessons: LessonType[];
  totalCharactersCount?: number;
  hskCounts?: Record<number, number>;
  lessonCounts?: Record<number, number>;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterScope,
  onScopeChange,
  selectedHskId,
  onSelectHskId,
  selectedLessonId,
  onSelectLessonId,
  allHsks,
  allLessons,
  totalCharactersCount = 0,
  hskCounts = {},
  lessonCounts = {},
}) => {
  return (
    <View style={styles.card}>
      {/* Scope toggle */}
      <View style={styles.scopeRow}>
        <TouchableOpacity
          style={[styles.scopeBtn, filterScope === 'hsk' && styles.scopeBtnActive]}
          onPress={() => onScopeChange('hsk')}
          activeOpacity={0.7}
        >
          <Lucide name="layers" size={12} color={filterScope === 'hsk' ? '#fff' : '#64748b'} />
          <Text style={[styles.scopeBtnText, filterScope === 'hsk' && styles.scopeBtnTextActive]}>
            HSK Level
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scopeBtn, filterScope === 'lesson' && styles.scopeBtnActive]}
          onPress={() => onScopeChange('lesson')}
          activeOpacity={0.7}
        >
          <Lucide name="book-open" size={12} color={filterScope === 'lesson' ? '#fff' : '#64748b'} />
          <Text style={[styles.scopeBtnText, filterScope === 'lesson' && styles.scopeBtnTextActive]}>
            Lesson
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips with clear character counts */}
      {filterScope === 'hsk' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[styles.chip, selectedHskId === null && styles.chipActive]}
            onPress={() => onSelectHskId(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, selectedHskId === null && styles.chipTextActive]}>
              All ({totalCharactersCount})
            </Text>
          </TouchableOpacity>

          {allHsks.map((h) => {
            const count = hskCounts[h.id] ?? 0;
            return (
              <TouchableOpacity
                key={`hsk-${h.id}`}
                style={[styles.chip, selectedHskId === h.id && styles.chipActive]}
                onPress={() => onSelectHskId(selectedHskId === h.id ? null : h.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedHskId === h.id && styles.chipTextActive]}>
                  {h.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[styles.chip, selectedLessonId === null && styles.chipActive]}
            onPress={() => onSelectLessonId(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, selectedLessonId === null && styles.chipTextActive]}>
              All ({totalCharactersCount})
            </Text>
          </TouchableOpacity>

          {allLessons.map((l) => {
            const count = lessonCounts[l.id] ?? 0;
            return (
              <TouchableOpacity
                key={`lesson-${l.id}`}
                style={[styles.chip, selectedLessonId === l.id && styles.chipActive]}
                onPress={() => onSelectLessonId(selectedLessonId === l.id ? null : l.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.chipText, selectedLessonId === l.id && styles.chipTextActive]}
                  numberOfLines={1}
                >
                  L{l.num}: {l.title} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffffe2',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  scopeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scopeBtnActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
  },
  scopeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  scopeBtnTextActive: {
    color: '#fff',
  },
  chipsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

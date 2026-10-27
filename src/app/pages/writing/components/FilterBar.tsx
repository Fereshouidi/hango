import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { HSKType, LessonType } from '@/types';
import { FilterScope } from '../types';

interface FilterBarProps {
  filterScope?: FilterScope;
  onScopeChange?: (scope: FilterScope) => void;
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
  const selectedHsk = useMemo(() => {
    return allHsks.find((h) => h.id === selectedHskId) || null;
  }, [allHsks, selectedHskId]);

  const visibleLessons = useMemo(() => {
    if (selectedHskId === null) return allLessons;
    return allLessons.filter((l) => l.hskId === selectedHskId);
  }, [allLessons, selectedHskId]);

  const activeHskCount = useMemo(() => {
    if (selectedHskId === null) return totalCharactersCount;
    return hskCounts[selectedHskId] ?? 0;
  }, [selectedHskId, totalCharactersCount, hskCounts]);

  return (
    <View style={styles.card}>
      {/* ── 1. HSK LEVEL SELECTOR ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.iconCircle, { backgroundColor: '#f5f3ff' }]}>
            <Lucide name="layers" size={13} color="#8b5cf6" />
          </View>
          <Text style={styles.headerTitle}>HSK Level</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {selectedHsk ? `${selectedHsk.name} (${activeHskCount})` : `All Levels (${totalCharactersCount})`}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <TouchableOpacity
          style={[styles.chip, selectedHskId === null && styles.chipActive]}
          onPress={() => {
            onSelectHskId(null);
            onSelectLessonId(null);
          }}
          activeOpacity={0.7}
        >
          {selectedHskId === null && (
            <Lucide name="check" size={11} color="#ffffff" style={{ marginRight: 3 }} />
          )}
          <Text style={[styles.chipText, selectedHskId === null && styles.chipTextActive]}>
            All ({totalCharactersCount})
          </Text>
        </TouchableOpacity>

        {allHsks.map((h) => {
          const count = hskCounts[h.id] ?? 0;
          const isSelected = selectedHskId === h.id;
          return (
            <TouchableOpacity
              key={`hsk-${h.id}`}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => {
                const nextId = isSelected ? null : h.id;
                onSelectHskId(nextId);
                onSelectLessonId(null);
              }}
              activeOpacity={0.7}
            >
              {isSelected && (
                <Lucide name="check" size={11} color="#ffffff" style={{ marginRight: 3 }} />
              )}
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {h.name} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── 2. LESSONS SELECTOR (Filtered inside chosen HSK) ── */}
      <View style={[styles.headerRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.iconCircle, { backgroundColor: '#f0fdf4' }]}>
            <Lucide name="book-open" size={13} color="#059669" />
          </View>
          <Text style={styles.headerTitle}>
            {selectedHsk ? `${selectedHsk.name} Lessons` : 'Lessons'}
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {visibleLessons.length} {visibleLessons.length === 1 ? 'lesson' : 'lessons'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            styles.lessonChip,
            selectedLessonId === null && styles.lessonChipActive,
          ]}
          onPress={() => onSelectLessonId(null)}
          activeOpacity={0.7}
        >
          {selectedLessonId === null && (
            <Lucide name="check" size={11} color="#ffffff" style={{ marginRight: 3 }} />
          )}
          <Text
            style={[
              styles.chipText,
              selectedLessonId === null && styles.chipTextActive,
            ]}
          >
            {selectedHsk ? `All ${selectedHsk.name} (${activeHskCount})` : `All Lessons (${totalCharactersCount})`}
          </Text>
        </TouchableOpacity>

        {visibleLessons.map((l) => {
          const count = lessonCounts[l.id] ?? 0;
          const isSelected = selectedLessonId === l.id;
          return (
            <TouchableOpacity
              key={`lesson-${l.id}`}
              style={[
                styles.chip,
                styles.lessonChip,
                isSelected && styles.lessonChipActive,
              ]}
              onPress={() => onSelectLessonId(isSelected ? null : l.id)}
              activeOpacity={0.7}
            >
              {isSelected && (
                <Lucide name="check" size={11} color="#ffffff" style={{ marginRight: 3 }} />
              )}
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive,
                ]}
                numberOfLines={1}
              >
                L{l.num}: {l.title} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    gap: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  chipsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
  },
  lessonChip: {
    borderColor: '#e2e8f0',
  },
  lessonChipActive: {
    backgroundColor: '#059669',
    borderColor: '#047857',
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

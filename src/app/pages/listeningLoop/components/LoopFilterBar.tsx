import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { HSKType, LessonType } from '@/types';
import { LoopContentType } from '../types';

interface LoopFilterBarProps {
  contentType: LoopContentType;
  onSelectContentType: (type: LoopContentType) => void;
  scope: 'hsk' | 'lesson';
  onSelectScope: (scope: 'hsk' | 'lesson') => void;
  selectedHskId: number | null;
  onSelectHskId: (id: number | null) => void;
  selectedLessonId: number | null;
  onSelectLessonId: (id: number | null) => void;
  allHsks: HSKType[];
  allLessons: LessonType[];
  breakTextsIntoSentences: boolean;
  onToggleBreakTexts: () => void;
}

export const LoopFilterBar: React.FC<LoopFilterBarProps> = ({
  contentType,
  onSelectContentType,
  scope,
  onSelectScope,
  selectedHskId,
  onSelectHskId,
  selectedLessonId,
  onSelectLessonId,
  allHsks,
  allLessons,
  breakTextsIntoSentences,
  onToggleBreakTexts,
}) => {
  return (
    <View style={styles.card}>
      {/* Row 1: Content Type Switcher (Sentences vs Texts) */}
      <View style={styles.typeSwitcherRow}>
        <TouchableOpacity
          style={[styles.typeBtn, contentType === 'sentences' && styles.typeBtnActive]}
          onPress={() => onSelectContentType('sentences')}
          activeOpacity={0.7}
        >
          <Lucide
            name="message-square-text"
            size={13}
            color={contentType === 'sentences' ? '#ffffff' : '#64748b'}
          />
          <Text
            style={[styles.typeBtnText, contentType === 'sentences' && styles.typeBtnTextActive]}
          >
            Sentences (句子)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeBtn, contentType === 'texts' && styles.typeBtnActive]}
          onPress={() => onSelectContentType('texts')}
          activeOpacity={0.7}
        >
          <Lucide
            name="file-text"
            size={13}
            color={contentType === 'texts' ? '#ffffff' : '#64748b'}
          />
          <Text style={[styles.typeBtnText, contentType === 'texts' && styles.typeBtnTextActive]}>
            Texts (课文)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Row 2: Scope switcher (HSK vs Lesson) + Text breakdown toggle */}
      <View style={styles.subBarRow}>
        <View style={styles.scopeGroup}>
          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'hsk' && styles.scopeBtnActive]}
            onPress={() => onSelectScope('hsk')}
            activeOpacity={0.7}
          >
            <Lucide name="layers" size={11} color={scope === 'hsk' ? '#8b5cf6' : '#64748b'} />
            <Text style={[styles.scopeText, scope === 'hsk' && styles.scopeTextActive]}>
              HSK Level
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'lesson' && styles.scopeBtnActive]}
            onPress={() => onSelectScope('lesson')}
            activeOpacity={0.7}
          >
            <Lucide name="book-open" size={11} color={scope === 'lesson' ? '#8b5cf6' : '#64748b'} />
            <Text style={[styles.scopeText, scope === 'lesson' && styles.scopeTextActive]}>
              Lesson
            </Text>
          </TouchableOpacity>
        </View>

        {contentType === 'texts' && (
          <TouchableOpacity
            style={[styles.breakTextBtn, breakTextsIntoSentences && styles.breakTextBtnActive]}
            onPress={onToggleBreakTexts}
            activeOpacity={0.7}
          >
            <Lucide
              name={breakTextsIntoSentences ? 'check-square' : 'square'}
              size={12}
              color={breakTextsIntoSentences ? '#8b5cf6' : '#64748b'}
            />
            <Text style={[styles.breakTextLabel, breakTextsIntoSentences && styles.breakTextLabelActive]}>
              Split into sentences
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Row 3: Horizontal chips */}
      {scope === 'hsk' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <TouchableOpacity
            style={[styles.chip, selectedHskId === null && styles.chipActive]}
            onPress={() => onSelectHskId(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, selectedHskId === null && styles.chipTextActive]}>
              All HSKs
            </Text>
          </TouchableOpacity>

          {allHsks.map((h) => {
            const isSelected = selectedHskId === h.id;
            return (
              <TouchableOpacity
                key={`hsk-${h.id}`}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => onSelectHskId(isSelected ? null : h.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {h.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <TouchableOpacity
            style={[styles.chip, selectedLessonId === null && styles.chipActive]}
            onPress={() => onSelectLessonId(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, selectedLessonId === null && styles.chipTextActive]}>
              All Lessons
            </Text>
          </TouchableOpacity>

          {allLessons.map((l) => {
            const isSelected = selectedLessonId === l.id;
            return (
              <TouchableOpacity
                key={`lesson-${l.id}`}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => onSelectLessonId(isSelected ? null : l.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextActive]}
                  numberOfLines={1}
                >
                  L{l.num}: {l.title}
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
    backgroundColor: '#ffffffdb',
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
  typeSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 11,
    padding: 3,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9,
  },
  typeBtnActive: {
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  typeBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  subBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scopeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  scopeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scopeBtnActive: {
    backgroundColor: '#f3e8ff',
    borderColor: '#ddd6fe',
  },
  scopeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  scopeTextActive: {
    color: '#8b5cf6',
    fontWeight: '700',
  },
  breakTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  breakTextBtnActive: {
    backgroundColor: '#f3e8ff',
    borderColor: '#ddd6fe',
  },
  breakTextLabel: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '500',
  },
  breakTextLabelActive: {
    color: '#8b5cf6',
    fontWeight: '700',
  },
  chipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
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
    color: '#ffffff',
    fontWeight: '700',
  },
});

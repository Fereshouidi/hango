import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { CharacterIcon } from '@/components/common/CharacterIcon';
import { HSKType, LessonType } from '@/types';
import { StudyToggleBar } from '../common/StudyToggleBar';

interface LessonHeroCardProps {
  lesson: LessonType | null;
  lessonId: number;
  hsk: HSKType | null;
  textCount: number;
  sentenceCount: number;
  wordCount: number;
  characterCount: number;
  ruleCount: number;
  showPinyin: boolean;
  setShowPinyin: (val: boolean) => void;
  showMeaning: boolean;
  setShowMeaning: (val: boolean) => void;
  onEdit?: () => void;
}

export const LessonHeroCard: React.FC<LessonHeroCardProps> = ({
  lesson,
  lessonId,
  hsk,
  textCount,
  sentenceCount,
  wordCount,
  characterCount,
  ruleCount,
  showPinyin,
  setShowPinyin,
  showMeaning,
  setShowMeaning,
  onEdit,
}) => {
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <View style={styles.pillsContainer}>
          <View style={styles.lessonPill}>
            <Lucide name="sparkles" size={13} color="#2563eb" />
            <Text style={styles.lessonPillText}>
              Lesson {lesson?.num ?? lessonId}
            </Text>
          </View>

          {hsk && (
            <View style={styles.hskPill}>
              <Lucide name="book-open" size={12} color="#059669" />
              <Text style={styles.hskPillText}>{hsk.name}</Text>
            </View>
          )}
        </View>

        {onEdit && (
          <TouchableOpacity
            onPress={onEdit}
            style={styles.editBtn}
            activeOpacity={0.7}
          >
            <Lucide name="pencil" size={12} color="#2563eb" />
            <Text style={styles.editBtnText}>Edit Lesson</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.heroTitle}>{lesson?.title ?? 'Chinese Lesson'}</Text>

      {/* Quick Stats Badges */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Lucide name="file-text" size={13} color="#3b82f6" />
          <Text style={styles.statChipText}>{textCount} Texts</Text>
        </View>
        <View style={styles.statChip}>
          <Lucide name="message-square-text" size={13} color="#8b5cf6" />
          <Text style={styles.statChipText}>{sentenceCount} Sentences</Text>
        </View>
        <View style={styles.statChip}>
          <Lucide name="languages" size={13} color="#059669" />
          <Text style={styles.statChipText}>{wordCount} Words</Text>
        </View>
        <View style={styles.statChip}>
          <CharacterIcon size={13} color="#ec489a" />
          <Text style={styles.statChipText}>{characterCount} Hanzi</Text>
        </View>
        {ruleCount > 0 && (
          <View style={styles.statChip}>
            <Lucide name="graduation-cap" size={13} color="#d97706" />
            <Text style={styles.statChipText}>{ruleCount} Grammar</Text>
          </View>
        )}
      </View>

      {/* Study Controls */}
      <View style={styles.controlsBar}>
        <View style={styles.controlsLabelRow}>
          <Lucide name="sliders" size={13} color="#64748b" />
          <Text style={styles.controlsLabel}>Display Controls:</Text>
        </View>
        <StudyToggleBar
          showPinyin={showPinyin}
          setShowPinyin={setShowPinyin}
          showMeaning={showMeaning}
          setShowMeaning={setShowMeaning}
          accentColor="#2563eb"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#ffffffe4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  lessonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  lessonPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  hskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  hskPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  controlsBar: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  controlsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
});

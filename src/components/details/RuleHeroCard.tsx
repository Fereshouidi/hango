import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { HSKType, LessonType, RuleType } from '@/types';
import { StudyToggleBar } from '../common/StudyToggleBar';

interface RuleHeroCardProps {
  rule: RuleType | null;
  ruleId: number;
  hsks?: HSKType[];
  lessons?: LessonType[];
  textCount: number;
  sentenceCount: number;
  wordCount: number;
  characterCount: number;
  isPlaying: boolean;
  onPlay: () => void;
  showPinyin: boolean;
  setShowPinyin: (val: boolean) => void;
  showMeaning: boolean;
  setShowMeaning: (val: boolean) => void;
}

export const RuleHeroCard: React.FC<RuleHeroCardProps> = ({
  rule,
  ruleId,
  hsks = [],
  lessons = [],
  textCount,
  sentenceCount,
  wordCount,
  characterCount,
  isPlaying,
  onPlay,
  showPinyin,
  setShowPinyin,
  showMeaning,
  setShowMeaning,
}) => {
  const router = useRouter();
  const accentColor = '#d97706';

  return (
    <View style={styles.card}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Lucide name="graduation-cap" size={14} color={accentColor} />
          <Text style={styles.badgeText}>
            Rule #{rule?.id ?? ruleId}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push(`/pages/addRule?ruleId=${ruleId}` as any)}
          activeOpacity={0.7}
        >
          <Lucide name="edit-3" size={13} color={accentColor} />
          <Text style={styles.editBtnText}>Edit Rule</Text>
        </TouchableOpacity>
      </View>

      {/* Main Rule Content Box */}
      <View style={styles.contentBox}>
        <Text style={styles.ruleContentText}>
          {rule?.content || 'No grammar rule content.'}
        </Text>

        <TouchableOpacity
          style={[styles.audioBtn, isPlaying && styles.audioBtnPlaying]}
          onPress={onPlay}
          activeOpacity={0.8}
        >
          <Lucide
            name={isPlaying ? 'square' : 'volume-2'}
            size={15}
            color={isPlaying ? '#ffffff' : accentColor}
          />
          <Text style={[styles.audioBtnText, isPlaying && styles.audioBtnTextPlaying]}>
            {isPlaying ? 'Stop Speech' : 'Listen Explanation'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Linked HSK & Lesson pills + Stats */}
      <View style={styles.metaRow}>
        {hsks.map((hsk) => (
          <View key={hsk.id} style={styles.hskPill}>
            <Lucide name="layers" size={12} color="#6366f1" />
            <Text style={styles.hskPillText}>{hsk.name}</Text>
          </View>
        ))}

        {lessons.map((les) => (
          <View key={les.id} style={styles.lessonPill}>
            <Lucide name="book-open" size={12} color="#2563eb" />
            <Text style={styles.lessonPillText}>Lesson {les.num}</Text>
          </View>
        ))}

        <View style={styles.statChip}>
          <Lucide name="file-text" size={12} color="#3b82f6" />
          <Text style={styles.statChipText}>{textCount} texts</Text>
        </View>

        <View style={styles.statChip}>
          <Lucide name="message-square-text" size={12} color="#8b5cf6" />
          <Text style={styles.statChipText}>{sentenceCount} sentences</Text>
        </View>

        <View style={styles.statChip}>
          <Lucide name="languages" size={12} color="#059669" />
          <Text style={styles.statChipText}>{wordCount} words</Text>
        </View>

        <View style={styles.statChip}>
          <Lucide name="spell-check" size={12} color="#ec489a" />
          <Text style={styles.statChipText}>{characterCount} hanzi</Text>
        </View>
      </View>

      {/* Display Toggle Controls */}
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
          accentColor={accentColor}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffffe4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  contentBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 10,
  },
  ruleContentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#78350f',
    lineHeight: 23,
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
    alignSelf: 'flex-start',
  },
  audioBtnPlaying: {
    backgroundColor: '#d97706',
    borderColor: '#b45309',
  },
  audioBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#d97706',
  },
  audioBtnTextPlaying: {
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  hskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  hskPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6366f1',
  },
  lessonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  lessonPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563eb',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statChipText: {
    fontSize: 11.5,
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

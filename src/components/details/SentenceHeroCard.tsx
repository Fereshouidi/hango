import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { CharacterIcon } from '@/components/common/CharacterIcon';
import { HSKType, LessonType, SentenceType } from '@/types';
import { StudyToggleBar } from '../common/StudyToggleBar';

import { HighlightedText } from '../common/HighlightedText';

interface SentenceHeroCardProps {
  sentence: SentenceType | null;
  sentenceId: number;
  searchQuery?: string;
  hsk?: HSKType | null;
  lesson?: LessonType | null;
  textCount: number;
  wordCount: number;
  characterCount: number;
  ruleCount: number;
  isPlaying: boolean;
  onPlay: () => void;
  onEdit: () => void;
  showPinyin: boolean;
  setShowPinyin: (val: boolean) => void;
  showMeaning: boolean;
  setShowMeaning: (val: boolean) => void;
}

export const SentenceHeroCard: React.FC<SentenceHeroCardProps> = ({
  sentence,
  sentenceId,
  searchQuery,
  hsk,
  lesson,
  textCount,
  wordCount,
  characterCount,
  ruleCount,
  isPlaying,
  onPlay,
  onEdit,
  showPinyin,
  setShowPinyin,
  showMeaning,
  setShowMeaning,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Top Bar: Icon, Header Title, Audio Play, Edit */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBg}>
            <Lucide name="message-square-text" size={20} color="#8b5cf6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              {sentence ? `Sentence #${sentence.id}` : 'Sentence Details'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {lesson ? `Lesson ${lesson.num}` : hsk ? hsk.name : 'Example Sentence'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={[styles.audioPillBtn, isPlaying && styles.audioPillBtnActive]}
            onPress={onPlay}
            activeOpacity={0.8}
          >
            <Lucide
              name={isPlaying ? 'square' : 'play'}
              size={14}
              color={isPlaying ? '#ffffff' : '#8b5cf6'}
            />
            <Text style={[styles.audioPillText, isPlaying && styles.audioPillTextActive]}>
              {isPlaying ? 'Stop' : 'Listen'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editIconBtn}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Lucide name="edit-3" size={16} color="#8b5cf6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Sentence Content Display */}
      <View style={styles.chineseContentBox}>
        <HighlightedText
          text={sentence?.content || 'Loading sentence...'}
          highlight={searchQuery}
          style={styles.chineseText}
        />
      </View>

      {/* Study Toggles Bar */}
      <StudyToggleBar
        showPinyin={showPinyin}
        setShowPinyin={setShowPinyin}
        showMeaning={showMeaning}
        setShowMeaning={setShowMeaning}
        accentColor="#8b5cf6"
      />

      {/* Pinyin Section */}
      {showPinyin && sentence?.pinyin ? (
        <View style={styles.pinyinBox}>
          <Text style={styles.sectionLabel}>Pinyin:</Text>
          <HighlightedText
            text={sentence.pinyin}
            highlight={searchQuery}
            style={styles.pinyinText}
          />
        </View>
      ) : null}

      {/* Meaning Section */}
      {showMeaning && sentence?.meaning ? (
        <View style={styles.meaningBox}>
          <Text style={styles.sectionLabel}>Translation:</Text>
          <HighlightedText
            text={sentence.meaning}
            highlight={searchQuery}
            style={styles.meaningText}
          />
        </View>
      ) : null}

      {/* Relation Chips Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Lucide name="file-text" size={13} color="#3b82f6" />
          <Text style={styles.statChipText}>{textCount} Texts</Text>
        </View>
        <View style={styles.statChip}>
          <Lucide name="languages" size={13} color="#059669" />
          <Text style={styles.statChipText}>{wordCount} Words</Text>
        </View>
        <View style={styles.statChip}>
          <CharacterIcon size={13} color="#ec489a" />
          <Text style={styles.statChipText}>{characterCount} Characters</Text>
        </View>
        <View style={styles.statChip}>
          <Lucide name="graduation-cap" size={13} color="#d97706" />
          <Text style={styles.statChipText}>{ruleCount} Rules</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffffe1',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#8b5cf618',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#8b5cf618',
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  audioPillBtnActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
  },
  audioPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  audioPillTextActive: {
    color: '#ffffff',
  },
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf615',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8b5cf630',
  },
  chineseContentBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chineseText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 28,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  pinyinBox: {
    backgroundColor: '#faf5ff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  pinyinText: {
    fontSize: 14,
    color: '#7e22ce',
    fontWeight: '600',
  },
  meaningBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  meaningText: {
    fontSize: 14,
    color: '#15803d',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
});

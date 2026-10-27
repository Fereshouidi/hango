import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { CharacterIcon } from '@/components/common/CharacterIcon';
import { WordType, HSKType, LessonType } from '@/types';
import { StudyToggleBar } from '../common/StudyToggleBar';

import { HighlightedText } from '../common/HighlightedText';

interface WordHeroCardProps {
  word: WordType | null;
  hsk: HSKType | null;
  lesson: LessonType | null;
  textCount: number;
  sentenceCount: number;
  characterCount: number;
  ruleCount: number;
  isPlaying: boolean;
  onPlay: () => void;
  onEdit?: () => void;
  showPinyin: boolean;
  setShowPinyin: (val: boolean) => void;
  showMeaning: boolean;
  setShowMeaning: (val: boolean) => void;
  searchQuery?: string;
}

export const WordHeroCard: React.FC<WordHeroCardProps> = ({
  word,
  hsk,
  lesson,
  textCount,
  sentenceCount,
  characterCount,
  ruleCount,
  isPlaying,
  onPlay,
  onEdit,
  showPinyin,
  setShowPinyin,
  showMeaning,
  setShowMeaning,
  searchQuery,
}) => {
  const accentColor = '#059669';

  return (
    <View style={styles.card}>
      {/* Top row: big word + info */}
      <View style={styles.topRow}>
        {/* Giant word display */}
        <View style={[styles.wordBox, { borderColor: accentColor + '50', backgroundColor: accentColor + '10' }]}>
          <HighlightedText
            text={word?.content || '？'}
            searchQuery={searchQuery}
            style={[styles.wordSymbol, { color: accentColor }]}
          />
        </View>

        {/* Right info panel */}
        <View style={styles.infoPanel}>
          {/* Pinyin */}
          {word?.pinyin ? (
            <View style={[styles.infoRow, { backgroundColor: accentColor + '12' }]}>
              <Lucide name="mic" size={14} color={accentColor} />
              <HighlightedText
                text={word.pinyin}
                searchQuery={searchQuery}
                style={[styles.pinyinText, { color: accentColor }]}
              />
            </View>
          ) : null}

          {/* Meaning */}
          {word?.meaning ? (
            <View style={styles.infoRow}>
              <Lucide name="book-open" size={14} color="#64748b" />
              <HighlightedText
                text={word.meaning}
                searchQuery={searchQuery}
                style={styles.meaningText}
                numberOfLines={2}
              />
            </View>
          ) : null}

          {/* Actions row: Listen + Edit */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[styles.listenBtn, { flex: 1 }, isPlaying && styles.listenBtnActive, { borderColor: accentColor }]}
              onPress={onPlay}
              activeOpacity={0.8}
            >
              <Lucide
                name={isPlaying ? 'square' : 'volume-2'}
                size={14}
                color={isPlaying ? '#ffffff' : accentColor}
              />
              <Text style={[styles.listenBtnText, { color: isPlaying ? '#ffffff' : accentColor }]}>
                {isPlaying ? 'Stop' : 'Listen'}
              </Text>
            </TouchableOpacity>

            {onEdit && (
              <TouchableOpacity
                style={[styles.listenBtn, { backgroundColor: accentColor + '15', borderColor: accentColor }]}
                onPress={onEdit}
                activeOpacity={0.8}
              >
                <Lucide name="pencil" size={14} color={accentColor} />
                <Text style={[styles.listenBtnText, { color: accentColor }]}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* HSK / Lesson meta row */}
      <View style={styles.metaRow}>
        {hsk ? (
          <View style={styles.metaPill}>
            <Lucide name="layers" size={12} color="#8b5cf6" />
            <Text style={[styles.metaPillText, { color: '#8b5cf6' }]}>{hsk.name}</Text>
          </View>
        ) : null}
        {lesson ? (
          <View style={styles.metaPill}>
            <Lucide name="book-open" size={12} color="#0284c7" />
            <Text style={[styles.metaPillText, { color: '#0284c7' }]}>Lesson {lesson.num}</Text>
          </View>
        ) : null}

        {/* Stats */}
        <View style={styles.statPill}>
          <Lucide name="file-text" size={12} color="#3b82f6" />
          <Text style={styles.statText}>{textCount} texts</Text>
        </View>
        <View style={styles.statPill}>
          <Lucide name="message-square-text" size={12} color="#8b5cf6" />
          <Text style={styles.statText}>{sentenceCount} sentences</Text>
        </View>
        <View style={styles.statPill}>
          <CharacterIcon size={12} color="#ec4899" />
          <Text style={styles.statText}>{characterCount} chars</Text>
        </View>
        <View style={styles.statPill}>
          <Lucide name="graduation-cap" size={12} color="#d97706" />
          <Text style={styles.statText}>{ruleCount} rules</Text>
        </View>
      </View>

      {/* Study Toggle */}
      <StudyToggleBar
        showPinyin={showPinyin}
        setShowPinyin={setShowPinyin}
        showMeaning={showMeaning}
        setShowMeaning={setShowMeaning}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffffd9',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  wordBox: {
    width: 84,
    height: 84,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wordSymbol: {
    fontSize: 30,
    fontWeight: '800',
  },
  infoPanel: {
    flex: 1,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pinyinText: {
    fontSize: 14,
    fontWeight: '700',
  },
  meaningText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    flexShrink: 1,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 0.5,
    backgroundColor: '#f8fafc',
  },
  listenBtnActive: {
    backgroundColor: '#059669',
  },
  listenBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  metaPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
});

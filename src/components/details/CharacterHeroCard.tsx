import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { CharacterType, HSKType, LessonType } from '@/types';
import { StudyToggleBar } from '../common/StudyToggleBar';
import { HighlightedText } from '../common/HighlightedText';

const toneColors: Record<string, string> = {
  '1': '#ef4444',
  '2': '#f59e0b',
  '3': '#10b981',
  '4': '#3b82f6',
  '5': '#6b7280',
};

const toneLabels: Record<string, string> = {
  '1': '1st Tone — High Level (ˉ)',
  '2': '2nd Tone — Rising (ˊ)',
  '3': '3rd Tone — Falling-Rising (ˇ)',
  '4': '4th Tone — Falling (ˋ)',
  '5': 'Neutral Tone',
};

interface CharacterHeroCardProps {
  character: CharacterType | null;
  hsk: HSKType | null;
  lesson: LessonType | null;
  textCount: number;
  wordCount: number;
  sentenceCount: number;
  ruleCount: number;
  isPlaying: boolean;
  onPlay: () => void;
  onEdit?: () => void;
  onWrite?: () => void;
  showPinyin: boolean;
  setShowPinyin: (val: boolean) => void;
  showMeaning: boolean;
  setShowMeaning: (val: boolean) => void;
  searchQuery?: string;
}

export const CharacterHeroCard: React.FC<CharacterHeroCardProps> = ({
  character,
  hsk,
  lesson,
  textCount,
  wordCount,
  sentenceCount,
  ruleCount,
  isPlaying,
  onPlay,
  onEdit,
  onWrite,
  showPinyin,
  setShowPinyin,
  showMeaning,
  setShowMeaning,
  searchQuery,
}) => {
  const toneKey = character?.tone || '5';
  const toneColor = toneColors[toneKey] || '#6b7280';
  const toneLabel = toneLabels[toneKey] || 'Neutral Tone';

  return (
    <View style={styles.card}>
      {/* Top row: big character + play button */}
      <View style={styles.topRow}>
        {/* Giant character display */}
        <View style={[styles.charBox, { borderColor: toneColor + '50', backgroundColor: toneColor + '10' }]}>
          <HighlightedText
            text={character?.content || '？'}
            searchQuery={searchQuery}
            style={[styles.charSymbol, { color: toneColor }]}
          />
          <View style={[styles.toneBadge, { backgroundColor: toneColor }]}>
            <Text style={styles.toneBadgeText}>T{toneKey}</Text>
          </View>
        </View>

        {/* Right info panel */}
        <View style={styles.infoPanel}>
          {/* Pinyin */}
          {character?.pinyin ? (
            <View style={[styles.infoRow, { backgroundColor: toneColor + '12' }]}>
              <Lucide name="mic" size={14} color={toneColor} />
              <HighlightedText
                text={character.pinyin}
                searchQuery={searchQuery}
                style={[styles.pinyinText, { color: toneColor }]}
              />
            </View>
          ) : null}

          {/* Meaning */}
          {character?.meaning ? (
            <View style={styles.infoRow}>
              <Lucide name="book-open" size={14} color="#64748b" />
              <HighlightedText
                text={character.meaning}
                searchQuery={searchQuery}
                style={styles.meaningText}
                numberOfLines={2}
              />
            </View>
          ) : null}

          {/* Tone label */}
          <View style={[styles.infoRow, { backgroundColor: toneColor + '10' }]}>
            <Lucide name="music" size={14} color={toneColor} />
            <Text style={[styles.toneLabel, { color: toneColor }]}>{toneLabel}</Text>
          </View>

          {/* Actions row: Listen + Write + Edit */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={[styles.listenBtn, { flex: 1 }, isPlaying && styles.listenBtnActive, { borderColor: toneColor }]}
              onPress={onPlay}
              activeOpacity={0.8}
            >
              <Lucide
                name={isPlaying ? 'square' : 'volume-2'}
                size={14}
                color={isPlaying ? '#ffffff' : toneColor}
              />
              <Text style={[styles.listenBtnText, { color: isPlaying ? '#ffffff' : toneColor }]}>
                {isPlaying ? 'Stop' : 'Listen'}
              </Text>
            </TouchableOpacity>

            {onWrite && (
              <TouchableOpacity
                style={[styles.listenBtn, { backgroundColor: toneColor + '18', borderColor: toneColor }]}
                onPress={onWrite}
                activeOpacity={0.8}
              >
                <Lucide name="pencil-line" size={14} color={toneColor} />
                <Text style={[styles.listenBtnText, { color: toneColor }]}>Write</Text>
              </TouchableOpacity>
            )}

            {onEdit && (
              <TouchableOpacity
                style={[styles.listenBtn, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}
                onPress={onEdit}
                activeOpacity={0.8}
              >
                <Lucide name="pencil" size={14} color="#64748b" />
                <Text style={[styles.listenBtnText, { color: '#64748b' }]}>Edit</Text>
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
          <Lucide name="languages" size={12} color="#059669" />
          <Text style={styles.statText}>{wordCount} words</Text>
        </View>
        <View style={styles.statPill}>
          <Lucide name="message-square-text" size={12} color="#8b5cf6" />
          <Text style={styles.statText}>{sentenceCount} sentences</Text>
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
        accentColor={toneColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffffe3',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  topRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  charBox: {
    width: 110,
    height: 110,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  charSymbol: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: 0,
  },
  toneBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  toneBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  infoPanel: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#f8fafc',
  },
  pinyinText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  meaningText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    flex: 1,
  },
  toneLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
  },
  listenBtnActive: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  listenBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#f8f0ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
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
    backgroundColor: '#f1f5f9',
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
});

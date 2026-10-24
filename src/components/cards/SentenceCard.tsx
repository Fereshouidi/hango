import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { SentenceType } from '@/types';
import { speakChineseText } from '@/utils/tts';

import { HighlightedText } from '../common/HighlightedText';

interface SentenceCardProps {
  sentence: SentenceType;
  index?: number;
  searchQuery?: string;
  showPinyin?: boolean;
  showMeaning?: boolean;
  cardBg?: string;
  isPlaying?: boolean;
  onPlayAudio?: (id: number, text: string) => void;
  accentColor?: string;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
  onOptionsPress?: () => void;
}

export const SentenceCard: React.FC<SentenceCardProps> = React.memo(({
  sentence,
  index,
  searchQuery,
  showPinyin = true,
  showMeaning = true,
  cardBg,
  isPlaying,
  onPlayAudio,
  accentColor = '#8b5cf6',
  isSelected = false,
  isSelectionMode = false,
  onLongPress,
  onPress,
  onOptionsPress,
}) => {
  const router = useRouter();
  const [localPlaying, setLocalPlaying] = React.useState(false);
  const activePlaying = isPlaying !== undefined ? isPlaying : localPlaying;

  const handleSpeech = () => {
    if (onPlayAudio && sentence.id) {
      onPlayAudio(sentence.id, sentence.content);
    } else {
      setLocalPlaying(true);
      speakChineseText(
        sentence.content,
        () => setLocalPlaying(true),
        () => setLocalPlaying(false)
      );
    }
  };

  const handlePressCard = () => {
    if (isSelectionMode && onPress) {
      onPress();
    } else if (onPress) {
      onPress();
    } else {
      router.push(`/pages/sentenceDetails/${sentence.id}` as any);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        cardBg ? { backgroundColor: cardBg } : styles.defaultBg,
        isSelected && { borderColor: '#0f172a', borderWidth: 3.5 },
        isSelectionMode && !isSelected && { opacity: 0.85 },
      ]}
      onPress={handlePressCard}
      onLongPress={onLongPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        {isSelectionMode ? (
          <View style={[styles.selectBadge, isSelected ? { backgroundColor: '#0f172a' } : { borderColor: '#ffffff', borderWidth: 1.5, backgroundColor: 'rgba(0,0,0,0.2)' }]}>
            {isSelected && <Lucide name="check" size={12} color="#ffffff" />}
          </View>
        ) : index !== undefined ? (
          <View style={[styles.indexBadge, cardBg ? styles.whiteBadgeBg : { backgroundColor: accentColor + '20' }]}>
            <Text style={[styles.indexBadgeText, cardBg ? styles.whiteText : { color: accentColor }]}>
              #{sentence.id || (index !== undefined ? index + 1 : 1)}
            </Text>
          </View>
        ) : (
          <View />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity
            style={[
              styles.playBtn,
              cardBg ? styles.whitePlayBtnBg : { backgroundColor: accentColor + '20' },
              activePlaying && styles.playingBtnActive,
            ]}
            onPress={handleSpeech}
            activeOpacity={0.7}
          >
            <Lucide
              name={activePlaying ? 'volume-2' : 'volume-1'}
              size={16}
              color={activePlaying ? '#ffffff' : cardBg ? '#ffffff' : accentColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playBtn,
              cardBg ? styles.whitePlayBtnBg : { backgroundColor: accentColor + '20' },
            ]}
            onPress={onOptionsPress || onLongPress}
            activeOpacity={0.7}
          >
            <Lucide
              name="more-vertical"
              size={16}
              color={cardBg ? '#ffffff' : accentColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      <HighlightedText
        text={sentence.content}
        highlight={searchQuery}
        isCardBg={Boolean(cardBg)}
        style={[styles.chineseText, cardBg && styles.whiteText]}
      />

      {showPinyin && sentence.pinyin ? (
        <HighlightedText
          text={sentence.pinyin}
          highlight={searchQuery}
          isCardBg={Boolean(cardBg)}
          style={[styles.pinyinText, cardBg ? styles.whiteSubtext : styles.darkSubtext]}
        />
      ) : null}

      {showMeaning && sentence.meaning ? (
        <HighlightedText
          text={sentence.meaning}
          highlight={searchQuery}
          isCardBg={Boolean(cardBg)}
          style={[styles.meaningText, cardBg ? styles.whiteSubtext : styles.darkMeaning]}
        />
      ) : null}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    gap: 6,
    marginVertical: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    // elevation: 2,
  },
  defaultBg: {
    // backgroundColor: '#ffffff48',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  indexBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  whiteBadgeBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  indexBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  selectBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whitePlayBtnBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  playingBtnActive: {
    backgroundColor: '#8b5cf6',
  },
  chineseText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.5,
    lineHeight: 28,
  },
  pinyinText: {
    fontSize: 14,
    fontWeight: '600',
  },
  meaningText: {
    fontSize: 13,
    fontWeight: '500',
  },
  whiteText: {
    color: '#ffffff',
  },
  whiteSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  darkSubtext: {
    color: '#64748b',
  },
  darkMeaning: {
    color: '#334155',
  },
});

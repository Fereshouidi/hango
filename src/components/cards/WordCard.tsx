import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { WordType } from '@/types';
import { speakChineseText } from '@/utils/tts';

interface WordCardProps {
  word: WordType;
  index?: number;
  showPinyin?: boolean;
  showMeaning?: boolean;
  cardBg?: string;
  isPlaying?: boolean;
  onPlayAudio?: (id: number, text: string) => void;
  accentColor?: string;
}

export const WordCard: React.FC<WordCardProps> = ({
  word,
  index,
  showPinyin = true,
  showMeaning = true,
  cardBg,
  isPlaying,
  onPlayAudio,
  accentColor = '#059669',
}) => {
  const router = useRouter();

  const handleSpeech = (e: any) => {
    e.stopPropagation();
    if (onPlayAudio && word.id) {
      onPlayAudio(word.id, word.content);
    } else {
      speakChineseText(word.content);
    }
  };

  const handlePressCard = () => {
    router.push(`/pages/wordDetails/${word.id}` as any);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        cardBg ? { backgroundColor: cardBg } : styles.defaultBg,
      ]}
      onPress={handlePressCard}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        {index !== undefined ? (
          <View style={[styles.indexBadge, cardBg ? styles.whiteBadgeBg : { backgroundColor: accentColor + '20' }]}>
            <Text style={[styles.indexBadgeText, cardBg ? styles.whiteText : { color: accentColor }]}>
              #{index + 1}
            </Text>
          </View>
        ) : (
          <View />
        )}

        <TouchableOpacity
          style={[
            styles.playBtn,
            cardBg ? styles.whitePlayBtnBg : { backgroundColor: accentColor + '20' },
            isPlaying && styles.playingBtnActive,
          ]}
          onPress={handleSpeech}
          activeOpacity={0.7}
        >
          <Lucide
            name={isPlaying ? 'volume-2' : 'volume-1'}
            size={15}
            color={isPlaying ? '#ffffff' : cardBg ? '#ffffff' : accentColor}
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.chineseText, cardBg && styles.whiteText]}>
        {word.content}
      </Text>

      {showPinyin && word.pinyin ? (
        <Text style={[styles.pinyinText, cardBg ? styles.whiteSubtext : styles.darkSubtext]} numberOfLines={1}>
          {word.pinyin}
        </Text>
      ) : null}

      {showMeaning && word.meaning ? (
        <Text style={[styles.meaningText, cardBg ? styles.whiteSubtext : styles.darkMeaning]} numberOfLines={2}>
          {word.meaning}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 5,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    // elevation: 2,
  },
  defaultBg: {
    // backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
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
    fontSize: 11,
    fontWeight: '700',
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whitePlayBtnBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  playingBtnActive: {
    backgroundColor: '#059669',
  },
  chineseText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  pinyinText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  meaningText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  whiteText: {
    color: '#ffffff',
  },
  whiteSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  darkSubtext: {
    color: '#059669',
  },
  darkMeaning: {
    color: '#334155',
  },
});

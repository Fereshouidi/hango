import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { SentenceType } from '@/types';
import { speakChineseText } from '@/utils/tts';

interface SentenceCardProps {
  sentence: SentenceType;
  index?: number;
  showPinyin?: boolean;
  showMeaning?: boolean;
  cardBg?: string;
  isPlaying?: boolean;
  onPlayAudio?: (id: number, text: string) => void;
  accentColor?: string;
}

export const SentenceCard: React.FC<SentenceCardProps> = ({
  sentence,
  index,
  showPinyin = true,
  showMeaning = true,
  cardBg,
  isPlaying,
  onPlayAudio,
  accentColor = '#8b5cf6',
}) => {
  const router = useRouter();

  const handleSpeech = (e: any) => {
    e.stopPropagation();
    if (onPlayAudio && sentence.id) {
      onPlayAudio(sentence.id, sentence.content);
    } else {
      speakChineseText(sentence.content);
    }
  };

  const handlePressCard = () => {
    router.push(`/pages/sentenceDetails/${sentence.id}` as any);
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
            size={16}
            color={isPlaying ? '#ffffff' : cardBg ? '#ffffff' : accentColor}
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.chineseText, cardBg && styles.whiteText]}>
        {sentence.content}
      </Text>

      {showPinyin && sentence.pinyin ? (
        <Text style={[styles.pinyinText, cardBg ? styles.whiteSubtext : styles.darkSubtext]}>
          {sentence.pinyin}
        </Text>
      ) : null}

      {showMeaning && sentence.meaning ? (
        <Text style={[styles.meaningText, cardBg ? styles.whiteSubtext : styles.darkMeaning]}>
          {sentence.meaning}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

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

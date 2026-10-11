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
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
  onOptionsPress?: () => void;
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
    if (onPlayAudio && word.id) {
      onPlayAudio(word.id, word.content);
    } else {
      setLocalPlaying(true);
      speakChineseText(
        word.content,
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
      router.push(`/pages/wordDetails/${word.id}` as any);
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
              #{index + 1}
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
              size={15}
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
              size={15}
              color={cardBg ? '#ffffff' : accentColor}
            />
          </TouchableOpacity>
        </View>
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
    width: "48%",
    margin: "1%",
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
  selectBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
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

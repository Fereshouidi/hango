import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { WordType } from '@/types';
import { speakChineseText } from '@/utils/tts';
import { HighlightedText } from '../common/HighlightedText';

export const VIBRANT_GRADIENTS: [string, string][] = [
  ['#ec4899', '#be185d'], // Rose Pink
  ['#3b82f6', '#1d4ed8'], // Ocean Blue
  ['#f59e0b', '#d97706'], // Warm Amber
  ['#8b5cf6', '#6d28d9'], // Vivid Violet
  ['#10b981', '#047857'], // Emerald Green
  ['#ef4444', '#b91c1c'], // Crimson Red
  ['#06b6d4', '#0e7490'], // Cyan Teal
  ['#f97316', '#c2410c'], // Radiant Coral
  ['#6366f1', '#4338ca'], // Royal Indigo
  ['#14b8a6', '#0f766e'], // Deep Teal
];

interface WordCardProps {
  word: WordType;
  index?: number;
  numColumns?: number;
  searchQuery?: string;
  style?: any;
  showPinyin?: boolean;
  showMeaning?: boolean;
  cardBg?: string;
  isPlaying?: boolean;
  onPlayAudio?: (id: number, text: string) => void;
  accentColor?: string;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onLongPress?: (word: WordType) => void;
  onPress?: (word: WordType) => void;
  onOptionsPress?: (word: WordType) => void;
}

export const WordCard: React.FC<WordCardProps> = React.memo(({
  word,
  index = 0,
  numColumns,
  searchQuery,
  style,
  showPinyin = true,
  showMeaning = true,
  cardBg,
  isPlaying,
  onPlayAudio,
  isSelected = false,
  isSelectionMode = false,
  onLongPress,
  onPress,
  onOptionsPress,
}) => {
  const router = useRouter();
  const [localPlaying, setLocalPlaying] = React.useState(false);
  const activePlaying = isPlaying !== undefined ? isPlaying : localPlaying;

  const gradientColors = VIBRANT_GRADIENTS[(index || 0) % VIBRANT_GRADIENTS.length];
  const primaryColor = gradientColors[0];

  const hasExplicitCols = numColumns !== undefined;
  const colCount = Math.max(2, Math.min(6, numColumns || 2));
  const cardWidth = hasExplicitCols ? `${Math.floor((100 / colCount) * 10) / 10 - 1}%` : '48.5%';
  const isCompact = hasExplicitCols && colCount >= 4;
  const isVeryCompact = hasExplicitCols && colCount >= 5;
  const cardPadding = isVeryCompact ? 6 : isCompact ? 8 : 12;

  const chineseFontSize = hasExplicitCols
    ? colCount <= 2 ? 22 : colCount === 3 ? 18 : colCount === 4 ? 15 : colCount === 5 ? 13 : 11
    : 20;
  const pinyinFontSize = hasExplicitCols
    ? colCount <= 2 ? 12.5 : colCount === 3 ? 11 : colCount === 4 ? 9.5 : 8
    : 13;
  const meaningFontSize = hasExplicitCols
    ? colCount <= 2 ? 11.5 : colCount === 3 ? 10 : colCount === 4 ? 8.5 : 7.5
    : 11.5;
  const btnSize = isVeryCompact ? 20 : isCompact ? 22 : 26;
  const iconSize = isVeryCompact ? 10 : isCompact ? 11 : 13;

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
    if (onPress) {
      onPress(word);
    } else {
      router.push(`/pages/wordDetails/${word.id}` as any);
    }
  };

  const handleLongPressCard = () => {
    if (onLongPress) {
      onLongPress(word);
    }
  };

  const handleOptionsPressCard = () => {
    if (onOptionsPress) {
      onOptionsPress(word);
    } else if (onLongPress) {
      onLongPress(word);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: cardWidth as any,
          padding: cardPadding,
          margin: hasExplicitCols ? '0.5%' : '0.75%',
          shadowColor: primaryColor,
        },
        isSelected && styles.cardSelected,
        isSelectionMode && !isSelected && styles.cardUnselectedDimmed,
        style,
      ]}
      onPress={handlePressCard}
      onLongPress={handleLongPressCard}
      activeOpacity={0.88}
    >
      {/* Rich Vibrant Gradient Surface */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Subtle Gloss Highlight */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={styles.glossHighlight}
        pointerEvents="none"
      />

      {/* Header Row */}
      <View style={styles.header}>
        {isSelectionMode ? (
          <View
            style={[
              styles.selectBadge,
              { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
              isSelected ? styles.selectBadgeActive : styles.selectBadgeInactive,
            ]}
          >
            {isSelected && <Lucide name="check" size={iconSize} color="#0f172a" />}
          </View>
        ) : index !== undefined ? (
          <View style={[styles.frostedBadge, isVeryCompact && styles.frostedBadgeCompact]}>
            <Text
              style={[
                styles.indexBadgeText,
                isVeryCompact && { fontSize: 8 },
              ]}
            >
              #{index + 1}
            </Text>
          </View>
        ) : (
          <View />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isVeryCompact ? 3 : 5 }}>
          {/* Frosted Glass Audio Button */}
          <TouchableOpacity
            style={[
              styles.frostedBtn,
              { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
              activePlaying && styles.frostedBtnActive,
            ]}
            onPress={handleSpeech}
            activeOpacity={0.7}
          >
            <Lucide
              name={activePlaying ? 'volume-2' : 'volume-1'}
              size={iconSize}
              color="#ffffff"
            />
          </TouchableOpacity>

          {/* Frosted Glass More Options Button */}
          <TouchableOpacity
            style={[
              styles.frostedBtn,
              { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
            ]}
            onPress={handleOptionsPressCard}
            activeOpacity={0.7}
          >
            <Lucide
              name="more-vertical"
              size={iconSize}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chinese Word (Crisp White with Subtle Depth) */}
      <HighlightedText
        text={word.content}
        highlight={searchQuery}
        isCardBg={true}
        style={[
          styles.chineseText,
          { fontSize: chineseFontSize },
        ]}
      />

      {/* Pinyin (Luminous Frosted White) */}
      {showPinyin && word.pinyin ? (
        <HighlightedText
          text={word.pinyin}
          highlight={searchQuery}
          isCardBg={true}
          style={[
            styles.pinyinText,
            { fontSize: pinyinFontSize },
          ]}
          numberOfLines={1}
        />
      ) : null}

      {/* English Meaning (Soft Translucent White) */}
      {showMeaning && word.meaning ? (
        <HighlightedText
          text={word.meaning}
          highlight={searchQuery}
          isCardBg={true}
          style={[
            styles.meaningText,
            { fontSize: meaningFontSize },
          ]}
          numberOfLines={2}
        />
      ) : null}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
    position: 'relative',
    gap: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },
  glossHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  cardSelected: {
    borderColor: '#ffffff',
    borderWidth: 3.5,
  },
  cardUnselectedDimmed: {
    opacity: 0.72,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  frostedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderColor: 'rgba(255, 255, 255, 0.38)',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  frostedBadgeCompact: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  indexBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  frostedBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
  },
  frostedBtnActive: {
    backgroundColor: '#ffffff',
  },
  selectBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBadgeActive: {
    backgroundColor: '#ffffff',
  },
  selectBadgeInactive: {
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  chineseText: {
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pinyinText: {
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  meaningText: {
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 14.5,
  },
});

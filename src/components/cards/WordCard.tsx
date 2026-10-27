import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { WordType } from '@/types';
import { speakChineseText } from '@/utils/tts';
import { HighlightedText } from '../common/HighlightedText';

interface WordCardProps {
  word: WordType;
  index?: number;
  numColumns?: number;
  searchQuery?: string;
  highlightStyle?: import('react-native').StyleProp<import('react-native').TextStyle>;
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
  index,
  numColumns = 2,
  searchQuery,
  highlightStyle,
  style,
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

  const hasExplicitCols = numColumns !== undefined;
  const colCount = Math.max(2, Math.min(6, numColumns || 2));
  const cardWidth = hasExplicitCols ? `${Math.floor((100 / colCount) * 10) / 10 - 1}%` : '48.5%';
  const isCompact = hasExplicitCols && colCount >= 4;
  const isVeryCompact = hasExplicitCols && colCount >= 5;
  const cardPadding = isVeryCompact ? 5 : isCompact ? 7 : 12;
  const chineseFontSize = hasExplicitCols
    ? colCount <= 2 ? 22 : colCount === 3 ? 18 : colCount === 4 ? 15 : colCount === 5 ? 13 : 11
    : 20;
  const pinyinFontSize = hasExplicitCols
    ? colCount <= 2 ? 12 : colCount === 3 ? 10.5 : colCount === 4 ? 9.5 : 8
    : 13;
  const meaningFontSize = hasExplicitCols
    ? colCount <= 2 ? 11 : colCount === 3 ? 9.5 : colCount === 4 ? 8.5 : 7.5
    : 11.5;
  const btnSize = isVeryCompact ? 18 : isCompact ? 20 : 24;
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
        },
        cardBg ? { backgroundColor: cardBg } : styles.defaultBg,
        isSelected && { borderColor: '#0f172a', borderWidth: 3.5 },
        isSelectionMode && !isSelected && { opacity: 0.85 },
        style,
      ]}
      onPress={handlePressCard}
      onLongPress={handleLongPressCard}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        {isSelectionMode ? (
          <View
            style={[
              styles.selectBadge,
              { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
              isSelected
                ? { backgroundColor: '#0f172a' }
                : { borderColor: '#ffffff', borderWidth: 1.5, backgroundColor: 'rgba(0,0,0,0.2)' },
            ]}
          >
            {isSelected && <Lucide name="check" size={iconSize} color="#ffffff" />}
          </View>
        ) : index !== undefined ? (
          <View
            style={[
              styles.indexBadge,
              cardBg ? styles.whiteBadgeBg : { backgroundColor: accentColor + '20' },
              isVeryCompact && { paddingHorizontal: 3, paddingVertical: 0.5 },
            ]}
          >
            <Text
              style={[
                styles.indexBadgeText,
                cardBg ? styles.whiteText : { color: accentColor },
                isVeryCompact && { fontSize: 8 },
              ]}
            >
              #{index + 1}
            </Text>
          </View>
        ) : (
          <View />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isVeryCompact ? 2 : 4 }}>
          <TouchableOpacity
            style={[
              styles.playBtn,
              { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
              cardBg ? styles.whitePlayBtnBg : { backgroundColor: accentColor + '20' },
              activePlaying && styles.playingBtnActive,
            ]}
            onPress={handleSpeech}
            activeOpacity={0.7}
          >
            <Lucide
              name={activePlaying ? 'volume-2' : 'volume-1'}
              size={iconSize}
              color={activePlaying ? '#ffffff' : cardBg ? '#ffffff' : accentColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playBtn,
              { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
              cardBg ? styles.whitePlayBtnBg : { backgroundColor: accentColor + '20' },
            ]}
            onPress={handleOptionsPressCard}
            activeOpacity={0.7}
          >
            <Lucide
              name="more-vertical"
              size={iconSize}
              color={cardBg ? '#ffffff' : accentColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      <HighlightedText
        text={word.content}
        highlight={searchQuery}
        highlightStyle={highlightStyle}
        isCardBg={Boolean(cardBg)}
        style={[
          styles.chineseText,
          { fontSize: chineseFontSize },
          cardBg && styles.whiteText,
        ]}
      />

      {showPinyin && word.pinyin ? (
        <HighlightedText
          text={word.pinyin}
          highlight={searchQuery}
          highlightStyle={highlightStyle}
          isCardBg={Boolean(cardBg)}
          style={[
            styles.pinyinText,
            { fontSize: pinyinFontSize },
            cardBg ? styles.whiteSubtext : styles.darkSubtext,
          ]}
          numberOfLines={1}
        />
      ) : null}

      {showMeaning && word.meaning ? (
        <HighlightedText
          text={word.meaning}
          highlight={searchQuery}
          highlightStyle={highlightStyle}
          isCardBg={Boolean(cardBg)}
          style={[
            styles.meaningText,
            { fontSize: meaningFontSize },
            cardBg ? styles.whiteSubtext : styles.darkMeaning,
          ]}
          numberOfLines={2}
        />
      ) : null}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '24%',
    margin: '0.5%',
    borderRadius: 12,
    padding: 8,
    gap: 3,
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
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  whiteBadgeBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  indexBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  playBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  pinyinText: {
    fontSize: 10,
    fontWeight: '600',
  },
  meaningText: {
    fontSize: 9.5,
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

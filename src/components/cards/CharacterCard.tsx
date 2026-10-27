import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { CharacterType } from '@/types';
import { speakChineseText } from '@/utils/tts';
import { HighlightedText } from '../common/HighlightedText';

const toneColors: Record<string, string> = {
  '1': '#ef4444',
  '2': '#f59e0b',
  '3': '#10b981',
  '4': '#3b82f6',
  '5': '#6b7280',
};

interface CharacterCardProps {
  char?: CharacterType;
  character?: CharacterType;
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
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onLongPress?: (char: CharacterType) => void;
  onPress?: (char: CharacterType) => void;
  onOptionsPress?: (char: CharacterType) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = React.memo(({
  char,
  character,
  index,
  numColumns,
  searchQuery,
  highlightStyle,
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
  const item = char || character;

  if (!item) return null;

  const hasExplicitCols = numColumns !== undefined;
  const colCount = Math.max(2, Math.min(6, numColumns || 2));
  const cardWidth = hasExplicitCols ? `${Math.floor((100 / colCount) * 10) / 10 - 1}%` : '100%';
  const isCompact = hasExplicitCols && colCount >= 4;
  const isVeryCompact = hasExplicitCols && colCount >= 5;
  const cardPadding = isVeryCompact ? 5 : isCompact ? 7 : 12;
  const cardMinHeight = !hasExplicitCols || colCount <= 2 ? 120 : colCount === 3 ? 100 : colCount === 4 ? 82 : 68;

  const charFontSize = hasExplicitCols
    ? colCount <= 2 ? 30 : colCount === 3 ? 24 : colCount === 4 ? 20 : colCount === 5 ? 16 : 14
    : 28;
  const pinyinFontSize = hasExplicitCols
    ? colCount <= 2 ? 14 : colCount === 3 ? 12 : colCount === 4 ? 10 : 8.5
    : 13;
  const meaningFontSize = hasExplicitCols
    ? colCount <= 2 ? 12 : colCount === 3 ? 10.5 : colCount === 4 ? 9 : 8
    : 12;
  const toneBadgeFontSize = hasExplicitCols
    ? colCount <= 2 ? 11 : colCount === 3 ? 10 : colCount === 4 ? 9 : 8
    : 11;

  const btnSize = isVeryCompact ? 18 : isCompact ? 20 : 26;
  const iconSize = isVeryCompact ? 10 : isCompact ? 11 : 13;

  const toneKey = item.tone || '5';
  const toneColor = toneColors[toneKey] || '#ec4899';

  const handleSpeech = () => {
    if (onPlayAudio && item.id) {
      onPlayAudio(item.id, item.content);
    } else {
      setLocalPlaying(true);
      speakChineseText(
        item.content,
        () => setLocalPlaying(true),
        () => setLocalPlaying(false)
      );
    }
  };

  const handlePressCard = () => {
    if (onPress) {
      onPress(item);
    } else if (item.id) {
      router.push(`/pages/characterDetails/${item.id}` as any);
    }
  };

  const handleLongPressCard = () => {
    if (onLongPress) {
      onLongPress(item);
    }
  };

  const handleOptionsPressCard = () => {
    if (onOptionsPress) {
      onOptionsPress(item);
    } else if (onLongPress) {
      onLongPress(item);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          width: cardWidth as any,
          padding: cardPadding,
          margin: hasExplicitCols ? '0.5%' : 0,
          minHeight: cardMinHeight,
        },
        cardBg ? { backgroundColor: cardBg } : [styles.defaultBg, { borderColor: '#ec4899' + '40' }],
        isSelected && { borderColor: '#0f172a', borderWidth: 2 },
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
        ) : (
          <View
            style={[
              styles.toneBadge,
              cardBg ? styles.whiteBadgeBg : { backgroundColor: '#ec4899' },
              isVeryCompact && { paddingHorizontal: 4, paddingVertical: 1 },
            ]}
          >
            <Text
              style={[
                styles.toneBadgeText,
                { fontSize: toneBadgeFontSize },
                cardBg && styles.whiteText,
              ]}
            >
              T{toneKey}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isVeryCompact ? 2 : 3 }}>
          {!isVeryCompact && (
            <TouchableOpacity
              style={[
                styles.playBtn,
                { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
                cardBg ? styles.whitePlayBtnBg : { backgroundColor: '#ec4899' + '15' },
              ]}
              onPress={() => {
                if (item.id) {
                  router.push(`/pages/characterWrite/${item.id}` as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Lucide
                name="pencil-line"
                size={iconSize}
                color={cardBg ? '#ffffff' : '#ec4899'}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.playBtn,
              { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
              cardBg ? styles.whitePlayBtnBg : { backgroundColor: '#ec4899' + '20' },
              activePlaying && styles.playingBtnActive,
            ]}
            onPress={handleSpeech}
            activeOpacity={0.7}
          >
            <Lucide
              name={activePlaying ? 'volume-2' : 'volume-1'}
              size={iconSize}
              color={activePlaying ? '#ffffff' : cardBg ? '#ffffff' : '#ec4899'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playBtn,
              { width: btnSize, height: btnSize, borderRadius: btnSize / 2 },
              cardBg ? styles.whitePlayBtnBg : { backgroundColor: '#ec4899' + '20' },
            ]}
            onPress={handleOptionsPressCard}
            activeOpacity={0.7}
          >
            <Lucide
              name="more-vertical"
              size={iconSize}
              color={cardBg ? '#ffffff' : '#ec4899'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <HighlightedText
        text={item.content || '？'}
        highlight={searchQuery}
        highlightStyle={highlightStyle}
        isCardBg={Boolean(cardBg)}
        style={[
          styles.charSymbol,
          { fontSize: charFontSize },
          cardBg && styles.whiteText,
        ]}
      />

      {showPinyin && item.pinyin ? (
        <HighlightedText
          text={item.pinyin}
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

      {showMeaning && item.meaning ? (
        <HighlightedText
          text={item.meaning}
          highlight={searchQuery}
          highlightStyle={highlightStyle}
          isCardBg={Boolean(cardBg)}
          style={[
            styles.meaningText,
            { fontSize: meaningFontSize, minHeight: meaningFontSize * 2.2 },
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
    borderRadius: 12,
    gap: 3,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    justifyContent: 'space-between',
  },
  defaultBg: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  toneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  whiteBadgeBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  toneBadgeText: {
    fontWeight: '700',
    color: '#ffffff',
  },
  selectBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  whitePlayBtnBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  playingBtnActive: {
    backgroundColor: '#ec4899',
  },
  charSymbol: {
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  pinyinText: {
    fontWeight: '600',
  },
  meaningText: {
    fontWeight: '500',
  },
  whiteText: {
    color: '#ffffff',
  },
  whiteSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  darkSubtext: {
    color: '#ec4899',
  },
  darkMeaning: {
    color: '#475569',
  },
});

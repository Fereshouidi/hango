import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { CharacterType } from '@/types';
import { speakChineseText } from '@/utils/tts';

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
  showPinyin?: boolean;
  showMeaning?: boolean;
  cardBg?: string;
  isPlaying?: boolean;
  onPlayAudio?: (id: number, text: string) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
  onOptionsPress?: () => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  char,
  character,
  index,
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
    if (isSelectionMode && onPress) {
      onPress();
    } else if (onPress) {
      onPress();
    } else if (item.id) {
      router.push(`/pages/characterDetails/${item.id}` as any);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        cardBg ? { backgroundColor: cardBg } : [styles.defaultBg, { borderColor: '#ec4899' + '40' }],
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
        ) : (
          <View style={[styles.toneBadge, cardBg ? styles.whiteBadgeBg : { backgroundColor: '#ec4899' }]}>
            <Text style={[styles.toneBadgeText, cardBg && styles.whiteText]}>T{toneKey}</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity
            style={[
              styles.playBtn,
              cardBg ? styles.whitePlayBtnBg : { backgroundColor: "#ec4899" + '15' },
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
              size={13}
              color={cardBg ? '#ffffff' : "#ec4899"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playBtn,
              cardBg ? styles.whitePlayBtnBg : { backgroundColor: "#ec4899" + '20' },
              activePlaying && styles.playingBtnActive,
            ]}
            onPress={handleSpeech}
            activeOpacity={0.7}
          >
            <Lucide
              name={activePlaying ? 'volume-2' : 'volume-1'}
              size={14}
              color={activePlaying ? '#ffffff' : cardBg ? '#ffffff' : "#ec4899"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playBtn,
              cardBg ? styles.whitePlayBtnBg : { backgroundColor: "#ec4899" + '20' },
            ]}
            onPress={onOptionsPress || onLongPress}
            activeOpacity={0.7}
          >
            <Lucide
              name="more-vertical"
              size={14}
              color={cardBg ? '#ffffff' : "#ec4899"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.charSymbol, cardBg && styles.whiteText]}>
        {item.content || '？'}
      </Text>

      {showPinyin && item.pinyin ? (
        <Text style={[styles.pinyinText, cardBg ? styles.whiteSubtext : styles.darkSubtext]} numberOfLines={1}>
          {item.pinyin}
        </Text>
      ) : null}

      {showMeaning && item.meaning ? (
        <Text style={[styles.meaningText, cardBg ? styles.whiteSubtext : styles.darkMeaning]} numberOfLines={1}>
          {item.meaning}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    // backgroundColor: "red",
    // width: "105%",
    borderRadius: 16,
    padding: 12,
    gap: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    margin: 0
    // elevation: 2,
  },
  defaultBg: {
    // backgroundColor: '#ffffff',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  toneBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  whiteBadgeBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  toneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  selectBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#ec4899',
  },
  charSymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1,
  },
  pinyinText: {
    fontSize: 13,
    fontWeight: '600',
  },
  meaningText: {
    fontSize: 12,
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

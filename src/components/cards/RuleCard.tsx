import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { RuleType } from '@/types';
import { speakEnglishText } from '@/utils/tts';

import { HighlightedText } from '../common/HighlightedText';

interface RuleCardProps {
  rule: RuleType;
  index?: number;
  cardBg?: string;
  isPlaying?: boolean;
  onPlayAudio?: (id: number, text: string) => void;
  accentColor?: string;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
  onOptionsPress?: () => void;
  searchQuery?: string;
}

export const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  index,
  cardBg,
  isPlaying,
  onPlayAudio,
  accentColor = '#d97706',
  isSelected = false,
  isSelectionMode = false,
  onLongPress,
  onPress,
  onOptionsPress,
  searchQuery,
}) => {
  const router = useRouter();
  const [localPlaying, setLocalPlaying] = React.useState(false);
  const activePlaying = isPlaying !== undefined ? isPlaying : localPlaying;

  const handleSpeech = () => {
    if (onPlayAudio && rule.id) {
      onPlayAudio(rule.id, rule.content);
    } else {
      setLocalPlaying(true);
      speakEnglishText(
        rule.content,
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
      router.push(`/pages/ruleDetails/${rule.id}` as any);
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
        ) : (
          <View style={[styles.ruleBadge, cardBg ? styles.whiteBadgeBg : { backgroundColor: accentColor + '20' }]}>
            <Text style={[styles.ruleBadgeText, cardBg ? styles.whiteText : { color: accentColor }]}>
              Rule #{rule.id || (index !== undefined ? index + 1 : 1)}
            </Text>
          </View>
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

      <HighlightedText
        text={rule.content}
        searchQuery={searchQuery}
        style={[styles.ruleText, cardBg && styles.whiteText]}
        isCardBg={!!cardBg}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    marginVertical: 0,
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
  },
  ruleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  whiteBadgeBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  ruleBadgeText: {
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
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whitePlayBtnBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  playingBtnActive: {
    backgroundColor: '#d97706',
  },
  ruleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  whiteText: {
    color: '#ffffff',
  },
});

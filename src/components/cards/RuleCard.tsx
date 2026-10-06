import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { RuleType } from '@/types';
import { speakEnglishText } from '@/utils/tts';

interface RuleCardProps {
  rule: RuleType;
  index?: number;
  cardBg?: string;
  isPlaying?: boolean;
  onPlayAudio?: (id: number, text: string) => void;
  accentColor?: string;
}

export const RuleCard: React.FC<RuleCardProps> = ({
  rule,
  index,
  cardBg,
  isPlaying,
  onPlayAudio,
  accentColor = '#d97706',
}) => {
  const router = useRouter();

  const handleSpeech = (e: any) => {
    e.stopPropagation();
    if (onPlayAudio && rule.id) {
      onPlayAudio(rule.id, rule.content);
    } else {
      speakEnglishText(rule.content);
    }
  };

  const handlePressCard = () => {
    router.push(`/pages/ruleDetails/${rule.id}` as any);
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
        <View style={[styles.ruleBadge, cardBg ? styles.whiteBadgeBg : { backgroundColor: accentColor + '20' }]}>
          <Text style={[styles.ruleBadgeText, cardBg ? styles.whiteText : { color: accentColor }]}>
            Rule #{rule.id || (index !== undefined ? index + 1 : 1)}
          </Text>
        </View>

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

      <Text style={[styles.ruleText, cardBg && styles.whiteText]}>
        {rule.content}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    marginVertical: 4,
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

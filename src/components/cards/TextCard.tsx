import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { TextType } from '@/types';
import { handleLongText, speakChineseText } from '@/utils/tts';

interface TextCardProps {
  textObj: TextType;
  index?: number;
  showPinyin?: boolean;
  showMeaning?: boolean;
  cardBg?: string;
  isPlaying?: boolean;
  onPlayAudio?: (id: number, text: string) => void;
  accentColor?: string;
}

export const TextCard: React.FC<TextCardProps> = ({
  textObj,
  index,
  showPinyin = true,
  showMeaning = true,
  cardBg,
  isPlaying,
  onPlayAudio,
  accentColor = '#0284c7',
}) => {
  const router = useRouter();

  const handleSpeech = (e: any) => {
    e.stopPropagation();
    if (onPlayAudio && textObj.id) {
      onPlayAudio(textObj.id, textObj.content);
    } else {
      speakChineseText(textObj.content);
    }
  };

  const handlePressCard = () => {
    router.push(`/pages/textDetails/${textObj.id}` as any);
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
        <View style={styles.titleGroup}>
          {index !== undefined && (
            <View style={[styles.indexBadge, cardBg ? styles.whiteBadgeBg : { backgroundColor: accentColor + '20' }]}>
              <Text style={[styles.indexBadgeText, cardBg ? styles.whiteText : { color: accentColor }]}>
                Text #{index + 1}
              </Text>
            </View>
          )}
          <Text style={[styles.title, cardBg && styles.whiteText]} numberOfLines={1}>
            {textObj.title}
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
            size={16}
            color={isPlaying ? '#ffffff' : cardBg ? '#ffffff' : accentColor}
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.content, cardBg && styles.whiteText]} numberOfLines={3}>
        {handleLongText(textObj.content, 15)}
      </Text>

      {showPinyin && textObj.pinyin ? (
        <Text style={[styles.pinyin, cardBg ? styles.whiteSubtext : styles.darkSubtext]} numberOfLines={2}>
          {handleLongText(textObj.pinyin, 40)}
        </Text>
      ) : null}

      {showMeaning && textObj.meaning ? (
        <Text style={[styles.meaning, cardBg ? styles.whiteSubtext : styles.darkMeaning]} numberOfLines={2}>
          {handleLongText(textObj.meaning, 40)}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginVertical: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
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
    gap: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
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
    backgroundColor: '#0284c7',
  },
  content: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 25,
  },
  pinyin: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  meaning: {
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
    color: '#0284c7',
  },
  darkMeaning: {
    color: '#475569',
  },
});

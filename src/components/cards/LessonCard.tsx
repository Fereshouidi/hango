import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { LessonType } from '@/types';
import { getHSKById } from '@/db/utils';
import { speakChineseText } from '@/utils/tts';

interface LessonCardProps {
  lesson: LessonType;
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
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  index,
  cardBg,
  isPlaying,
  onPlayAudio,
  accentColor = '#2563eb',
  isSelected = false,
  isSelectionMode = false,
  onLongPress,
  onPress,
  onOptionsPress,
}) => {
  const router = useRouter();
  const [localPlaying, setLocalPlaying] = React.useState(false);
  const activePlaying = isPlaying !== undefined ? isPlaying : localPlaying;

  const hskName = React.useMemo(() => {
    if (!lesson.hskId) return null;
    try {
      const hsk = getHSKById(lesson.hskId);
      return hsk?.name || `HSK ${lesson.hskId}`;
    } catch {
      return `HSK ${lesson.hskId}`;
    }
  }, [lesson.hskId]);

  const handleSpeech = () => {
    if (onPlayAudio && lesson.id) {
      onPlayAudio(lesson.id, lesson.title);
    } else {
      setLocalPlaying(true);
      speakChineseText(
        lesson.title,
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
      router.push({
        pathname: '/pages/lessonDetails/[id]',
        params: { lessonId: lesson.id, id: lesson.id },
      } as any);
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
      {/* Header Row */}
      <View style={styles.header}>
        {isSelectionMode ? (
          <View
            style={[
              styles.selectBadge,
              isSelected
                ? { backgroundColor: '#0f172a' }
                : { borderColor: '#ffffff', borderWidth: 1.5, backgroundColor: 'rgba(0,0,0,0.2)' },
            ]}
          >
            {isSelected && <Lucide name="check" size={12} color="#ffffff" />}
          </View>
        ) : (
          <View
            style={[
              styles.lessonBadge,
              cardBg ? styles.whiteBadgeBg : { backgroundColor: accentColor + '20' },
            ]}
          >
            <Lucide
              name="book-open"
              size={12}
              color={cardBg ? '#ffffff' : accentColor}
            />
            <Text
              style={[
                styles.lessonBadgeText,
                cardBg ? styles.whiteText : { color: accentColor },
              ]}
            >
              Lesson #{lesson.num}
            </Text>
          </View>
        )}

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              cardBg ? styles.whiteBtnBg : { backgroundColor: accentColor + '20' },
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
              styles.actionBtn,
              cardBg ? styles.whiteBtnBg : { backgroundColor: accentColor + '20' },
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

      {/* Main Lesson Title */}
      <Text
        style={[styles.chineseText, cardBg && styles.whiteText]}
        numberOfLines={2}
      >
        {lesson.title}
      </Text>

      {/* Footer Details / Tags */}
      <View style={styles.footerRow}>
        {hskName && (
          <View
            style={[
              styles.tagPill,
              cardBg ? styles.whiteTagBg : { backgroundColor: accentColor + '15' },
            ]}
          >
            <Lucide
              name="layers"
              size={11}
              color={cardBg ? '#ffffff' : accentColor}
            />
            <Text
              style={[
                styles.tagText,
                cardBg ? styles.whiteText : { color: accentColor },
              ]}
            >
              {hskName}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.tagPill,
            cardBg ? styles.whiteTagBg : { backgroundColor: '#f1f5f9' },
          ]}
        >
          <Lucide
            name="sparkles"
            size={11}
            color={cardBg ? '#ffffff' : '#64748b'}
          />
          <Text
            style={[
              styles.tagText,
              cardBg ? styles.whiteText : { color: '#64748b' },
            ]}
          >
            Unit #{lesson.num}
          </Text>
        </View>
      </View>
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  whiteBadgeBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  lessonBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteBtnBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  playingBtnActive: {
    backgroundColor: '#2563eb',
  },
  chineseText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  whiteTagBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
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
});

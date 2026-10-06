import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { CharacterType } from '@/types';

type CharacterCardProps = {
  character: CharacterType;
  selected: boolean;
  onToggle: () => void;
  assignedLessonName?: string;
};

const toneColors: Record<string, string> = {
  '1': '#ef4444',
  '2': '#f59e0b',
  '3': '#10b981',
  '4': '#3b82f6',
  '5': '#6b7280',
};

export const CharacterCard = ({
  character,
  selected,
  onToggle,
  assignedLessonName,
}: CharacterCardProps) => {
  if (!character) return null;
  const toneColor = toneColors[character.tone || '5'] || '#8b5cf6';

  return (
    <TouchableOpacity
      style={[styles.charCard, selected && styles.charCardSelected]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.cardTopRow}>
        {character.tone ? (
          <View style={[styles.toneBadge, { backgroundColor: toneColor + '20' }]}>
            <Text style={[styles.toneBadgeText, { color: toneColor }]}>
              T{character.tone}
            </Text>
          </View>
        ) : (
          <View />
        )}

        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Lucide name="check" size={11} color="#ffffff" />}
        </View>
      </View>

      <Text style={styles.charMainText}>{character.content}</Text>
      <Text style={styles.charPinyinText} numberOfLines={1}>
        {character.pinyin}
      </Text>
      <Text style={styles.charMeaningText} numberOfLines={1}>
        {character.meaning}
      </Text>

      {assignedLessonName ? (
        <View style={styles.assignedPill}>
          <Text style={styles.assignedPillText} numberOfLines={1}>
            {assignedLessonName}
          </Text>
        </View>
      ) : (
        <View style={styles.availablePill}>
          <Text style={styles.availablePillText}>Available</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  charCard: {
    width: 120,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  charCardSelected: {
    borderColor: '#ec489a',
    backgroundColor: '#fdf2f8',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  toneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  toneBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#ec489a',
    borderColor: '#ec489a',
  },
  charMainText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    marginVertical: 2,
  },
  charPinyinText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ec489a',
  },
  charMeaningText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  assignedPill: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: '90%',
  },
  assignedPillText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  availablePill: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  availablePillText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '600',
  },
});

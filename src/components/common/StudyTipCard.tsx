import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

interface StudyTipCardProps {
  variant?: 'linking' | 'optional' | 'easy' | 'custom';
  title?: string;
  description?: string;
  style?: ViewStyle;
}

export const StudyTipCard: React.FC<StudyTipCardProps> = ({
  variant = 'linking',
  title,
  description,
  style,
}) => {
  let defaultTitle = 'Focus on What is New';
  let defaultText =
    "You don't need to link every single word or character! Just link the key vocabulary or new items you're learning.";
  let iconName = 'sparkles';
  let accentColor = '#8b5cf6';
  let bgColor = '#fbf8ff';
  let borderColor = '#ede4ff';

  if (variant === 'optional') {
    defaultTitle = 'Quick & Easy: Most Fields are Optional';
    defaultText =
      'Only Chinese content is required! Pinyin, meaning, and links to lessons, texts, or sentences are 100% optional.';
    iconName = 'check-circle-2';
    accentColor = '#059669';
    bgColor = '#f0fdf4';
    borderColor = '#bbf7d0';
  } else if (variant === 'linking') {
    defaultTitle = 'No Need to Link Everything!';
    defaultText =
      "Only link the new or important words, characters, or rules you're actively learning. You don't have to break down every single item!";
    iconName = 'lightbulb';
    accentColor = '#d97706';
    bgColor = '#fffbeb';
    borderColor = '#fde68a';
  } else if (variant === 'easy') {
    defaultTitle = 'Keep It Simple';
    defaultText =
      'Add as little or as much as you like. You can always come back and link more whenever you want.';
    iconName = 'smile';
    accentColor = '#0284c7';
    bgColor = '#f0f9ff';
    borderColor = '#bae6fd';
  }

  const finalTitle = title || defaultTitle;
  const finalText = description || defaultText;

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }, style]}>
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
        <Lucide name={iconName as any} size={15} color={accentColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: accentColor }]}>{finalTitle}</Text>
        <Text style={styles.description}>{finalText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
    gap: 10,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#475569',
    fontWeight: '500',
  },
});

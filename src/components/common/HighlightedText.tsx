import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

export interface HighlightedTextProps {
  text?: string | null;
  highlight?: string;
  searchQuery?: string;
  style?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
  isCardBg?: boolean;
  numberOfLines?: number;
}

export const HighlightedText: React.FC<HighlightedTextProps> = React.memo(({
  text,
  highlight,
  searchQuery,
  style,
  highlightStyle,
  isCardBg = false,
  numberOfLines,
}) => {
  if (text === undefined || text === null || text === '') {
    return null;
  }

  const query = (searchQuery ?? highlight)?.trim();
  if (!query) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  // Escape special regex characters
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let regex: RegExp;
  try {
    regex = new RegExp(`(${escapedQuery})`, 'gi');
  } catch {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const parts = text.split(regex);
  if (parts.length <= 1) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const matchLower = query.toLowerCase();

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === matchLower;
        if (isMatch) {
          return (
            <Text
              key={index}
              style={[
                styles.baseHighlight,
                isCardBg ? styles.cardBgHighlight : styles.normalHighlight,
                highlightStyle,
              ]}
            >
              {part}
            </Text>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </Text>
  );
});

const styles = StyleSheet.create({
  baseHighlight: {
    fontWeight: '700',
    borderRadius: 4,
    overflow: 'hidden',
  },
  normalHighlight: {
    backgroundColor: '#fef08a', // vibrant warm yellow
    color: '#854d0e', // high contrast dark amber
  },
  cardBgHighlight: {
    backgroundColor: '#ffffff', // crisp white pill on colored card
    color: '#0f172a', // dark navy text
  },
});

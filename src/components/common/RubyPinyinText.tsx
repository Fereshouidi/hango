import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RubyPinyinTextProps {
  chineseText: string;
  pinyinText: string;
  pinyinPosition?: 'above' | 'under';
}

/** Splits pinyin string into per-syllable tokens (space-delimited). */
function tokenizePinyin(pinyin: string): string[] {
  return pinyin.trim().split(/\s+/).filter(Boolean);
}

/** Splits Chinese text into individual character tokens. */
function tokenizeChinese(text: string): string[] {
  return [...text];
}

/** Pair each CJK character with a pinyin syllable; punctuation gets no label. */
function pairTokens(
  chineseChars: string[],
  pinyinSyllables: string[]
): { char: string; pinyin: string }[] {
  const pairs: { char: string; pinyin: string }[] = [];
  let pinyinIdx = 0;

  for (const char of chineseChars) {
    const isCJK = /[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef\u3000-\u303f]/.test(char);
    if (isCJK) {
      pairs.push({ char, pinyin: pinyinSyllables[pinyinIdx] || '' });
      pinyinIdx += 1;
    } else if (char === '\n') {
      pairs.push({ char: '\n', pinyin: '' });
    } else {
      pairs.push({ char, pinyin: '' });
    }
  }
  return pairs;
}

export const RubyPinyinText: React.FC<RubyPinyinTextProps> = ({
  chineseText,
  pinyinText,
  pinyinPosition = 'under',
}) => {
  const rows: { char: string; pinyin: string }[][] = useMemo(() => {
    const chars = tokenizeChinese(chineseText);
    const syllables = tokenizePinyin(pinyinText);
    const pairs = pairTokens(chars, syllables);

    const result: { char: string; pinyin: string }[][] = [];
    let current: { char: string; pinyin: string }[] = [];
    for (const pair of pairs) {
      if (pair.char === '\n') {
        result.push(current);
        current = [];
      } else {
        current.push(pair);
      }
    }
    if (current.length > 0) result.push(current);
    return result;
  }, [chineseText, pinyinText]);

  return (
    <View style={styles.container}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((pair, idx) => (
            <View key={idx} style={styles.charBlock}>
              {pinyinPosition === 'above' && (
                pair.pinyin ? (
                  <Text style={styles.pinyinLabel} numberOfLines={1}>
                    {pair.pinyin}
                  </Text>
                ) : (
                  <Text style={styles.pinyinPlaceholder}>{' '}</Text>
                )
              )}
              <Text style={styles.chineseChar}>{pair.char}</Text>
              {pinyinPosition === 'under' && (
                pair.pinyin ? (
                  <Text style={styles.pinyinLabel} numberOfLines={1}>
                    {pair.pinyin}
                  </Text>
                ) : (
                  <Text style={styles.pinyinPlaceholder}>{' '}</Text>
                )
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  charBlock: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 1,
    marginVertical: 4,
  },
  pinyinLabel: {
    fontSize: 10,
    color: '#0284c7',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },
  pinyinPlaceholder: {
    fontSize: 10,
    lineHeight: 13,
    color: 'transparent',
  },
  chineseChar: {
    fontSize: 19,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 24,
    textAlign: 'center',
  },
});

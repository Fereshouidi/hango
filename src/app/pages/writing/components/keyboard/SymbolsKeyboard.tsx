import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CharacterType } from '@/types';
import { NUMBER_KEYS, PUNCTUATION_KEYS, SCREEN_WIDTH } from '../../constants';

interface SymbolsKeyboardProps {
  mode: 'punct' | 'numbers';
  charLookupMap: Map<string, CharacterType>;
  hidePinyin: boolean;
  onInsertChar: (char: string) => void;
}

export const SymbolsKeyboard: React.FC<SymbolsKeyboardProps> = ({
  mode,
  charLookupMap,
  hidePinyin,
  onInsertChar,
}) => {
  if (mode === 'punct') {
    return (
      <View style={styles.grid}>
        {PUNCTUATION_KEYS.map((sym, i) => (
          <TouchableOpacity
            key={`punct-${i}`}
            style={styles.punctKey}
            onPress={() => onInsertChar(sym)}
            activeOpacity={0.65}
          >
            <Text style={styles.punctKeyText}>{sym}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {NUMBER_KEYS.map((num, i) => {
        const info = charLookupMap.get(num);
        return (
          <TouchableOpacity
            key={`num-${i}`}
            style={styles.numberKey}
            onPress={() => onInsertChar(num)}
            activeOpacity={0.65}
          >
            {!hidePinyin && (
              <Text style={styles.numberPinyinText}>
                {info?.pinyin || ''}
              </Text>
            )}
            <Text style={[styles.numberHanziText, hidePinyin && styles.numberHanziTextLarger]}>
              {num}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    height: 175,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    alignContent: 'flex-start',
    paddingVertical: 4,
  },
  punctKey: {
    width: (SCREEN_WIDTH - 72) / 6,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  punctKeyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  numberKey: {
    width: (SCREEN_WIDTH - 68) / 5,
    maxWidth: 68,
    height: 46,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  numberPinyinText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#8b5cf6',
    lineHeight: 10,
  },
  numberHanziText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22,
  },
  numberHanziTextLarger: {
    fontSize: 21,
    lineHeight: 24,
  },
});

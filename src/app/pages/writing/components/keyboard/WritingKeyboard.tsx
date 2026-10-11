import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CharacterType } from '@/types';
import { KeyboardTab } from '../../types';
import { HanziKeyboard } from './HanziKeyboard';
import { KeyboardBottomBar } from './KeyboardBottomBar';
import { KeyboardToolbar } from './KeyboardToolbar';
import { PinyinKeyboard } from './PinyinKeyboard';
import { SymbolsKeyboard } from './SymbolsKeyboard';

interface WritingKeyboardProps {
  displayedChars: CharacterType[];
  lookupChars: CharacterType[];
  charLookupMap: Map<string, CharacterType>;
  keyboardTotal: number;
  keyboardOffset: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  hidePinyin: boolean;
  onToggleHidePinyin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onInsertChar: (char: string) => void;
  onBackspace: () => void;
  onLongPressChar: (char: CharacterType) => void;
  isDictation?: boolean;
}

export const WritingKeyboard: React.FC<WritingKeyboardProps> = ({
  displayedChars,
  lookupChars,
  charLookupMap,
  keyboardTotal,
  keyboardOffset,
  hasMore,
  isLoadingMore,
  onLoadMore,
  hidePinyin,
  onToggleHidePinyin,
  searchQuery,
  onSearchChange,
  onInsertChar,
  onBackspace,
  onLongPressChar,
  isDictation = false,
}) => {
  const [activeTab, setActiveTab] = useState<KeyboardTab>('hanzi');

  return (
    <View style={styles.container}>
      {/* Top toolbar: Tab switch, hide/show pinyin toggle, search bar, character counts badge */}
      <KeyboardToolbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hidePinyin={hidePinyin}
        onToggleHidePinyin={onToggleHidePinyin}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        keyboardTotal={keyboardTotal}
        loadedCount={displayedChars.length}
        isDictation={isDictation}
      />

      {/* Main Keys Area */}
      <View style={styles.keysArea}>
        {activeTab === 'hanzi' && (
          <HanziKeyboard
            displayedChars={displayedChars}
            hidePinyin={hidePinyin}
            keyboardTotal={keyboardTotal}
            keyboardOffset={keyboardOffset}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
            onInsertChar={onInsertChar}
            onLongPressChar={onLongPressChar}
            isDictation={isDictation}
          />
        )}

        {activeTab === 'pinyin' && (
          <PinyinKeyboard
            lookupChars={lookupChars}
            hidePinyin={hidePinyin}
            onInsertChar={onInsertChar}
            onBackspace={onBackspace}
          />
        )}

        {(activeTab === 'punct' || activeTab === 'numbers') && (
          <SymbolsKeyboard
            mode={activeTab}
            charLookupMap={charLookupMap}
            hidePinyin={hidePinyin}
            onInsertChar={onInsertChar}
          />
        )}
      </View>

      {/* Bottom utility keys: Comma, Period, Space, Return, Backspace */}
      <KeyboardBottomBar
        onInsertChar={onInsertChar}
        onBackspace={onBackspace}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  keysArea: {
    minHeight: 180,
    justifyContent: 'center',
  },
});

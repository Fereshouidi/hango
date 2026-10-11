import React from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { CharacterType } from '@/types';
import { SCREEN_WIDTH, TONE_COLORS } from '../../constants';

interface HanziKeyboardProps {
  displayedChars: CharacterType[];
  hidePinyin: boolean;
  keyboardTotal: number;
  keyboardOffset: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onInsertChar: (char: string) => void;
  onLongPressChar: (char: CharacterType) => void;
  isDictation?: boolean;
}

export const HanziKeyboard: React.FC<HanziKeyboardProps> = ({
  displayedChars,
  hidePinyin,
  keyboardTotal,
  keyboardOffset,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onInsertChar,
  onLongPressChar,
  isDictation = false,
}) => {
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 30;
    if (
      hasMore &&
      !isLoadingMore &&
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
    ) {
      onLoadMore();
    }
  };

  const renderCharKey = (c: CharacterType) => {
    const toneColor = TONE_COLORS[c.tone || '5'] || '#8b5cf6';

    return (
      <TouchableOpacity
        key={`key-${c.id}`}
        style={styles.key}
        onPress={() => onInsertChar(c.content)}
        onLongPress={() => onLongPressChar(c)}
        activeOpacity={0.65}
      >
        {!hidePinyin && (
          <View style={styles.topRow}>
            <Text
              style={[styles.pinyinText, { color: toneColor }]}
              numberOfLines={1}
            >
              {c.pinyin}
            </Text>
            <View style={[styles.toneDot, { backgroundColor: toneColor }]} />
          </View>
        )}
        <Text style={[styles.hanziText, hidePinyin && styles.hanziTextLarger]}>
          {c.content}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.gridContent}
      onScroll={handleScroll}
      scrollEventThrottle={32}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
    >
      {displayedChars.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Lucide name="search-x" size={24} color="#cbd5e1" />
          <Text style={styles.emptyText}>No characters found</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {displayedChars.map(renderCharKey)}
        </View>
      )}

      {hasMore && (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={onLoadMore}
          disabled={isLoadingMore}
          activeOpacity={0.7}
        >
          {isLoadingMore ? (
            <ActivityIndicator size="small" color="#8b5cf6" />
          ) : (
            <>
              <Lucide name="chevrons-down" size={13} color="#8b5cf6" />
              <Text style={styles.loadMoreText}>
                Load next 10 ({Math.max(0, keyboardTotal - keyboardOffset)} remaining of {keyboardTotal})
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {!hasMore && !isDictation && keyboardTotal > 0 && (
        <View style={styles.allLoadedRow}>
          <Lucide name="check-circle-2" size={12} color="#10b981" />
          <Text style={styles.allLoadedText}>
            All {keyboardTotal} characters loaded
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    height: 175,
  },
  gridContent: {
    paddingBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 5,
  },
  key: {
    width: (SCREEN_WIDTH - 68) / 5,
    maxWidth: 68,
    height: 48,
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
    marginBottom: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pinyinText: {
    fontSize: 8.5,
    fontWeight: '600',
    lineHeight: 10,
  },
  toneDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  hanziText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 23,
  },
  hanziTextLarger: {
    fontSize: 22,
    lineHeight: 26,
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
    marginTop: 2,
    marginHorizontal: 10,
    marginBottom: 6,
  },
  loadMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  allLoadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
  },
  allLoadedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
});

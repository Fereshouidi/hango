import React, { useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { CharacterType } from '@/types';
import { TONE_COLORS } from '../constants';
import { WritingMode } from '../types';
import { CharDetailModal } from './CharDetailModal';

interface CompositionBoardProps {
  mode: WritingMode;
  text: string;
  history: string[];
  showPinyinRuby: boolean;
  onTogglePinyinRuby: () => void;
  soundOnType: boolean;
  onToggleSoundOnType: () => void;
  onUndo: () => void;
  onClearAll: () => void;
  charLookupMap: Map<string, CharacterType>;
  selectedCharDetail: CharacterType | null;
  onSelectCharDetail: (char: CharacterType | null) => void;
}

export const CompositionBoard: React.FC<CompositionBoardProps> = ({
  mode,
  text,
  history,
  showPinyinRuby,
  onTogglePinyinRuby,
  soundOnType,
  onToggleSoundOnType,
  onUndo,
  onClearAll,
  charLookupMap,
  selectedCharDetail,
  onSelectCharDetail,
}) => {
  const hanziCount = useMemo(
    () => Array.from(text).filter((ch) => /[\u4e00-\u9fa5]/.test(ch)).length,
    [text]
  );

  const handleClearWithConfirm = () => {
    if (!text) return;
    Alert.alert('Clear text', 'Are you sure you want to clear everything you wrote?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: onClearAll },
    ]);
  };

  return (
    <View style={styles.card}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.modeBadge,
              mode === 'dictation' && { backgroundColor: '#fef3c7' },
            ]}
          >
            <Lucide
              name={mode === 'dictation' ? 'mic' : 'edit-3'}
              size={12}
              color={mode === 'dictation' ? '#d97706' : '#8b5cf6'}
            />
            <Text
              style={[
                styles.modeBadgeText,
                mode === 'dictation' && { color: '#d97706' },
              ]}
            >
              {mode === 'dictation' ? 'Dictation' : 'Writing'}
            </Text>
          </View>
          <Text style={styles.charCountText}>
            {hanziCount} {hanziCount === 1 ? 'char' : 'chars'}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.toolBtn, showPinyinRuby && styles.toolBtnActive]}
            onPress={onTogglePinyinRuby}
            activeOpacity={0.7}
          >
            <Lucide
              name="languages"
              size={12}
              color={showPinyinRuby ? '#8b5cf6' : '#64748b'}
            />
            <Text
              style={[
                styles.toolBtnText,
                showPinyinRuby && { color: '#8b5cf6', fontWeight: '700' },
              ]}
            >
              拼音
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, soundOnType && styles.toolBtnActive]}
            onPress={onToggleSoundOnType}
            activeOpacity={0.7}
          >
            <Lucide
              name={soundOnType ? 'volume-2' : 'volume-x'}
              size={12}
              color={soundOnType ? '#10b981' : '#64748b'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, history.length === 0 && styles.toolBtnDisabled]}
            disabled={history.length === 0}
            onPress={onUndo}
            activeOpacity={0.7}
          >
            <Lucide
              name="undo-2"
              size={12}
              color={history.length === 0 ? '#cbd5e1' : '#64748b'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, !text && styles.toolBtnDisabled]}
            disabled={!text}
            onPress={handleClearWithConfirm}
            activeOpacity={0.7}
          >
            <Lucide name="trash-2" size={12} color={!text ? '#cbd5e1' : '#ef4444'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Text display canvas */}
      <ScrollView
        style={styles.textDisplayScroll}
        contentContainerStyle={styles.textDisplayContent}
        nestedScrollEnabled={true}
      >
        {text.length === 0 ? (
          <View style={styles.emptyPlaceholder}>
            <Lucide name="sparkles" size={20} color="#c084fc" />
            <Text style={styles.emptyTitle}>
              {mode === 'dictation'
                ? 'Type what you hear / read'
                : 'Your Chinese writing appears here'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {mode === 'dictation'
                ? 'Use the keyboard below to type Chinese.'
                : 'Tap characters or type pinyin below.'}
            </Text>
          </View>
        ) : (
          <View style={styles.rubyContainer}>
            {Array.from(text).map((ch, idx) => {
              const info = charLookupMap.get(ch);
              const isHanzi = /[\u4e00-\u9fa5]/.test(ch);
              const toneColor = info ? TONE_COLORS[info.tone || '5'] || '#8b5cf6' : '#64748b';

              if (ch === '\n') {
                return <View key={`br-${idx}`} style={styles.lineBreak} />;
              }
              if (ch === ' ') {
                return <View key={`sp-${idx}`} style={styles.spaceChar} />;
              }

              return (
                <TouchableOpacity
                  key={`char-${idx}`}
                  style={styles.rubyBlock}
                  onPress={() => info && onSelectCharDetail(info)}
                  activeOpacity={0.7}
                >
                  {showPinyinRuby && (
                    <Text
                      style={[styles.rubyPinyinText, isHanzi && { color: toneColor }]}
                      numberOfLines={1}
                    >
                      {info?.pinyin || ' '}
                    </Text>
                  )}
                  <Text style={styles.rubyHanziText}>{ch}</Text>
                </TouchableOpacity>
              );
            })}
            <View style={styles.blinkingCursor} />
          </View>
        )}
      </ScrollView>

      {/* Character detail pill */}
      <CharDetailModal
        charDetail={selectedCharDetail}
        onClose={() => onSelectCharDetail(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffffdf',
    borderRadius: 18,
    padding: 11,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  charCountText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toolBtnActive: {
    backgroundColor: '#f3e8ff',
    borderColor: '#d8b4fe',
  },
  toolBtnDisabled: {
    opacity: 0.4,
  },
  toolBtnText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  textDisplayScroll: {
    maxHeight: 140,
    minHeight: 70,
  },
  textDisplayContent: {
    paddingVertical: 4,
  },
  emptyPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 240,
  },
  rubyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  rubyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1.5,
    marginVertical: 1,
  },
  rubyPinyinText: {
    fontSize: 9.5,
    fontWeight: '600',
    lineHeight: 12,
  },
  rubyHanziText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 28,
  },
  lineBreak: {
    width: '100%',
    height: 4,
  },
  spaceChar: {
    width: 10,
    height: 22,
  },
  blinkingCursor: {
    width: 2.5,
    height: 22,
    backgroundColor: '#8b5cf6',
    marginLeft: 2,
    borderRadius: 1,
    alignSelf: 'center',
  },
});

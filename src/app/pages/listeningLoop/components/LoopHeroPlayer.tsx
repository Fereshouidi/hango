import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { WordType } from '@/types';
import { speakChineseText } from '@/utils/tts';
import { LoopInterval, LoopItem, LoopMode, LoopRepeatCount, LoopSpeed } from '../types';

interface LoopHeroPlayerProps {
  currentItem: LoopItem | null;
  currentIndex: number;
  totalItems: number;
  batchOffset?: number;
  totalAvailable?: number;
  currentBatch?: number;
  totalBatches?: number;
  isPlaying: boolean;
  isSpeaking: boolean;
  isWaitingInterval: boolean;
  intervalCountdown: number;
  repeatCounter: number;
  repeatCount: LoopRepeatCount;
  loopMode: LoopMode;
  speed: LoopSpeed;
  interval: LoopInterval;
  showPinyin: boolean;
  showMeaning: boolean;
  activeWords?: WordType[];
  showWords?: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleLoopMode: () => void;
  onTogglePinyin: () => void;
  onToggleMeaning: () => void;
  onToggleWords?: () => void;
  onOpenSettings: () => void;
}

export const LoopHeroPlayer: React.FC<LoopHeroPlayerProps> = ({
  currentItem,
  currentIndex,
  totalItems,
  batchOffset = 0,
  totalAvailable,
  currentBatch = 0,
  totalBatches = 1,
  isPlaying,
  isSpeaking,
  isWaitingInterval,
  intervalCountdown,
  repeatCounter,
  repeatCount,
  loopMode,
  speed,
  interval,
  showPinyin,
  showMeaning,
  activeWords = [],
  showWords = true,
  onTogglePlayPause,
  onNext,
  onPrev,
  onToggleLoopMode,
  onTogglePinyin,
  onToggleMeaning,
  onToggleWords,
  onOpenSettings,
}) => {
  const [playingWordId, setPlayingWordId] = React.useState<number | null>(null);

  const handlePlayWord = (word: WordType) => {
    if (!word.content) return;
    setPlayingWordId(word.id);
    speakChineseText(
      word.content,
      () => setPlayingWordId(word.id),
      () => setPlayingWordId(null)
    );
  };

  // Arrange words in order of their occurrence (index) in the sentence/item content
  const sortedWords = React.useMemo(() => {
    if (!currentItem?.content || !activeWords || activeWords.length <= 1) {
      return activeWords;
    }
    const sentenceText = currentItem.content;
    return [...activeWords].sort((a, b) => {
      const textA = a.content || '';
      const textB = b.content || '';
      const idxA = textA ? sentenceText.indexOf(textA) : -1;
      const idxB = textB ? sentenceText.indexOf(textB) : -1;
      const posA = idxA === -1 ? Number.MAX_SAFE_INTEGER : idxA;
      const posB = idxB === -1 ? Number.MAX_SAFE_INTEGER : idxB;

      if (posA !== posB) {
        return posA - posB;
      }
      return (textB.length || 0) - (textA.length || 0);
    });
  }, [activeWords, currentItem?.content]);
  if (!currentItem) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyContainer}>
          <Lucide name="headphones" size={32} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No sentences in loop queue</Text>
          <Text style={styles.emptySubtitle}>Select an HSK level or lesson below to start listening.</Text>
        </View>
      </View>
    );
  }

  const loopModeIcons: Record<LoopMode, any> = {
    'repeat-all': 'repeat',
    'repeat-one': 'repeat-1',
    shuffle: 'shuffle',
  };

  const loopModeLabels: Record<LoopMode, string> = {
    'repeat-all': 'Loop All',
    'repeat-one': 'Loop One',
    shuffle: 'Shuffle',
  };

  const repeatLabel =
    repeatCount === 0
      ? `Loop ${repeatCounter} (∞)`
      : `Repeat ${repeatCounter} / ${repeatCount}`;

  const currentDisplayIndex = batchOffset + currentIndex + 1;
  const totalDisplayCount = totalAvailable ?? totalItems;

  return (
    <View style={styles.card}>
      {/* Top Status & Controls Row */}
      <View style={styles.topStatusRow}>
        <View style={styles.statusMetaRow}>
          <View style={styles.badgeGroup}>
            {/* Content Type Pill */}
            <View
              style={[
                styles.typeBadge,
                currentItem.type === 'word' ? styles.typeBadgeWord : styles.typeBadgeSentence,
              ]}
            >
              <Lucide
                name={currentItem.type === 'word' ? 'languages' : 'message-square-text'}
                size={11}
                color={currentItem.type === 'word' ? '#059669' : '#7c3aed'}
              />
              <Text
                style={[
                  styles.typeBadgeText,
                  currentItem.type === 'word'
                    ? styles.typeBadgeTextWord
                    : styles.typeBadgeTextSentence,
                ]}
              >
                {currentItem.type === 'word' ? 'Word' : 'Sentence'}
              </Text>
            </View>

            {/* Index Counter */}
            <View style={styles.indexBadge}>
              <Text style={styles.indexBadgeText}>
                {currentDisplayIndex} / {totalDisplayCount}
              </Text>
            </View>

            {/* Batch Badge (if more than 1 batch) */}
            {totalBatches > 1 && (
              <View style={styles.batchBadge}>
                <Lucide name="layers" size={10} color="#7c3aed" />
                <Text style={styles.batchBadgeText}>
                  Batch {currentBatch + 1}/{totalBatches}
                </Text>
              </View>
            )}
          </View>

          {/* Repeat Counter */}
          <View style={styles.repeatBadge}>
            <Lucide name="rotate-ccw" size={11} color="#7c3aed" />
            <Text style={styles.repeatBadgeText}>{repeatLabel}</Text>
          </View>
        </View>

        {/* Quick Toggles */}
        <View style={styles.studyTogglesRow}>
          <View style={styles.studyTogglesLabel}>
            <Lucide name="eye" size={12} color="#64748b" />
            <Text style={styles.studyTogglesLabelText}>Display</Text>
          </View>

          <View style={styles.actionButtonGroup}>
            <TouchableOpacity
              style={[styles.smallToolBtn, showPinyin && styles.smallToolBtnActive]}
              onPress={onTogglePinyin}
              activeOpacity={0.7}
            >
              <Lucide
                name="mic"
                size={11}
                color={showPinyin ? '#7c3aed' : '#64748b'}
              />
              <Text style={[styles.smallToolBtnText, showPinyin && styles.smallToolBtnTextActive]}>
                Pinyin
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallToolBtn, showMeaning && styles.smallToolBtnActive]}
              onPress={onToggleMeaning}
              activeOpacity={0.7}
            >
              <Lucide
                name="book-open"
                size={11}
                color={showMeaning ? '#7c3aed' : '#64748b'}
              />
              <Text style={[styles.smallToolBtnText, showMeaning && styles.smallToolBtnTextActive]}>
                Meaning
              </Text>
            </TouchableOpacity>

            {onToggleWords && currentItem.type !== 'word' && (
              <TouchableOpacity
                style={[styles.smallToolBtn, showWords && styles.smallToolBtnWordsActive]}
                onPress={onToggleWords}
                activeOpacity={0.7}
              >
                <Lucide
                  name="languages"
                  size={11}
                  color={showWords ? '#059669' : '#64748b'}
                />
                <Text style={[styles.smallToolBtnText, showWords && styles.smallToolBtnWordsTextActive]}>
                  Words{sortedWords.length > 0 ? ` (${sortedWords.length})` : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Speaking / Shadowing Activity Bar */}
      <View style={styles.activityBar}>
        {isSpeaking ? (
          <View style={styles.speakingIndicator}>
            <Lucide name="volume-2" size={14} color="#10b981" />
            <Text style={styles.speakingText}>Playing audio ({speed}x)...</Text>
            <View style={styles.livePulseDot} />
          </View>
        ) : isWaitingInterval ? (
          <View style={styles.waitingIndicator}>
            <Lucide name="mic" size={14} color="#f59e0b" />
            <Text style={styles.waitingText}>
              Shadow now! Next loop in {intervalCountdown}s...
            </Text>
          </View>
        ) : (
          <View style={styles.idleIndicator}>
            <Lucide name="disc" size={13} color="#94a3b8" />
            <Text style={styles.idleText}>
              {isPlaying ? 'Buffering next...' : 'Paused'}
            </Text>
          </View>
        )}

        <View style={styles.metaPillsRow}>
          <Text style={styles.metaPillText}>{speed}x speed</Text>
          <Text style={styles.metaPillDot}>•</Text>
          <Text style={styles.metaPillText}>{interval}s pause</Text>
        </View>
      </View>

      {/* Main Content Box */}
      <View style={styles.contentBox}>
        {/* Pinyin */}
        {showPinyin && Boolean(currentItem.pinyin) && (
          <Text style={styles.pinyinText} numberOfLines={2}>
            {currentItem.pinyin}
          </Text>
        )}

        {/* Hanzi */}
        <Text style={styles.hanziText} selectable={true}>
          {currentItem.content}
        </Text>

        {/* English Meaning */}
        {showMeaning && Boolean(currentItem.meaning) && (
          <Text style={styles.meaningText} numberOfLines={3}>
            {currentItem.meaning}
          </Text>
        )}

        {currentItem.title && (
          <View style={styles.sourceTag}>
            <Lucide name="book-open" size={10} color="#64748b" />
            <Text style={styles.sourceTagText}>{currentItem.title}</Text>
          </View>
        )}

        {/* Words in this sentence */}
        {showWords && currentItem.type !== 'word' && sortedWords.length > 0 && (
          <View style={styles.sentenceWordsBox}>
            <View style={styles.sentenceWordsHeader}>
              <View style={styles.sentenceWordsTitleRow}>
                <Lucide name="languages" size={12} color="#059669" />
                <Text style={styles.sentenceWordsTitle}>
                  Words in sentence ({sortedWords.length})
                </Text>
              </View>
              <Text style={styles.sentenceWordsHint}>Tap to listen</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.wordsScrollRow}
            >
              {sortedWords.map((w) => (
                <TouchableOpacity
                  key={`w-${w.id}`}
                  style={[
                    styles.wordCardChip,
                    playingWordId === w.id && styles.wordCardChipPlaying,
                  ]}
                  onPress={() => handlePlayWord(w)}
                  activeOpacity={0.75}
                >
                  <View style={styles.wordChipHeader}>
                    <Text style={styles.wordChipHanzi}>{w.content}</Text>
                    <Lucide
                      name={playingWordId === w.id ? 'volume-2' : 'volume-1'}
                      size={12}
                      color={playingWordId === w.id ? '#059669' : '#64748b'}
                    />
                  </View>
                  {showPinyin && Boolean(w.pinyin) && (
                    <Text style={styles.wordChipPinyin} numberOfLines={1}>
                      {w.pinyin}
                    </Text>
                  )}
                  {showMeaning && Boolean(w.meaning) && (
                    <Text style={styles.wordChipMeaning} numberOfLines={1}>
                      {w.meaning}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Transport Controls Bar */}
      <View style={styles.transportRow}>
        {/* Loop Mode Switcher */}
        <TouchableOpacity
          style={styles.modePillBtn}
          onPress={onToggleLoopMode}
          activeOpacity={0.7}
        >
          <Lucide name={loopModeIcons[loopMode]} size={14} color="#8b5cf6" />
          <Text style={styles.modePillText}>{loopModeLabels[loopMode]}</Text>
        </TouchableOpacity>

        {/* Prev, Play/Pause, Next */}
        <View style={styles.playbackControls}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={onPrev}
            activeOpacity={0.7}
          >
            <Lucide name="skip-back" size={18} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playBtn, isPlaying && styles.playBtnActive]}
            onPress={onTogglePlayPause}
            activeOpacity={0.8}
          >
            <Lucide
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={onNext}
            activeOpacity={0.7}
          >
            <Lucide name="skip-forward" size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Settings button pill */}
        <TouchableOpacity
          style={styles.settingsPillBtn}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Lucide name="sliders" size={13} color="#475569" />
          <Text style={styles.settingsPillText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffffd5',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 240,
  },
  topStatusRow: {
    width: '100%',
    gap: 10,
  },
  statusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  indexBadge: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  indexBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  batchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  batchBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  repeatBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  studyTogglesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  studyTogglesLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  studyTogglesLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  smallToolBtnActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#c4b5fd',
  },
  smallToolBtnWordsActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  smallToolBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  smallToolBtnTextActive: {
    color: '#7c3aed',
    fontWeight: '700',
  },
  smallToolBtnWordsTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  settingsBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#f3e8ff',
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speakingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waitingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#d97706',
  },
  idleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  idleText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  metaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaPillText: {
    fontSize: 10.5,
    color: '#7c3aed',
    fontWeight: '600',
  },
  metaPillDot: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  contentBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    gap: 6,
  },
  pinyinText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
    textAlign: 'center',
  },
  hanziText: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 32,
  },
  meaningText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sourceTagText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  modePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  playBtnActive: {
    backgroundColor: '#7c3aed',
  },
  settingsPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  settingsPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  typeBadgeSentence: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  typeBadgeWord: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  typeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  typeBadgeTextSentence: {
    color: '#7c3aed',
  },
  typeBadgeTextWord: {
    color: '#059669',
  },
  sentenceWordsBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
    width: '100%',
  },
  sentenceWordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sentenceWordsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sentenceWordsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  sentenceWordsHint: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  wordsScrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  wordCardChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 74,
    maxWidth: 140,
    gap: 2,
  },
  wordCardChipPlaying: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  wordChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  wordChipHanzi: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  wordChipPinyin: {
    fontSize: 11,
    color: '#7c3aed',
    fontWeight: '600',
  },
  wordChipMeaning: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
});

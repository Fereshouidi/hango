import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Lucide from '@react-native-vector-icons/lucide';
import { LoopItem } from '../types';
import { Bg1 } from '@/components/sub/bg1';

// ────────────────────────────────────────────────────
// Ruby Pinyin helpers (same logic as RubyPinyinText)
// ────────────────────────────────────────────────────
function tokenizePinyin(pinyin: string): string[] {
  return pinyin.trim().split(/\s+/).filter(Boolean);
}

function pairTokens(text: string, pinyinSyllables: string[]) {
  const chars = [...text];
  const pairs: { char: string; pinyin: string; charIndex: number }[] = [];
  let pIdx = 0;
  let runningIndex = 0;
  for (const char of chars) {
    const isCJK = /[\u4e00-\u9fff\u3400-\u4dbf\uff00-\uffef\u3000-\u303f]/.test(char);
    if (isCJK) {
      pairs.push({ char, pinyin: pinyinSyllables[pIdx++] || '', charIndex: runningIndex });
    } else {
      pairs.push({ char, pinyin: '', charIndex: runningIndex });
    }
    runningIndex += char.length;
  }
  return pairs;
}

type PairRow = { char: string; pinyin: string; charIndex: number }[];

function buildRows(text: string, pinyin: string): PairRow[] {
  const syllables = tokenizePinyin(pinyin);
  const pairs = pairTokens(text, syllables);
  const rows: PairRow[] = [];
  let current: PairRow = [];
  for (const p of pairs) {
    if (p.char === '\n') {
      rows.push(current);
      current = [];
    } else {
      current.push(p);
    }
  }
  if (current.length) rows.push(current);
  return rows;
}

// ────────────────────────────────────────────────────
// Highlight words in plain text view
// ────────────────────────────────────────────────────
function buildHighlightedSegments(
  text: string,
  activeWord: string | null,
  spokenCharIndex: number | undefined
): { text: string; highlight: boolean }[] {
  // When we have both activeWord and spokenCharIndex, find the specific
  // occurrence that contains spokenCharIndex — not every occurrence.
  if (activeWord && text.includes(activeWord)) {
    const wordLen = activeWord.length;

    // If spokenCharIndex is available, locate the occurrence whose range covers it
    if (typeof spokenCharIndex === 'number' && spokenCharIndex >= 0) {
      let searchFrom = 0;
      let matchStart = -1;
      while (searchFrom <= text.length - wordLen) {
        const idx = text.indexOf(activeWord, searchFrom);
        if (idx === -1) break;
        // Check if the spoken index falls within this word occurrence
        if (spokenCharIndex >= idx && spokenCharIndex < idx + wordLen) {
          matchStart = idx;
          break;
        }
        searchFrom = idx + 1;
      }

      if (matchStart !== -1) {
        const segments: { text: string; highlight: boolean }[] = [];
        if (matchStart > 0) segments.push({ text: text.slice(0, matchStart), highlight: false });
        segments.push({ text: activeWord, highlight: true });
        if (matchStart + wordLen < text.length) segments.push({ text: text.slice(matchStart + wordLen), highlight: false });
        return segments;
      }
    }

    // No spokenCharIndex available — fall back to first occurrence only
    const firstIdx = text.indexOf(activeWord);
    const segments: { text: string; highlight: boolean }[] = [];
    if (firstIdx > 0) segments.push({ text: text.slice(0, firstIdx), highlight: false });
    segments.push({ text: activeWord, highlight: true });
    if (firstIdx + wordLen < text.length) segments.push({ text: text.slice(firstIdx + wordLen), highlight: false });
    return segments;
  }

  // No activeWord — highlight single character at spokenCharIndex
  if (typeof spokenCharIndex === 'number' && spokenCharIndex >= 0 && spokenCharIndex < text.length) {
    const before = text.slice(0, spokenCharIndex);
    const char = text.slice(spokenCharIndex, spokenCharIndex + 1);
    const after = text.slice(spokenCharIndex + 1);
    const segments: { text: string; highlight: boolean }[] = [];
    if (before) segments.push({ text: before, highlight: false });
    if (char) segments.push({ text: char, highlight: true });
    if (after) segments.push({ text: after, highlight: false });
    return segments;
  }

  return [{ text, highlight: false }];
}

// ────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────
interface FullscreenTextModalProps {
  visible: boolean;
  onClose: () => void;
  item: LoopItem | null;
  /** The currently-spoken word content (for shadowing highlight) */
  activeWord?: string | null;
  spokenCharIndex?: number;
  isPlaying: boolean;
  isSpeaking: boolean;
  onTogglePlayPause: () => void;
}

// ────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────
export const FullscreenTextModal: React.FC<FullscreenTextModalProps> = ({
  visible,
  onClose,
  item,
  activeWord,
  spokenCharIndex,
  isPlaying,
  isSpeaking,
  onTogglePlayPause,
}) => {
  const [showRuby, setShowRuby] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);

  const rows = useMemo(() => {
    if (!item?.content || !item?.pinyin) return null;
    return buildRows(item.content, item.pinyin);
  }, [item?.content, item?.pinyin]);

  const hasPinyin = Boolean(item?.pinyin);
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? 40 : 20
  );
  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* <StatusBar backgroundColor="#000000ff" translucent /> */}

        <Bg1/>

        <View style={{backgroundColor: "#000000d7", height: topInset}}></View>

        {/* ── Top Status Bar + Header Bar ── */}
        <View style={[styles.topBarWrapper]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBg}>
                <Lucide name="file-text" size={16} color="#8b5cf6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {item?.title || 'Full Text'}
                </Text>
                <Text style={styles.headerSub}>Shadowing Mode</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Lucide name="x" size={18} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Toggle Bar ── */}
        <View style={styles.toggleBar}>
          {hasPinyin && (
            <TouchableOpacity
              style={[styles.toggleChip, showRuby && styles.toggleChipActive]}
              onPress={() => setShowRuby((v) => !v)}
              activeOpacity={0.7}
            >
              <Lucide name="captions" size={13} color={showRuby ? '#8b5cf6' : '#64748b'} />
              <Text style={[styles.toggleChipText, showRuby && styles.toggleChipTextActive]}>
                Pinyin Under
              </Text>
            </TouchableOpacity>
          )}

          {hasPinyin && !showRuby && (
            <TouchableOpacity
              style={[styles.toggleChip, showPinyin && styles.toggleChipActive]}
              onPress={() => setShowPinyin((v) => !v)}
              activeOpacity={0.7}
            >
              <Lucide name="mic" size={13} color={showPinyin ? '#8b5cf6' : '#64748b'} />
              <Text style={[styles.toggleChipText, showPinyin && styles.toggleChipTextActive]}>
                Pinyin
              </Text>
            </TouchableOpacity>
          )}

          {item?.meaning && (
            <TouchableOpacity
              style={[styles.toggleChip, showMeaning && styles.toggleChipActive]}
              onPress={() => setShowMeaning((v) => !v)}
              activeOpacity={0.7}
            >
              <Lucide name="book-open" size={13} color={showMeaning ? '#8b5cf6' : '#64748b'} />
              <Text style={[styles.toggleChipText, showMeaning && styles.toggleChipTextActive]}>
                Translation
              </Text>
            </TouchableOpacity>
          )}

          {/* Playback pill */}
          <TouchableOpacity
            style={[styles.playPill, isPlaying && styles.playPillActive]}
            onPress={onTogglePlayPause}
            activeOpacity={0.8}
          >
            <Lucide
              name={isPlaying ? 'pause' : 'play'}
              size={13}
              color={isPlaying ? '#ffffff' : '#8b5cf6'}
            />
            <Text style={[styles.playPillText, isPlaying && styles.playPillTextActive]}>
              {isPlaying ? 'Pause' : 'Play'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Speaking indicator strip ── */}
        {isSpeaking && (
          <View style={styles.speakingStrip}>
            <View style={styles.liveDot} />
            <Text style={styles.speakingStripText}>Audio playing — shadow along!</Text>
          </View>
        )}

        {/* ── Content Scroll ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Pinyin Transcript block (when not ruby mode) */}
          {showPinyin && !showRuby && Boolean(item?.pinyin) && (
            <View style={styles.pinyinBlock}>
              <Text style={styles.pinyinBlockLabel}>Pinyin</Text>
              <Text style={styles.pinyinBlockText}>{item!.pinyin}</Text>
            </View>
          )}

          {/* Main text area */}
          <View style={styles.textArea}>
            {showRuby && rows ? (
              // ── Ruby / Pinyin-under layout: Chinese character TOP, Pinyin UNDER ──
              (() => {
                // Compute the specific occurrence of activeWord that contains
                // spokenCharIndex so we don't colour every instance in the text.
                let activeWordStart = -1;
                let activeWordEnd = -1;
                const fullText = item?.content || '';
                if (activeWord && fullText.includes(activeWord)) {
                  const wordLen = activeWord.length;
                  if (typeof spokenCharIndex === 'number' && spokenCharIndex >= 0) {
                    let searchFrom = 0;
                    while (searchFrom <= fullText.length - wordLen) {
                      const idx = fullText.indexOf(activeWord, searchFrom);
                      if (idx === -1) break;
                      if (spokenCharIndex >= idx && spokenCharIndex < idx + wordLen) {
                        activeWordStart = idx;
                        activeWordEnd = idx + wordLen;
                        break;
                      }
                      searchFrom = idx + 1;
                    }
                  }
                  // Fall back to first occurrence if spokenCharIndex isn't inside any
                  if (activeWordStart === -1) {
                    activeWordStart = fullText.indexOf(activeWord);
                    activeWordEnd = activeWordStart + wordLen;
                  }
                }

                return rows.map((row, rIdx) => (
                  <View key={rIdx} style={styles.rubyRow}>
                    {row.map((pair, cIdx) => {
                      const isWordMatch =
                        activeWordStart !== -1 &&
                        pair.charIndex >= activeWordStart &&
                        pair.charIndex < activeWordEnd;
                      const isCharIndexMatch =
                        typeof spokenCharIndex === 'number' &&
                        spokenCharIndex >= 0 &&
                        pair.charIndex === spokenCharIndex;
                      const isHighlighted = isWordMatch || isCharIndexMatch;

                    return (
                      <View key={cIdx} style={styles.rubyCharBlock}>
                        <Text
                          style={[
                            styles.rubyChar,
                            isHighlighted && isSpeaking && styles.rubyCharActive,
                          ]}
                        >
                          {pair.char}
                        </Text>
                        {pair.pinyin ? (
                          <Text
                            style={[
                              styles.rubyPinyin,
                              isHighlighted && isSpeaking && styles.rubyPinyinActive,
                            ]}
                            numberOfLines={1}
                          >
                            {pair.pinyin}
                          </Text>
                        ) : (
                          <Text style={styles.rubyPinyinGhost}> </Text>
                        )}
                      </View>
                    );
                    })}
                  </View>
                ));
              })()
            ) : (
              // ── Plain highlighted text layout ──
              <Text style={styles.plainText}>
                {buildHighlightedSegments(
                  item?.content || '',
                  activeWord || null,
                  spokenCharIndex
                ).map((seg, i) => (
                  <Text
                    key={i}
                    style={
                      seg.highlight && isSpeaking
                        ? styles.highlightedWord
                        : undefined
                    }
                  >
                    {seg.text}
                  </Text>
                ))}
              </Text>
            )}
          </View>

          {/* Meaning block */}
          {showMeaning && Boolean(item?.meaning) && (
            <View style={styles.meaningBlock}>
              <Text style={styles.meaningBlockLabel}>Translation</Text>
              <Text style={styles.meaningBlockText}>{item!.meaning}</Text>
            </View>
          )}

          <View style={{ height: bottomInset + 30 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

// ────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBarWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  toggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleChipActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#c4b5fd',
  },
  toggleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleChipTextActive: {
    color: '#8b5cf6',
  },
  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#c4b5fd',
    marginLeft: 'auto',
  },
  playPillActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
  },
  playPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  playPillTextActive: {
    color: '#ffffff',
  },
  speakingStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#ecfdf5',
    borderBottomWidth: 1,
    borderBottomColor: '#a7f3d0',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  speakingStripText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  pinyinBlock: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    gap: 4,
  },
  pinyinBlockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pinyinBlockText: {
    fontSize: 15,
    color: '#0369a1',
    fontWeight: '500',
    lineHeight: 24,
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  // ── Ruby layout ──
  rubyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  rubyCharBlock: {
    alignItems: 'center',
    marginHorizontal: 1,
    marginVertical: 3,
  },
  rubyPinyin: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  rubyPinyinGhost: {
    fontSize: 11,
    lineHeight: 15,
    color: 'transparent',
  },
  rubyPinyinActive: {
    color: '#ef4444',
    fontWeight: '800',
  },
  rubyChar: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 32,
    textAlign: 'center',
  },
  rubyCharActive: {
    color: '#ef4444',
    fontWeight: '800',
  },
  // ── Plain layout ──
  plainText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 38,
    letterSpacing: 0.5,
  },
  highlightedWord: {
    color: '#ef4444',
    fontWeight: '800',
  },
  // ── Meaning block ──
  meaningBlock: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#64748b',
    gap: 4,
  },
  meaningBlockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  meaningBlockText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 24,
  },
});

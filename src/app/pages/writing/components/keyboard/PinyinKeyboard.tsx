import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { CharacterType } from '@/types';
import {
  PINYIN_QWERTY_ROWS,
  PINYIN_TONE_VOWELS,
  SCREEN_WIDTH,
  TONE_COLORS,
} from '../../constants';

interface PinyinKeyboardProps {
  lookupChars: CharacterType[];
  hidePinyin: boolean;
  onInsertChar: (char: string) => void;
  onBackspace: () => void;
}

export const PinyinKeyboard: React.FC<PinyinKeyboardProps> = ({
  lookupChars,
  hidePinyin,
  onInsertChar,
  onBackspace,
}) => {
  // Buffer of current pinyin syllable being typed
  const [pinyinBuffer, setPinyinBuffer] = useState('');
  // Mode: candidate conversion vs direct typing of pinyin letters
  const [directPinyinMode, setDirectPinyinMode] = useState(false);
  // Optional expanded tone vowels selector
  const [selectedVowel, setSelectedVowel] = useState<string | null>(null);

  // Candidates matching the current pinyin buffer
  const candidates = useMemo(() => {
    if (!pinyinBuffer.trim()) return [];
    const query = pinyinBuffer.toLowerCase().trim();
    const matches: CharacterType[] = [];
    const seen = new Set<string>();

    for (const c of lookupChars) {
      if (!c.content || seen.has(c.content)) continue;
      const cleanPinyin = (c.pinyin || '').toLowerCase().replace(/[^a-z]/g, '');
      if (cleanPinyin.startsWith(query)) {
        matches.push(c);
        seen.add(c.content);
        if (matches.length >= 25) break;
      }
    }
    return matches;
  }, [pinyinBuffer, lookupChars]);

  const handleKeyPress = (letter: string) => {
    if (directPinyinMode) {
      onInsertChar(letter);
    } else {
      setPinyinBuffer((prev) => prev + letter);
    }
  };

  const handleSelectCandidate = (char: CharacterType) => {
    onInsertChar(char.content);
    setPinyinBuffer('');
  };

  const handleCommitBufferAsPinyin = () => {
    if (pinyinBuffer) {
      onInsertChar(pinyinBuffer);
      setPinyinBuffer('');
    }
  };

  const handleBufferBackspace = () => {
    if (pinyinBuffer.length > 0) {
      setPinyinBuffer((prev) => prev.slice(0, -1));
    } else {
      onBackspace();
    }
  };

  const handleToneVowelPress = (accentedVowel: string) => {
    onInsertChar(accentedVowel);
  };

  return (
    <View style={styles.container}>
      {/* Top control bar: Candidate vs Direct Pinyin toggle & Buffer display */}
      <View style={styles.headerRow}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, !directPinyinMode && styles.modeBtnActive]}
            onPress={() => setDirectPinyinMode(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeBtnText, !directPinyinMode && styles.modeBtnTextActive]}>
              Pinyin → 汉字
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, directPinyinMode && styles.modeBtnActive]}
            onPress={() => {
              setDirectPinyinMode(true);
              setPinyinBuffer('');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeBtnText, directPinyinMode && styles.modeBtnTextActive]}>
              Direct Pinyin (拼音)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current buffer indicator */}
        {!directPinyinMode && pinyinBuffer.length > 0 && (
          <View style={styles.bufferPill}>
            <Text style={styles.bufferText}>{pinyinBuffer}</Text>
            <TouchableOpacity onPress={() => setPinyinBuffer('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Lucide name="x" size={11} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Candidates bar (in IME mode) OR Tone vowels bar (in Direct mode) */}
      {!directPinyinMode ? (
        <View style={styles.candidateBar}>
          {pinyinBuffer.length === 0 ? (
            <Text style={styles.candidatePrompt}>Type pinyin letters to see Hanzi candidates...</Text>
          ) : candidates.length === 0 ? (
            <View style={styles.noCandidateRow}>
              <Text style={styles.noCandidateText}>No matching character</Text>
              <TouchableOpacity style={styles.commitPinyinBtn} onPress={handleCommitBufferAsPinyin}>
                <Text style={styles.commitPinyinText}>Insert "{pinyinBuffer}"</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.candidatesScroll}>
              <TouchableOpacity style={styles.commitPinyinBtn} onPress={handleCommitBufferAsPinyin}>
                <Text style={styles.commitPinyinText}>"{pinyinBuffer}"</Text>
              </TouchableOpacity>
              {candidates.map((c) => {
                const toneColor = TONE_COLORS[c.tone || '5'] || '#8b5cf6';
                return (
                  <TouchableOpacity
                    key={`cand-${c.id}`}
                    style={styles.candidateItem}
                    onPress={() => handleSelectCandidate(c)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.candidateHanzi}>{c.content}</Text>
                    {!hidePinyin && (
                      <Text style={[styles.candidatePinyin, { color: toneColor }]}>
                        {c.pinyin}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : (
        <View style={styles.toneBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toneScroll}>
            {PINYIN_TONE_VOWELS.map((group) => (
              <View key={group.base} style={styles.toneGroup}>
                {group.tones.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={styles.toneBtn}
                    onPress={() => handleToneVowelPress(t)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.toneBtnText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* QWERTY Keys */}
      <View style={styles.qwertyContainer}>
        {PINYIN_QWERTY_ROWS.map((row, rowIdx) => (
          <View key={`row-${rowIdx}`} style={styles.qwertyRow}>
            {row.map((letter) => (
              <TouchableOpacity
                key={letter}
                style={styles.letterKey}
                onPress={() => handleKeyPress(letter)}
                activeOpacity={0.65}
              >
                <Text style={styles.letterText}>{letter}</Text>
              </TouchableOpacity>
            ))}

            {/* Backspace on 3rd row */}
            {rowIdx === 2 && (
              <TouchableOpacity
                style={styles.backspaceKey}
                onPress={handleBufferBackspace}
                activeOpacity={0.65}
              >
                <Lucide name="delete" size={16} color="#475569" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 210,
    gap: 4,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  modeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modeBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modeBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  modeBtnTextActive: {
    color: '#8b5cf6',
    fontWeight: '700',
  },
  bufferPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d8b4fe',
  },
  bufferText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  candidateBar: {
    height: 38,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  candidatePrompt: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  noCandidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noCandidateText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  candidatesScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  candidateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  candidateHanzi: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  candidatePinyin: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  commitPinyinBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },
  commitPinyinText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  toneBar: {
    height: 38,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toneScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toneGroup: {
    flexDirection: 'row',
    gap: 3,
  },
  toneBtn: {
    width: 25,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  qwertyContainer: {
    gap: 4,
  },
  qwertyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  letterKey: {
    flex: 1,
    maxWidth: (SCREEN_WIDTH - 70) / 10,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  letterText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  backspaceKey: {
    flex: 1.5,
    maxWidth: (SCREEN_WIDTH - 70) / 7,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

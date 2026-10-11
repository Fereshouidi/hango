import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { SentenceType } from '@/types';
import { speakChineseText } from '@/utils/tts';
import { DictationHint, DictationResult } from '../types';

interface DictationCardProps {
  currentSentence: SentenceType | null;
  dictationSentences: SentenceType[];
  dictationIndex: number;
  dictationHint: DictationHint;
  onSetDictationHint: (hint: DictationHint) => void;
  dictationResults: DictationResult[];
  showDictationAnswer: boolean;
  typedText: string;
  onCheck: () => void;
  onNext: () => void;
  onSkip: () => void;
  onReshuffle: () => void;
}

export const DictationCard: React.FC<DictationCardProps> = ({
  currentSentence,
  dictationSentences,
  dictationIndex,
  dictationHint,
  onSetDictationHint,
  dictationResults,
  showDictationAnswer,
  typedText,
  onCheck,
  onNext,
  onSkip,
  onReshuffle,
}) => {
  if (!currentSentence) {
    return (
      <View style={styles.emptyCard}>
        <Lucide name="inbox" size={28} color="#cbd5e1" />
        <Text style={styles.emptyText}>No sentences found for this filter.</Text>
        <Text style={styles.emptySubtext}>Try selecting a different HSK level or lesson.</Text>
      </View>
    );
  }

  const total = dictationSentences.length;
  const progress = total > 0 ? dictationIndex / total : 0;
  const lastResult = dictationResults[dictationResults.length - 1];

  return (
    <View style={styles.card}>
      {/* Header with progress & hint toggle */}
      <View style={styles.header}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {dictationIndex + 1} / {total}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={styles.scoreText}>
            ✓ {dictationResults.filter((r) => r.correct).length}
          </Text>
        </View>

        <View style={styles.hintRow}>
          <TouchableOpacity
            style={[styles.hintBtn, dictationHint === 'pinyin' && styles.hintBtnActive]}
            onPress={() => onSetDictationHint('pinyin')}
            activeOpacity={0.7}
          >
            <Text style={[styles.hintBtnText, dictationHint === 'pinyin' && styles.hintBtnTextActive]}>
              Pinyin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.hintBtn, dictationHint === 'english' && styles.hintBtnActive]}
            onPress={() => onSetDictationHint('english')}
            activeOpacity={0.7}
          >
            <Text style={[styles.hintBtnText, dictationHint === 'english' && styles.hintBtnTextActive]}>
              English
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Prompt box */}
      <TouchableOpacity
        style={styles.promptBox}
        onPress={() => speakChineseText(currentSentence.content)}
        activeOpacity={0.85}
      >
        <View style={styles.promptInner}>
          <Lucide name="volume-2" size={15} color="#8b5cf6" />
          <Text style={styles.promptText}>
            {dictationHint === 'pinyin' ? currentSentence.pinyin : currentSentence.meaning}
          </Text>
        </View>
        <Text style={styles.tapHint}>Tap to listen in Chinese</Text>
      </TouchableOpacity>

      {/* Answer result reveal */}
      {showDictationAnswer && (
        <View
          style={[
            styles.answerBox,
            lastResult?.correct ? styles.answerCorrect : styles.answerWrong,
          ]}
        >
          <View style={styles.answerHeader}>
            <Lucide
              name={lastResult?.correct ? 'check-circle-2' : 'x-circle'}
              size={14}
              color={lastResult?.correct ? '#10b981' : '#ef4444'}
            />
            <Text
              style={[
                styles.answerLabel,
                { color: lastResult?.correct ? '#10b981' : '#ef4444' },
              ]}
            >
              {lastResult?.correct ? 'Correct! 太棒了!' : 'Incorrect 还需要练习'}
            </Text>
          </View>
          <Text style={styles.answerContent}>{currentSentence.content}</Text>
          <Text style={styles.answerPinyin}>{currentSentence.pinyin}</Text>
          {!lastResult?.correct && (
            <Text style={styles.answerYours}>
              Your answer: {lastResult?.typed || '(empty)'}
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
          <Lucide name="skip-forward" size={14} color="#64748b" />
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reshuffleBtn} onPress={onReshuffle} activeOpacity={0.7}>
          <Lucide name="shuffle" size={14} color="#64748b" />
        </TouchableOpacity>

        {showDictationAnswer ? (
          <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.7}>
            <Text style={styles.nextText}>Next Sentence</Text>
            <Lucide name="arrow-right" size={14} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.checkBtn, !typedText.trim() && styles.checkBtnDisabled]}
            disabled={!typedText.trim()}
            onPress={onCheck}
            activeOpacity={0.7}
          >
            <Lucide name="check" size={14} color="#fff" />
            <Text style={styles.checkText}>Check</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffffda',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 10,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: {
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    minWidth: 36,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 2,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    minWidth: 24,
  },
  hintRow: {
    flexDirection: 'row',
    gap: 6,
  },
  hintBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hintBtnActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  hintBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  hintBtnTextActive: {
    color: '#b45309',
    fontWeight: '700',
  },
  promptBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 4,
  },
  promptInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 22,
  },
  tapHint: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  answerBox: {
    borderRadius: 12,
    padding: 10,
    gap: 4,
    borderWidth: 1,
  },
  answerCorrect: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  answerWrong: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  answerContent: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  answerPinyin: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  answerYours: {
    fontSize: 11,
    color: '#ef4444',
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  reshuffleBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  checkBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  checkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  nextText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  emptyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

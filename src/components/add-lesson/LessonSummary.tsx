import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

type LessonSummaryProps = {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
  textCount: number;
  ruleCount: number;
};

export const LessonSummary = ({
  characterCount,
  wordCount,
  sentenceCount,
  textCount,
  ruleCount,
}: LessonSummaryProps) => (
  <View style={styles.summaryCard}>
    <View style={styles.summaryTopRow}>
      <Lucide name="layers" size={16} color="#4f46e5" />
      <Text style={styles.summaryTitle}>Lesson Contents Overview</Text>
    </View>

    <View style={styles.summaryBadgesRow}>
      <View style={styles.summaryPill}>
        <Text style={styles.summaryPillLabel}>Characters</Text>
        <Text style={styles.summaryPillValue}>{characterCount}</Text>
      </View>
      <View style={styles.summaryPill}>
        <Text style={styles.summaryPillLabel}>Words</Text>
        <Text style={styles.summaryPillValue}>{wordCount}</Text>
      </View>
      <View style={styles.summaryPill}>
        <Text style={styles.summaryPillLabel}>Sentences</Text>
        <Text style={styles.summaryPillValue}>{sentenceCount}</Text>
      </View>
      <View style={styles.summaryPill}>
        <Text style={styles.summaryPillLabel}>Texts</Text>
        <Text style={styles.summaryPillValue}>{textCount}</Text>
      </View>
      <View style={styles.summaryPill}>
        <Text style={styles.summaryPillLabel}>Rules</Text>
        <Text style={styles.summaryPillValue}>{ruleCount}</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 10,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  summaryBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  summaryPillLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  summaryPillValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
});

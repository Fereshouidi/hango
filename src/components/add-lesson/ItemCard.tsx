import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

type ItemCardProps = {
  title: string;
  subtitle?: string;
  detail?: string;
  selected: boolean;
  onToggle: () => void;
  color: string;
  width?: number;
  assignedLessonName?: string;
  isChineseTitle?: boolean;
};

export const ItemCard = ({
  title,
  subtitle,
  detail,
  selected,
  onToggle,
  color,
  width = 170,
  assignedLessonName,
  isChineseTitle = true,
}: ItemCardProps) => (
  <TouchableOpacity
    style={[
      styles.itemCard,
      { width },
      selected && { borderColor: color, backgroundColor: color + '0a' },
    ]}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View style={styles.cardTopRow}>
      {assignedLessonName ? (
        <View style={styles.assignedPill}>
          <Text style={styles.assignedPillText} numberOfLines={1}>
            {assignedLessonName}
          </Text>
        </View>
      ) : (
        <View style={styles.availablePill}>
          <Text style={styles.availablePillText}>Available</Text>
        </View>
      )}

      <View
        style={[
          styles.checkbox,
          selected && { backgroundColor: color, borderColor: color },
        ]}
      >
        {selected && <Lucide name="check" size={11} color="#ffffff" />}
      </View>
    </View>

    <Text
      style={[
        styles.itemCardTitle,
        isChineseTitle && styles.itemCardTitleChinese,
      ]}
      numberOfLines={2}
    >
      {title}
    </Text>

    {subtitle ? (
      <Text style={styles.itemCardSubtitle} numberOfLines={2}>
        {subtitle}
      </Text>
    ) : null}

    {detail ? (
      <Text style={styles.itemCardDetail} numberOfLines={2}>
        {detail}
      </Text>
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignedPill: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: '75%',
  },
  assignedPillText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  availablePill: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 0.5,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  availablePillText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '600',
  },
  itemCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemCardTitleChinese: {
    fontSize: 17,
    fontWeight: '700',
  },
  itemCardSubtitle: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  itemCardDetail: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
});

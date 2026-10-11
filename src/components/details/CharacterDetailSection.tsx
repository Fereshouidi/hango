import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

interface CharacterDetailSectionProps {
  title: string;
  iconName: string;
  badgeColor: string;
  count: number;
  addBtnText: string;
  onAddPress: () => void;
  emptyLabel: string;
  children?: React.ReactNode;
}

export const CharacterDetailSection: React.FC<CharacterDetailSectionProps> = ({
  title,
  iconName,
  badgeColor,
  count,
  addBtnText,
  onAddPress,
  emptyLabel,
  children,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionBadge, { backgroundColor: badgeColor }]}>
          <Lucide name={iconName as any} size={14} color="#ffffff" />
        </View>
        <View style={styles.sectionHeaderCenter}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.countBubble}>
            <Text style={styles.countBubbleText}>{count}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: badgeColor }]}
          onPress={onAddPress}
          activeOpacity={0.8}
        >
          <Lucide name="plus" size={12} color="#ffffff" />
          <Text style={styles.addBtnText}>{addBtnText}</Text>
        </TouchableOpacity>
      </View>

      {count > 0 ? (
        children
      ) : (
        <View style={styles.sectionEmptyPlaceholder}>
          <Text style={styles.sectionEmptyText}>{emptyLabel}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: 10,
    marginTop: 4,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ffffffe6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  sectionHeaderCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  countBubble: {
    backgroundColor: '#f1f5f9d0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBubbleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  addBtn: {
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addBtnText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  sectionEmptyPlaceholder: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
  },
  sectionEmptyText: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
});

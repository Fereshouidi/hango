import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

interface StudyToggleBarProps {
  showPinyin: boolean;
  setShowPinyin: (val: boolean) => void;
  showMeaning: boolean;
  setShowMeaning: (val: boolean) => void;
  accentColor?: string;
}

export const StudyToggleBar: React.FC<StudyToggleBarProps> = ({
  showPinyin,
  setShowPinyin,
  showMeaning,
  setShowMeaning,
  accentColor = '#0284c7',
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.chip, showPinyin && { backgroundColor: accentColor + '40', borderColor: accentColor + '40' }]}
        onPress={() => setShowPinyin(!showPinyin)}
        activeOpacity={0.7}
      >
        <Lucide
          name={showPinyin ? 'eye' : 'eye-off'}
          size={14}
          color={showPinyin ? accentColor : '#64748b'}
        />
        <Text style={[styles.chipText, showPinyin && { color: accentColor }]}>Pinyin</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.chip, showMeaning && { backgroundColor: accentColor + '40', borderColor: accentColor + '40' }]}
        onPress={() => setShowMeaning(!showMeaning)}
        activeOpacity={0.7}
      >
        <Lucide
          name={showMeaning ? 'eye' : 'eye-off'}
          size={14}
          color={showMeaning ? accentColor : '#64748b'}
        />
        <Text style={[styles.chipText, showMeaning && { color: accentColor }]}>Translation</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
});

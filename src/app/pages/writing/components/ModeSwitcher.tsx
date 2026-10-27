import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { WritingMode } from '../types';

interface ModeSwitcherProps {
  mode: WritingMode;
  onSelectMode: (mode: WritingMode) => void;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, onSelectMode }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.switchBtn,
          mode === 'dictation' && [styles.switchBtnActive, { backgroundColor: '#d97706' }],
        ]}
        onPress={() => onSelectMode('dictation')}
        activeOpacity={0.7}
      >
        <Lucide name="pen" size={13} color={mode === 'dictation' ? '#fff' : '#64748b'} />
        <Text style={[styles.switchText, mode === 'dictation' && styles.switchTextActive]}>
          Dictation
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.switchBtn, mode === 'keyboard' && styles.switchBtnActive]}
        onPress={() => onSelectMode('keyboard')}
        activeOpacity={0.7}
      >
        <Lucide name="keyboard" size={13} color={mode === 'keyboard' ? '#fff' : '#64748b'} />
        <Text style={[styles.switchText, mode === 'keyboard' && styles.switchTextActive]}>
          Free Write
        </Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 6,
    backgroundColor: '#f1f5f9e4',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 10,
  },
  switchBtnActive: {
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  switchTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

interface KeyboardBottomBarProps {
  onInsertChar: (char: string) => void;
  onBackspace: () => void;
}

export const KeyboardBottomBar: React.FC<KeyboardBottomBarProps> = ({
  onInsertChar,
  onBackspace,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.utilKey}
        onPress={() => onInsertChar('，')}
        activeOpacity={0.7}
      >
        <Text style={styles.utilKeyText}>，</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.utilKey}
        onPress={() => onInsertChar('。')}
        activeOpacity={0.7}
      >
        <Text style={styles.utilKeyText}>。</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.spaceKey}
        onPress={() => onInsertChar(' ')}
        activeOpacity={0.7}
      >
        <Text style={styles.spaceKeyText}>Space (空格)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionKey}
        onPress={() => onInsertChar('\n')}
        activeOpacity={0.7}
      >
        <Lucide name="corner-down-left" size={15} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionKey, styles.deleteKey]}
        onPress={onBackspace}
        activeOpacity={0.7}
      >
        <Lucide name="delete" size={15} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 3,
  },
  utilKey: {
    width: 36,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  utilKeyText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
  },
  spaceKey: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  spaceKeyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  actionKey: {
    width: 42,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteKey: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
});

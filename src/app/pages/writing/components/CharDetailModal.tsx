import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { CharacterType } from '@/types';
import { speakChineseText } from '@/utils/tts';

interface CharDetailModalProps {
  charDetail: CharacterType | null;
  onClose: () => void;
}

export const CharDetailModal: React.FC<CharDetailModalProps> = ({ charDetail, onClose }) => {
  if (!charDetail) return null;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.hanzi}>{charDetail.content}</Text>
        <View style={styles.info}>
          <Text style={styles.pinyin}>{charDetail.pinyin}</Text>
          <Text style={styles.meaning} numberOfLines={1}>
            {charDetail.meaning}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <TouchableOpacity
          style={styles.audioBtn}
          onPress={() => speakChineseText(charDetail.content)}
          activeOpacity={0.7}
        >
          <Lucide name="volume-2" size={13} color="#8b5cf6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Lucide name="x" size={13} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafce4',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  hanzi: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8b5cf6',
  },
  info: {
    flex: 1,
  },
  pinyin: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  meaning: {
    fontSize: 10,
    color: '#64748b',
    maxWidth: 200,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  audioBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: '#f3e8ff',
  },
  closeBtn: {
    padding: 5,
    borderRadius: 6,
  },
});

import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Lucide from '@react-native-vector-icons/lucide';
import Header from '@/components/main/header';
import { WritingMode } from '../types';

interface WritingHeaderProps {
  mode: WritingMode;
  text: string;
  isPlayingAudio: boolean;
  onPlayAudio: () => void;
  onShare: () => void;
}

export const WritingHeader: React.FC<WritingHeaderProps> = ({
  mode,
  text,
  isPlayingAudio,
  onPlayAudio,
  onShare,
}) => {
  const router = useRouter();
  const hasText = Boolean(text.trim());

  return (
    <Header
      useBackArrow
      label="Writing"
      subtitle={mode === 'dictation' ? 'Dictation Practice' : 'Writing & Pinyin'}
      items={[
        <TouchableOpacity
          key="audio"
          onPress={onPlayAudio}
          disabled={!hasText}
          activeOpacity={0.7}
          style={[
            styles.headerIconBtn,
            !hasText && styles.headerIconBtnDisabled,
            isPlayingAudio && { backgroundColor: '#8b5cf620' },
          ]}
        >
          <Lucide
            name={isPlayingAudio ? 'volume-2' : 'volume-1'}
            size={17}
            color={isPlayingAudio ? '#8b5cf6' : hasText ? '#475569' : '#cbd5e1'}
          />
        </TouchableOpacity>,
        <TouchableOpacity
          key="share"
          onPress={onShare}
          disabled={!hasText}
          activeOpacity={0.7}
          style={[styles.headerIconBtn, !hasText && styles.headerIconBtnDisabled]}
        >
          <Lucide name="share-2" size={16} color={hasText ? '#475569' : '#cbd5e1'} />
        </TouchableOpacity>,
        <TouchableOpacity
          key="stroke"
          onPress={() => router.push('/pages/characterWrite' as any)}
          activeOpacity={0.7}
          style={[styles.headerIconBtn, { backgroundColor: '#eff6ff' }]}
        >
          <Lucide name="pencil-line" size={16} color="#2563eb" />
        </TouchableOpacity>,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  headerIconBtn: {
    padding: 7,
    borderRadius: 12,
    backgroundColor: '#f1f5f9c3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtnDisabled: {
    opacity: 0.35,
  },
});

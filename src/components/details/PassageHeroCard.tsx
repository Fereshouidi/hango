import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { HSKType, TextType } from '@/types';
import { StudyToggleBar } from '../common/StudyToggleBar';

interface PassageHeroCardProps {
  textObj: TextType | null;
  hsk: HSKType | null;
  sentenceCount: number;
  wordCount: number;
  isPlayingPassage: boolean;
  onPlayPassage: () => void;
  showPinyin: boolean;
  setShowPinyin: (val: boolean) => void;
  showMeaning: boolean;
  setShowMeaning: (val: boolean) => void;
}

export const PassageHeroCard: React.FC<PassageHeroCardProps> = ({
  textObj,
  hsk,
  sentenceCount,
  wordCount,
  isPlayingPassage,
  onPlayPassage,
  showPinyin,
  setShowPinyin,
  showMeaning,
  setShowMeaning,
}) => {
  return (
    <View style={styles.passageCard}>
      <View style={styles.passageCardHeader}>
        <View style={styles.passageHeaderLeft}>
          <View style={styles.iconBg}>
            <Lucide name="file-text" size={18} color="#0284c7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.passageTitle}>{textObj?.title || 'Reading Passage'}</Text>
            <Text style={styles.passageMeta}>
              {hsk ? hsk.name : 'Chinese Text'} • {sentenceCount} Sentences • {wordCount} Words
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.audioPillBtn, isPlayingPassage && styles.audioPillBtnActive]}
          onPress={onPlayPassage}
          activeOpacity={0.8}
        >
          <Lucide
            name={isPlayingPassage ? 'square' : 'play'}
            size={14}
            color={isPlayingPassage ? '#ffffff' : '#0284c7'}
          />
          <Text style={[styles.audioPillText, isPlayingPassage && styles.audioPillTextActive]}>
            {isPlayingPassage ? 'Stop' : 'Listen'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Passage Chinese Content */}
      <View style={styles.chineseContentBox}>
        <Text style={styles.chineseText}>{textObj?.content || 'Loading text passage...'}</Text>
      </View>

      {/* Toggles Row */}
      <StudyToggleBar
        showPinyin={showPinyin}
        setShowPinyin={setShowPinyin}
        showMeaning={showMeaning}
        setShowMeaning={setShowMeaning}
        accentColor="#0284c7"
      />

      {/* Optional Pinyin Display */}
      {showPinyin && textObj?.pinyin ? (
        <View style={styles.pinyinBox}>
          <Text style={styles.pinyinLabel}>Pinyin Transcript:</Text>
          <Text style={styles.pinyinText}>{textObj.pinyin}</Text>
        </View>
      ) : null}

      {/* Optional Meaning Display */}
      {showMeaning && textObj?.meaning ? (
        <View style={styles.meaningBox}>
          <Text style={styles.meaningLabel}>English Translation:</Text>
          <Text style={styles.meaningText}>{textObj.meaning}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  passageCard: {
    backgroundColor: '#ffffffe1',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // elevation: 3,
  },
  passageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    gap: 8,
  },
  passageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0284c715',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  passageMeta: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  audioPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#0284c715',
    borderWidth: 1,
    borderColor: '#0284c740',
  },
  audioPillBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  audioPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  audioPillTextActive: {
    color: '#ffffff',
  },
  chineseContentBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chineseText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  pinyinBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
  },
  pinyinLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  pinyinText: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
    lineHeight: 22,
  },
  meaningBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#64748b',
  },
  meaningLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  meaningText: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 21,
  },
});

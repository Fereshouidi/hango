import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { translateChinese } from '@/services/translationService';
import { hasChinese } from '@/utils/pinyin';

interface AutoTranslateButtonProps {
  chineseText: string;
  onTranslated: (translation: string) => void;
  themeColor?: string;
}

export const AutoTranslateButton: React.FC<AutoTranslateButtonProps> = ({
  chineseText,
  onTranslated,
  themeColor = '#059669',
}) => {
  const [loading, setLoading] = useState(false);

  const canTranslate = hasChinese(chineseText);

  const handleTranslate = async () => {
    if (!canTranslate || loading) return;

    try {
      setLoading(true);
      const translation = await translateChinese(chineseText);
      if (translation) {
        onTranslated(translation);
      } else {
        Alert.alert('Translation', 'Could not find a translation for this text.');
      }
    } catch (e: any) {
      console.error('Translation error:', e);
      Alert.alert('Translation Error', e?.message || 'Failed to translate.');
    } finally {
      setLoading(false);
    }
  };

  if (!canTranslate) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          borderColor: `${themeColor}40`,
          backgroundColor: `${themeColor}12`,
        },
      ]}
      onPress={handleTranslate}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={themeColor} style={{ transform: [{ scale: 0.7 }] }} />
      ) : (
        <Lucide name="languages" size={12} color={themeColor} />
      )}
      <Text style={[styles.btnText, { color: themeColor }]}>
        {loading ? 'Translating...' : 'Auto-translate'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

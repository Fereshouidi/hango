import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import {
  pickImageFromCamera,
  pickImageFromGallery,
  recognizeChineseFromImage,
  processScannedChinese,
  ScannedResult,
} from '@/services/ocrService';
import { hasChinese } from '@/utils/pinyin';

interface ScanOCRButtonProps {
  mode: 'word' | 'sentence' | 'character' | 'text' | 'rule' | 'lesson';
  onScanResult: (result: ScannedResult) => void;
  themeColor?: string;
  label?: string;
}

export const ScanOCRButton: React.FC<ScanOCRButtonProps> = ({
  mode,
  onScanResult,
  themeColor = '#059669',
  label = 'Scan with Camera',
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const executeScan = async (sourceType: 'camera' | 'gallery') => {
    try {
      const image =
        sourceType === 'camera'
          ? await pickImageFromCamera()
          : await pickImageFromGallery();

      // User cancelled camera or gallery
      if (!image) {
        return;
      }

      setLoading(true);
      setLoadingText('Recognizing Chinese text...');

      const rawText = await recognizeChineseFromImage(image);

      if (!rawText || !hasChinese(rawText)) {
        setLoading(false);
        Alert.alert(
          'No Chinese Detected',
          'Could not find clear Chinese text in this photo. Please make sure the text is well-lit and held close to the camera.'
        );
        return;
      }

      setLoadingText('Generating Pinyin & auto-translating...');
      const processed = await processScannedChinese(rawText, mode);

      setLoading(false);
      onScanResult(processed);
    } catch (error: any) {
      setLoading(false);
      console.error('OCR execution error:', error);
      Alert.alert(
        'Scan Error',
        error?.message || 'Could not scan image. Please try again.'
      );
    }
  };

  return (
    <>
      <View style={styles.container}>
        {/* Direct Camera Button */}
        <TouchableOpacity
          style={[
            styles.scanBtn,
            {
              borderColor: `${themeColor}40`,
              backgroundColor: `${themeColor}12`,
            },
          ]}
          onPress={() => executeScan('camera')}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Lucide name="camera" size={13} color={themeColor} />
          <Text style={[styles.scanBtnText, { color: themeColor }]}>
            {label}
          </Text>
        </TouchableOpacity>

        {/* Gallery Pick Button */}
        <TouchableOpacity
          style={[
            styles.galleryBtn,
            {
              borderColor: `${themeColor}40`,
              backgroundColor: `${themeColor}12`,
            },
          ]}
          onPress={() => executeScan('gallery')}
          disabled={loading}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Lucide name="image" size={13} color={themeColor} />
        </TouchableOpacity>
      </View>

      {/* Full-screen Loading Overlay HUD */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={themeColor} />
            <Text style={styles.loadingTitle}>OCR & Auto-Translation</Text>
            <Text style={styles.loadingSubtitle}>{loadingText}</Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  scanBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  galleryBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  loadingSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});

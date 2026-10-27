import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
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

interface CameraOCRModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (result: ScannedResult) => void;
  mode?: 'word' | 'sentence' | 'character' | 'text';
  themeColor?: string;
}

export const CameraOCRModal: React.FC<CameraOCRModalProps> = ({
  visible,
  onClose,
  onApply,
  mode = 'word',
  themeColor = '#059669',
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [previewResult, setPreviewResult] = useState<ScannedResult | null>(null);
  const [detectedTokens, setDetectedTokens] = useState<string[]>([]);

  const handlePickAndScan = async (sourceType: 'camera' | 'gallery') => {
    try {
      setLoading(true);
      setLoadingStage('Opening photo picker...');

      const uri =
        sourceType === 'camera'
          ? await pickImageFromCamera()
          : await pickImageFromGallery();

      if (!uri) {
        setLoading(false);
        return;
      }

      setLoadingStage('Scanning Chinese text with Nitro OCR...');
      const rawText = await recognizeChineseFromImage(uri);

      if (!rawText || !hasChinese(rawText)) {
        setLoading(false);
        Alert.alert(
          'No Chinese Detected',
          'Could not find clear Chinese characters in the image. Please make sure the text is well-lit and clearly visible.'
        );
        return;
      }

      setLoadingStage('Generating Pinyin & auto-translating...');

      // Extract individual words or characters if in word/character mode
      if (mode === 'word' || mode === 'character') {
        const matches = rawText.match(/[\u4e00-\u9fa5]+/g) || [];
        const uniqueTokens = Array.from(new Set(matches)).filter((t) => t.length > 0);
        setDetectedTokens(uniqueTokens);
      } else {
        setDetectedTokens([]);
      }

      const processed = await processScannedChinese(rawText, mode);
      setPreviewResult(processed);
    } catch (error: any) {
      console.error('Scan error:', error);
      Alert.alert('Scan Error', error?.message || 'Could not complete OCR scan.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleSelectToken = async (token: string) => {
    try {
      setLoading(true);
      setLoadingStage('Translating selected word...');
      const processed = await processScannedChinese(token, mode);
      setPreviewResult(processed);
    } catch (e: any) {
      console.error('Token selection error:', e);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleConfirm = () => {
    if (previewResult) {
      onApply(previewResult);
      handleClose();
    }
  };

  const handleClose = () => {
    setPreviewResult(null);
    setDetectedTokens([]);
    setLoading(false);
    onClose();
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'character':
        return 'Scan Chinese Character';
      case 'sentence':
        return 'Scan Chinese Sentence';
      case 'text':
        return 'Scan Reading Passage';
      default:
        return 'Scan Chinese Vocabulary Word';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'character':
        return 'Point camera at a Chinese character. Nitro OCR extracts the character, detects its tone, pinyin, and English meaning.';
      case 'sentence':
        return 'Capture a sentence from a book, screen, or document to extract Chinese text, full pinyin, and auto-translate.';
      case 'text':
        return 'Scan a full passage. Content, pinyin, translation, and individual sentences will be extracted automatically.';
      default:
        return 'Take a photo of Chinese text or vocabulary lists. Extracts Chinese word, pinyin, and English translation.';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconBox, { backgroundColor: `${themeColor}15` }]}>
                <Lucide name="camera" size={18} color={themeColor} />
              </View>
              <Text style={styles.headerTitle}>{getModeTitle()}</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Lucide name="x" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.descriptionText}>{getModeDescription()}</Text>

            {/* Loading Indicator */}
            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={themeColor} />
                <Text style={styles.loadingText}>{loadingStage}</Text>
              </View>
            )}

            {/* Scanned Result Preview */}
            {!loading && previewResult && (
              <View style={styles.resultBox}>
                <View style={styles.resultHeader}>
                  <Lucide name="sparkles" size={14} color={themeColor} />
                  <Text style={[styles.resultHeaderTitle, { color: themeColor }]}>
                    Scanned & Translated
                  </Text>
                </View>

                {/* Chinese Text Field */}
                <View style={styles.resultItem}>
                  <Text style={styles.resultItemLabel}>Chinese Text:</Text>
                  <Text style={styles.resultChineseText}>{previewResult.text}</Text>
                </View>

                {/* Pinyin */}
                {previewResult.pinyin ? (
                  <View style={styles.resultItem}>
                    <Text style={styles.resultItemLabel}>Pinyin:</Text>
                    <Text style={styles.resultPinyinText}>{previewResult.pinyin}</Text>
                  </View>
                ) : null}

                {/* Meaning / Translation */}
                {previewResult.meaning ? (
                  <View style={styles.resultItem}>
                    <Text style={styles.resultItemLabel}>English Meaning:</Text>
                    <Text style={styles.resultMeaningText}>{previewResult.meaning}</Text>
                  </View>
                ) : null}

                {/* Tone for character */}
                {previewResult.tone ? (
                  <View style={styles.resultItem}>
                    <Text style={styles.resultItemLabel}>Pinyin Tone:</Text>
                    <Text style={styles.resultToneText}>Tone {previewResult.tone}</Text>
                  </View>
                ) : null}

                {/* Detected words picker if multiple found */}
                {detectedTokens.length > 1 && (
                  <View style={styles.tokensSection}>
                    <Text style={styles.tokensTitle}>Detected terms in image (tap to pick):</Text>
                    <View style={styles.tokensRow}>
                      {detectedTokens.map((token) => {
                        const isSelected = previewResult.text === token;
                        return (
                          <TouchableOpacity
                            key={token}
                            style={[
                              styles.tokenChip,
                              isSelected && {
                                backgroundColor: themeColor,
                                borderColor: themeColor,
                              },
                            ]}
                            onPress={() => handleSelectToken(token)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.tokenChipText,
                                isSelected && styles.tokenChipTextActive,
                              ]}
                            >
                              {token}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            {!loading && (
              <View style={styles.buttonsContainer}>
                {previewResult ? (
                  <>
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: themeColor }]}
                      onPress={handleConfirm}
                      activeOpacity={0.8}
                    >
                      <Lucide name="check" size={18} color="#ffffff" />
                      <Text style={styles.primaryActionBtnText}>Apply to Form</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryActionBtn}
                      onPress={() => setPreviewResult(null)}
                      activeOpacity={0.7}
                    >
                      <Lucide name="rotate-ccw" size={15} color="#475569" />
                      <Text style={styles.secondaryActionBtnText}>Scan Again</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: themeColor }]}
                      onPress={() => handlePickAndScan('camera')}
                      activeOpacity={0.8}
                    >
                      <Lucide name="camera" size={18} color="#ffffff" />
                      <Text style={styles.primaryActionBtnText}>Take Photo with Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryActionBtn}
                      onPress={() => handlePickAndScan('gallery')}
                      activeOpacity={0.7}
                    >
                      <Lucide name="image" size={16} color="#475569" />
                      <Text style={styles.secondaryActionBtnText}>Choose from Gallery</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 460,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 18,
    gap: 14,
  },
  descriptionText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  resultBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
  },
  resultHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  resultItem: {
    gap: 2,
  },
  resultItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  resultChineseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  resultPinyinText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  resultMeaningText: {
    fontSize: 14,
    color: '#334155',
  },
  resultToneText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  tokensSection: {
    marginTop: 6,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  tokensTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  tokensRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tokenChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tokenChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  tokenChipTextActive: {
    color: '#ffffff',
  },
  buttonsContainer: {
    gap: 10,
    marginTop: 6,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  secondaryActionBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
});

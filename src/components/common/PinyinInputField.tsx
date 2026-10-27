import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import {
  toPinyin,
  hasChinese,
  getPolyphonicReadings,
  getToneFromPinyin,
} from '@/utils/pinyin';

interface PinyinInputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  chineseText: string;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  themeColor?: string;
  onToneChange?: (tone: string) => void;
}

export const PinyinInputField: React.FC<PinyinInputFieldProps> = ({
  value,
  onChangeText,
  chineseText,
  label = 'Pinyin (Optional)',
  placeholder = 'e.g., xué xí',
  multiline = false,
  numberOfLines = 1,
  themeColor = '#059669',
  onToneChange,
}) => {
  const canAutoFill = useMemo(() => hasChinese(chineseText), [chineseText]);

  // Multiple readings for polyphonic characters (多音字)
  const polyphonicList = useMemo(() => {
    return getPolyphonicReadings(chineseText);
  }, [chineseText]);

  const handleAutoFill = () => {
    if (!canAutoFill) return;
    const generated = toPinyin(chineseText);
    onChangeText(generated);
    if (onToneChange && chineseText.trim().length === 1) {
      const tone = getToneFromPinyin(generated);
      onToneChange(tone);
    }
  };

  const handleSelectReading = (reading: string) => {
    onChangeText(reading);
    if (onToneChange) {
      const tone = getToneFromPinyin(reading);
      onToneChange(tone);
    }
  };

  return (
    <View style={styles.container}>
      {/* Label and Auto-fill Button */}
      <View style={styles.labelRow}>
        <Text style={styles.inputLabel}>{label}</Text>

        {canAutoFill && (
          <TouchableOpacity
            style={[
              styles.autoFillBtn,
              {
                borderColor: `${themeColor}40`,
                backgroundColor: `${themeColor}12`,
              },
            ]}
            onPress={handleAutoFill}
            activeOpacity={0.7}
          >
            <Lucide name="sparkles" size={12} color={themeColor} />
            <Text style={[styles.autoFillBtnText, { color: themeColor }]}>
              Auto-generate
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pinyin Text Input */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            multiline && numberOfLines > 1 && { minHeight: 24 * numberOfLines },
          ]}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />

        {value.length > 0 && !multiline && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => onChangeText('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Lucide name="x" size={14} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Polyphonic suggestions (多音字 alternate readings) */}
      {polyphonicList.length > 1 && (
        <View style={styles.polyphonicContainer}>
          <View style={styles.polyphonicHeader}>
            <Lucide name="sparkles" size={11} color="#64748b" />
            <Text style={styles.polyphonicLabel}>Alternative readings:</Text>
          </View>
          <View style={styles.polyphonicPillsRow}>
            {polyphonicList.map((reading) => {
              const isSelected = value.trim() === reading.trim();
              return (
                <TouchableOpacity
                  key={reading}
                  style={[
                    styles.polyphonicPill,
                    isSelected && {
                      backgroundColor: themeColor,
                      borderColor: themeColor,
                    },
                  ]}
                  onPress={() => handleSelectReading(reading)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.polyphonicPillText,
                      isSelected && styles.polyphonicPillTextActive,
                    ]}
                  >
                    {reading}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  autoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  autoFillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  clearBtn: {
    position: 'absolute',
    right: 12,
    padding: 2,
  },
  polyphonicContainer: {
    marginTop: 4,
    gap: 4,
  },
  polyphonicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  polyphonicLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  polyphonicPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  polyphonicPill: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  polyphonicPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  polyphonicPillTextActive: {
    color: '#ffffff',
  },
});

import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { LoopInterval, LoopMode, LoopRepeatCount, LoopSpeed } from '../types';

interface LoopSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  repeatCount: LoopRepeatCount;
  onSelectRepeatCount: (cnt: LoopRepeatCount) => void;
  interval: LoopInterval;
  onSelectInterval: (int: LoopInterval) => void;
  speed: LoopSpeed;
  onSelectSpeed: (spd: LoopSpeed) => void;
  loopMode: LoopMode;
  onSelectLoopMode: (mode: LoopMode) => void;
}

export const LoopSettingsModal: React.FC<LoopSettingsModalProps> = ({
  visible,
  onClose,
  repeatCount,
  onSelectRepeatCount,
  interval,
  onSelectInterval,
  speed,
  onSelectSpeed,
  loopMode,
  onSelectLoopMode,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Header */}
              <View style={styles.sheetHeader}>
                <View style={styles.headerLeft}>
                  <Lucide name="sliders" size={17} color="#8b5cf6" />
                  <Text style={styles.sheetTitle}>Listening Loop Settings</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Lucide name="x" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Section 1: Repeat Count per Item */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Repeat Count Per Sentence</Text>
                <Text style={styles.sectionSublabel}>
                  How many times to repeat each sentence before moving to next
                </Text>
                <View style={styles.optionsRow}>
                  {([1, 2, 3, 5, 0] as LoopRepeatCount[]).map((val) => {
                    const isSelected = repeatCount === val;
                    const label = val === 0 ? '∞ Infinite' : `${val}x`;
                    return (
                      <TouchableOpacity
                        key={`repeat-${val}`}
                        style={[styles.optionPill, isSelected && styles.optionPillActive]}
                        onPress={() => onSelectRepeatCount(val)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Section 2: Shadowing Pause Interval */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Shadowing Pause Interval</Text>
                <Text style={styles.sectionSublabel}>
                  Pause between repeats so you can repeat aloud after audio
                </Text>
                <View style={styles.optionsRow}>
                  {([0, 1, 2, 3, 5] as LoopInterval[]).map((sec) => {
                    const isSelected = interval === sec;
                    return (
                      <TouchableOpacity
                        key={`interval-${sec}`}
                        style={[styles.optionPill, isSelected && styles.optionPillActive]}
                        onPress={() => onSelectInterval(sec)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                          {sec === 0 ? 'None' : `${sec}s`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Section 3: Speech Speed */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Playback Speed</Text>
                <Text style={styles.sectionSublabel}>
                  Adjust speaking speed for better comprehension
                </Text>
                <View style={styles.optionsRow}>
                  {([0.75, 0.85, 1.0, 1.2] as LoopSpeed[]).map((spd) => {
                    const isSelected = speed === spd;
                    const labels: Record<number, string> = {
                      0.75: '0.75x Slow',
                      0.85: '0.85x Normal',
                      1.0: '1.0x Natural',
                      1.2: '1.2x Fast',
                    };
                    return (
                      <TouchableOpacity
                        key={`speed-${spd}`}
                        style={[styles.optionPill, isSelected && styles.optionPillActive]}
                        onPress={() => onSelectSpeed(spd)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                          {labels[spd]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Section 4: Loop Mode */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Queue Order</Text>
                <View style={styles.optionsRow}>
                  {(['repeat-all', 'repeat-one', 'shuffle'] as LoopMode[]).map((m) => {
                    const isSelected = loopMode === m;
                    const labels: Record<LoopMode, string> = {
                      'repeat-all': 'Loop All',
                      'repeat-one': 'Loop One',
                      shuffle: 'Shuffle',
                    };
                    return (
                      <TouchableOpacity
                        key={`mode-${m}`}
                        style={[styles.optionPill, isSelected && styles.optionPillActive]}
                        onPress={() => onSelectLoopMode(m)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                          {labels[m]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Done Button */}
              <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.doneBtnText}>Save & Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',

  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 26,
    gap: 16,
    
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionSublabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: -2,
    marginBottom: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionPillActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  optionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

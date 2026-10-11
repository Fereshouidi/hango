import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

export interface OptionItem {
  id: string;
  label: string;
  iconName: string;
  color?: string;
  onPress: () => void;
  destructive?: boolean;
}

interface OptionsMenuModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: OptionItem[];
}

export const OptionsMenuModal: React.FC<OptionsMenuModalProps> = ({
  visible,
  onClose,
  title = 'Options',
  options,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <Lucide name="x" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsList}>
                {options.map((opt) => {
                  const iconColor = opt.destructive ? '#ef4444' : opt.color || '#334155';
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={styles.optionRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        onClose();
                        opt.onPress();
                      }}
                    >
                      <View style={[styles.iconBadge, { backgroundColor: iconColor + '15' }]}>
                        <Lucide name={opt.iconName as any} size={18} color={iconColor} />
                      </View>
                      <Text style={[styles.optionLabel, opt.destructive && styles.destructiveLabel]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  destructiveLabel: {
    color: '#ef4444',
  },
});

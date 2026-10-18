import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { AppUpdate, openUpdateDownload } from '@/services/updateService';

interface UpdateModalProps {
  visible: boolean;
  update: AppUpdate | null;
  currentVersion: string;
  onDismiss: () => void;
}

export function UpdateModal({
  visible,
  update,
  currentVersion,
  onDismiss,
}: UpdateModalProps) {
  if (!update || !visible) return null;

  const isMandatory = Boolean(update.isMandatory);

  const handleUpdatePress = async () => {
    if (update.downloadUrl) {
      await openUpdateDownload(update.downloadUrl);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isMandatory) {
          onDismiss();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top header badge */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.badge,
                isMandatory ? styles.mandatoryBadge : styles.newBadge,
              ]}
            >
              <Lucide
                name={isMandatory ? 'alert-triangle' : 'sparkles'}
                size={14}
                color={isMandatory ? '#ef4444' : '#3b82f6'}
              />
              <Text
                style={[
                  styles.badgeText,
                  isMandatory ? styles.mandatoryText : styles.newText,
                ]}
              >
                {isMandatory ? 'MANDATORY UPDATE' : 'NEW UPDATE AVAILABLE'}
              </Text>
            </View>

            {!isMandatory && (
              <TouchableOpacity
                onPress={onDismiss}
                style={styles.closeIconButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Lucide name="x" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Title & Version Info */}
          <View style={styles.versionContainer}>
            <View style={styles.iconCircle}>
              <Lucide name="arrow-up-circle" size={32} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{update.title || 'New Version Ready'}</Text>
              <View style={styles.versionRow}>
                <Text style={styles.currentVerText}>v{currentVersion}</Text>
                <Lucide name="arrow-right" size={12} color="#94a3b8" style={{ marginHorizontal: 6 }} />
                <View style={styles.newVerPill}>
                  <Text style={styles.newVerText}>v{update.version}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Release Notes */}
          <View style={styles.notesBox}>
            <View style={styles.notesHeader}>
              <Lucide name="file-text" size={15} color="#64748b" />
              <Text style={styles.notesTitle}>What's New</Text>
            </View>

            <ScrollView
              style={styles.scrollArea}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {update.releaseNotes && update.releaseNotes.length > 0 ? (
                update.releaseNotes.map((note, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{note}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.bulletText}>
                  {update.description || 'Performance enhancements, bug fixes, and new features.'}
                </Text>
              )}
            </ScrollView>
          </View>

          {/* Mandatory notice if applicable */}
          {isMandatory && (
            <View style={styles.warningNotice}>
              <Lucide name="info" size={15} color="#dc2626" />
              <Text style={styles.warningText}>
                Please update to continue using HanGo and avoid sync incompatibilities.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {!isMandatory && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onDismiss}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isMandatory && { flex: 1 },
              ]}
              onPress={handleUpdatePress}
              activeOpacity={0.8}
            >
              <Lucide name="download" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.primaryButtonText}>Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  newBadge: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
  },
  mandatoryBadge: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  newText: {
    color: '#2563eb',
  },
  mandatoryText: {
    color: '#dc2626',
  },
  closeIconButton: {
    padding: 4,
    borderRadius: 999,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  currentVerText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  newVerPill: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newVerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollArea: {
    maxHeight: 160,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#334155',
  },
  warningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#b91c1c',
    lineHeight: 16,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  primaryButton: {
    flex: 1.4,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});

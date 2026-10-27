import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

interface CollapsibleLinkingSectionProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  selectedCount?: number;
  badgeLabel?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  tip?: string;
  style?: ViewStyle;
}

export const CollapsibleLinkingSection: React.FC<CollapsibleLinkingSectionProps> = ({
  title = 'Link to Other Items (Optional)',
  subtitle = 'Connect with lessons, sentences, words, or rules',
  icon = 'link-2',
  accentColor = '#059669',
  selectedCount = 0,
  badgeLabel,
  isOpen,
  onToggle,
  children,
  tip = "Connecting items is completely optional! You can save right now or link items below whenever you like.",
  style,
}) => {
  const displayBadge =
    badgeLabel ||
    (selectedCount > 0 ? `${selectedCount} linked` : 'Optional');

  return (
    <View style={[styles.wrapper, style]}>
      {/* Toggle Button Card */}
      <TouchableOpacity
        style={[
          styles.headerCard,
          isOpen && {
            borderColor: accentColor,
            backgroundColor: '#ffffff',
            borderBottomLeftRadius: 6,
            borderBottomRightRadius: 6,
          },
        ]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
          <Lucide name={icon as any} size={18} color={accentColor} />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <Text style={styles.subtitleText} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.trailingContainer}>
          <View
            style={[
              styles.badge,
              selectedCount > 0
                ? { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40` }
                : styles.badgeNeutral,
            ]}
          >
            {selectedCount > 0 && (
              <Lucide name="check" size={11} color={accentColor} style={{ marginRight: 3 }} />
            )}
            <Text
              style={[
                styles.badgeText,
                selectedCount > 0 ? { color: accentColor, fontWeight: '700' } : styles.badgeTextNeutral,
              ]}
            >
              {displayBadge}
            </Text>
          </View>

          <View style={[styles.chevronWrap, isOpen && { backgroundColor: `${accentColor}15` }]}>
            <Lucide
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isOpen ? accentColor : '#64748b'}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isOpen && (
        <View style={styles.contentContainer}>
          {Boolean(tip) && (
            <View style={styles.tipCard}>
              <View style={[styles.tipIconWrap, { backgroundColor: `${accentColor}15` }]}>
                <Lucide name="sparkles" size={14} color={accentColor} />
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          )}

          {children}

          {/* Quick Collapse Footer */}
          <TouchableOpacity
            style={styles.collapseFooterBtn}
            onPress={onToggle}
            activeOpacity={0.7}
          >
            <Lucide name="chevron-up" size={15} color="#64748b" />
            <Text style={styles.collapseFooterText}>Collapse Optional Links</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
  },
  headerCard: {
    backgroundColor: '#ffffffe6',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitleText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  trailingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeNeutral: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  badgeText: {
    fontSize: 11,
  },
  badgeTextNeutral: {
    color: '#64748b',
    fontWeight: '600',
  },
  chevronWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    marginTop: 6,
    gap: 6,
  },
  tipCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 2,
    marginBottom: 4,
  },
  tipIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '500',
  },
  collapseFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  collapseFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
});

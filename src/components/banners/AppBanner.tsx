import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type BannerType = 'success' | 'error' | 'warning' | 'info';

export interface BannerButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface BannerBadge {
  label: string;
  icon?: string;
  color?: string;
  bg?: string;
  borderColor?: string;
}

export interface AppBannerProps {
  id?: number | string;
  visible: boolean;
  type?: BannerType;
  position?: 'top' | 'center';
  title: string;
  subTitle?: string;
  message?: string;
  details?: string;
  badges?: BannerBadge[];
  buttons?: BannerButton[];
  autoCloseMs?: number;
  onClose: () => void;
}

const THEME_CONFIG: Record<
  BannerType,
  {
    icon: string;
    accent: string;
    bg: string;
    border: string;
    iconBg: string;
    titleColor: string;
    messageColor: string;
  }
> = {
  success: {
    icon: 'badge-check',
    accent: '#10b981',
    bg: '#f0fdf4',
    border: '#a7f3d0',
    iconBg: '#dcfce7',
    titleColor: '#065f46',
    messageColor: '#047857',
  },
  error: {
    icon: 'alert-circle',
    accent: '#ef4444',
    bg: '#fef2f2',
    border: '#fecaca',
    iconBg: '#fee2e2',
    titleColor: '#991b1b',
    messageColor: '#b91c1c',
  },
  warning: {
    icon: 'alert-triangle',
    accent: '#f59e0b',
    bg: '#fffbeb',
    border: '#fde68a',
    iconBg: '#fef3c7',
    titleColor: '#92400e',
    messageColor: '#b45309',
  },
  info: {
    icon: 'info',
    accent: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    iconBg: '#dbeafe',
    titleColor: '#1e40af',
    messageColor: '#1d4ed8',
  },
};

export const AppBanner: React.FC<AppBannerProps> = ({
  id,
  visible,
  type = 'info',
  position,
  title,
  subTitle,
  message,
  details,
  badges,
  buttons,
  autoCloseMs = 3800,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const hasMultipleButtons = Boolean(buttons && buttons.length > 1);
  const isCenter = position === 'center' || (position === undefined && hasMultipleButtons);

  // Animation values
  const translateY = useRef(new Animated.Value(-180)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDismissingRef = useRef(false);

  const theme = THEME_CONFIG[type] || THEME_CONFIG.info;

  // Auto-close: only when no multiple buttons and autoCloseMs > 0
  const shouldAutoClose = autoCloseMs > 0 && !hasMultipleButtons && !isCenter;

  useEffect(() => {
    if (visible) {
      isDismissingRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      translateY.setValue(-180);
      scaleAnim.setValue(0.88);
      opacity.setValue(0);
      backdropOpacity.setValue(0);
      progressAnim.setValue(1);

      if (isCenter) {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 45,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }

      if (shouldAutoClose) {
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: autoCloseMs,
          useNativeDriver: false,
        }).start();

        timerRef.current = setTimeout(() => {
          handleDismiss();
        }, autoCloseMs);
      }
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, id, isCenter, autoCloseMs, shouldAutoClose]);

  const handleDismiss = (callback?: () => void) => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const anims = isCenter
      ? [
          Animated.timing(scaleAnim, {
            toValue: 0.88,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]
      : [
          Animated.timing(translateY, {
            toValue: -180,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
        ];

    Animated.parallel(anims).start(() => {
      isDismissingRef.current = false;
      onClose();
      if (callback) {
        callback();
      }
    });
  };

  if (!visible) return null;

  // ─────────────────────────────────────────────
  // CENTER MODAL DIALOG MODE (Yes/No, Delete/Cancel, Confirmations)
  // ─────────────────────────────────────────────
  if (isCenter) {
    return (
      <View style={styles.centerOverlayContainer} pointerEvents="box-none">
        {/* Dimmed Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropOpacity },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => handleDismiss()}
          />
        </Animated.View>

        {/* Centered Modal Card */}
        <Animated.View
          style={[
            styles.centerModalCard,
            {
              transform: [{ scale: scaleAnim }],
              opacity,
              shadowColor: '#0f172a',
            },
          ]}
        >
          {/* Header Icon Circle */}
          <View style={[styles.centerIconCircle, { backgroundColor: theme.iconBg }]}>
            <Lucide name={theme.icon as any} size={28} color={theme.accent} />
          </View>

          {/* Close button at top right */}
          <TouchableOpacity
            style={styles.centerCloseBtn}
            onPress={() => handleDismiss()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Lucide name="x" size={17} color="#94a3b8" />
          </TouchableOpacity>

          {/* Title & Message */}
          <View style={styles.centerTextContent}>
            <Text style={styles.centerTitleText}>{title}</Text>

            {Boolean(subTitle) && (
              <Text style={styles.centerSubTitleText}>{subTitle}</Text>
            )}

            {Boolean(message) && (
              <Text style={styles.centerMessageText}>{message}</Text>
            )}

            {Boolean(details) && (
              <View style={styles.centerDetailsBox}>
                <Text style={styles.centerDetailsText}>{details}</Text>
              </View>
            )}
          </View>

          {/* Badges Row */}
          {badges && badges.length > 0 && (
            <View style={styles.centerBadgesRow}>
              {badges.map((badge, idx) => (
                <View
                  key={`badge-${idx}`}
                  style={[
                    styles.badgePill,
                    badge.bg ? { backgroundColor: badge.bg } : null,
                    badge.borderColor ? { borderColor: badge.borderColor, borderWidth: 1 } : null,
                  ]}
                >
                  {badge.icon && (
                    <Lucide
                      name={badge.icon as any}
                      size={11}
                      color={badge.color || theme.accent}
                    />
                  )}
                  <Text
                    style={[
                      styles.badgeText,
                      badge.color ? { color: badge.color } : { color: theme.titleColor },
                    ]}
                  >
                    {badge.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons Row */}
          {buttons && buttons.length > 0 && (
            <View style={[styles.centerButtonsRow, buttons.length === 2 && styles.centerButtonsTwo]}>
              {buttons.map((btn, index) => {
                const isCancel =
                  btn.style === 'cancel' ||
                  btn.text.toLowerCase() === 'no' ||
                  btn.text.toLowerCase() === 'cancel';
                const isDestructive =
                  btn.style === 'destructive' ||
                  btn.text.toLowerCase() === 'delete' ||
                  btn.text.toLowerCase() === 'remove';

                let btnBg = theme.accent;
                let textColor = '#ffffff';
                let borderColor = 'transparent';

                if (isCancel) {
                  btnBg = '#f1f5f9';
                  textColor = '#475569';
                  borderColor = '#e2e8f0';
                } else if (isDestructive) {
                  btnBg = '#ef4444';
                  textColor = '#ffffff';
                }

                return (
                  <TouchableOpacity
                    key={`btn-${index}`}
                    style={[
                      styles.centerActionBtn,
                      buttons.length === 2 && { flex: 1 },
                      { backgroundColor: btnBg, borderColor },
                    ]}
                    onPress={() => handleDismiss(btn.onPress)}
                    activeOpacity={0.8}
                  >
                    {isDestructive && (
                      <Lucide name="trash-2" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                    )}
                    <Text style={[styles.centerActionBtnText, { color: textColor }]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // TOP BANNER MODE (Toasts, Auto-closing notifications)
  // ─────────────────────────────────────────────
  return (
    <View
      style={[
        styles.topOverlayContainer,
        { paddingTop: Math.max(insets.top + 8, 16) },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.bannerCard,
          {
            backgroundColor: theme.bg,
            borderColor: theme.border,
            shadowColor: theme.accent,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        {/* Content Body */}
        <View style={styles.bodyRow}>
          {/* Icon Circle */}
          <View style={[styles.iconCircle, { backgroundColor: theme.iconBg }]}>
            <Lucide name={theme.icon as any} size={20} color={theme.accent} />
          </View>

          {/* Text Content */}
          <View style={styles.textColumn}>
            <Text style={[styles.titleText, { color: theme.titleColor }]} numberOfLines={2}>
              {title}
            </Text>
            {Boolean(subTitle) && (
              <Text style={styles.subTitleText} numberOfLines={1}>
                {subTitle}
              </Text>
            )}
            {Boolean(message) && (
              <Text style={[styles.messageText, { color: theme.messageColor }]}>
                {message}
              </Text>
            )}
            {Boolean(details) && (
              <Text style={styles.detailsText} numberOfLines={3}>
                {details}
              </Text>
            )}
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => handleDismiss()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Lucide name="x" size={16} color={theme.titleColor} />
          </TouchableOpacity>
        </View>

        {/* Badges Row */}
        {badges && badges.length > 0 && (
          <View style={styles.badgesRow}>
            {badges.map((badge, idx) => (
              <View
                key={`badge-${idx}`}
                style={[
                  styles.badgePill,
                  badge.bg ? { backgroundColor: badge.bg } : null,
                  badge.borderColor ? { borderColor: badge.borderColor, borderWidth: 1 } : null,
                ]}
              >
                {badge.icon && (
                  <Lucide
                    name={badge.icon as any}
                    size={11}
                    color={badge.color || theme.accent}
                  />
                )}
                <Text
                  style={[
                    styles.badgeText,
                    badge.color ? { color: badge.color } : { color: theme.titleColor },
                  ]}
                >
                  {badge.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons Row */}
        {buttons && buttons.length > 0 && (
          <View style={styles.buttonsRow}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              let btnBg = theme.accent;
              let textColor = '#ffffff';
              let borderColor = 'transparent';

              if (isCancel) {
                btnBg = '#ffffff';
                textColor = '#475569';
                borderColor = '#cbd5e1';
              } else if (isDestructive) {
                btnBg = '#ef4444';
                textColor = '#ffffff';
              }

              return (
                <TouchableOpacity
                  key={`btn-${index}`}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: btnBg, borderColor },
                    isCancel && styles.cancelActionBtn,
                  ]}
                  onPress={() => handleDismiss(btn.onPress)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionBtnText, { color: textColor }]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Progress Bar */}
        {shouldAutoClose && (
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: theme.accent,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  // ── CENTER MODAL STYLES ─────────────────────
  centerOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  centerModalCard: {
    width: Math.min(screenWidth - 40, 380),
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  centerCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  centerTextContent: {
    alignItems: 'center',
    width: '100%',
    gap: 6,
  },
  centerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  centerSubTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
    textAlign: 'center',
  },
  centerMessageText: {
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  centerDetailsBox: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  centerDetailsText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    textAlign: 'center',
  },
  centerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  centerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  centerButtonsTwo: {
    justifyContent: 'space-between',
  },
  centerActionBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  centerActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // ── TOP BANNER STYLES ───────────────────────
  topOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    paddingHorizontal: 12,
  },
  bannerCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  textColumn: {
    flex: 1,
    gap: 3,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  detailsText: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 8,
    marginLeft: 50,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  cancelActionBtn: {
    backgroundColor: '#ffffff',
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  progressBar: {
    height: '100%',
  },
});

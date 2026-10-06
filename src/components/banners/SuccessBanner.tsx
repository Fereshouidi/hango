import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SuccessBannerProps = {
  visible: boolean;
  title?: string;
  lessonTitle?: string;
  hskName?: string;
  itemCount?: number;
  details?: string;
  actionText?: string;
  autoCloseMs?: number;
  onClose: () => void;
  onAction?: () => void;
};

export const SuccessBanner = ({
  visible,
  title = 'Lesson Created!',
  lessonTitle,
  hskName,
  itemCount,
  details,
  actionText = 'Go to Lessons',
  autoCloseMs = 3500,
  onClose,
  onAction,
}: SuccessBannerProps) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Reset values
      translateY.setValue(-150);
      opacity.setValue(0);
      progressAnim.setValue(1);

      // Slide and fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate progress bar
      if (autoCloseMs > 0) {
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
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleAction = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onAction) onAction();
      else onClose();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: Math.max(insets.top, 14),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.card}>
        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View style={styles.iconContainer}>
            <Lucide name="check-check" size={20} color="#16a34a" />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.titleText}>{title}</Text>
            {lessonTitle ? (
              <Text style={styles.lessonTitleText} numberOfLines={1}>
                {lessonTitle}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Lucide name="x" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Badges Row */}
        <View style={styles.badgesRow}>
          {hskName && (
            <View style={styles.hskBadge}>
              <Lucide name="book-open" size={11} color="#2563eb" />
              <Text style={styles.hskBadgeText}>{hskName}</Text>
            </View>
          )}

          {itemCount !== undefined && itemCount > 0 && (
            <View style={styles.itemsBadge}>
              <Lucide name="layers" size={11} color="#16a34a" />
              <Text style={styles.itemsBadgeText}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'} included
              </Text>
            </View>
          )}
        </View>

        {/* Details Text */}
        {details ? (
          <Text style={styles.detailsText} numberOfLines={2}>
            {details}
          </Text>
        ) : null}

        {/* Action Button Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAction}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>{actionText}</Text>
            <Lucide name="arrow-right" size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Progress Countdown Bar */}
        {autoCloseMs > 0 && (
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#22c55e35',
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  lessonTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  hskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  hskBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  itemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  itemsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  detailsText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    marginTop: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SidebarItem = {
  id: string;
  label: string;
  chineseLabel: string;
  icon: string;
  color: string;
  target: string;
  description: string;
};

export const sidebarItems: SidebarItem[] = [
  {
    id: 'hsks',
    label: 'HSKs',
    chineseLabel: '汉语水平考试',
    icon: 'book-open',
    color: '#ef4444',
    target: '/pages/hsks/[id]',
    description: 'Proficiency levels 1 to 6',
  },
  {
    id: 'lessons',
    label: 'Lessons',
    chineseLabel: '课程',
    icon: 'book-marked',
    color: '#f59e0b',
    target: '/pages/lessons/[id]',
    description: 'Structured course lessons',
  },
  {
    id: 'texts',
    label: 'Texts',
    chineseLabel: '课文',
    icon: 'file-text',
    color: '#3b82f6',
    target: '/pages/texts',
    description: 'Reading passages & dialogues',
  },
  {
    id: 'sentences',
    label: 'Sentences',
    chineseLabel: '句子',
    icon: 'message-square-text',
    color: '#8b5cf6',
    target: '/pages/sentences',
    description: 'Grammar & example sentences',
  },
  {
    id: 'words',
    label: 'Words',
    chineseLabel: '生词',
    icon: 'languages',
    color: '#10b981',
    target: '/pages/words',
    description: 'Vocabulary & translations',
  },
  {
    id: 'characters',
    label: 'Characters',
    chineseLabel: '汉字',
    icon: 'spell-check',
    color: '#ec489a',
    target: '/pages/characters',
    description: 'Strokes, tones & radicals',
  },
  {
    id: 'rules',
    label: 'Rules',
    chineseLabel: '语法',
    icon: 'graduation-cap',
    color: '#6366f1',
    target: '/pages/rules',
    description: 'Grammar points & guides',
  },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  children?: React.ReactNode;
};

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 320);

export const Sidebar = ({ isOpen, onClose, onOpen, children }: SidebarProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Programmatic opening / closing handler
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 24,
          stiffness: 240,
          mass: 0.5,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleFinishGesture = (gestureState: any) => {
    const vx = gestureState?.vx ? Math.max(-2, Math.min(2, gestureState.vx * 0.8)) : 0;

    if (!isOpenRef.current) {
      // Pulling open from closed state
      if (gestureState.dx > 20 || gestureState.vx > 0.02) {
        if (onOpen) onOpen();
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            velocity: vx,
            damping: 24,
            stiffness: 240,
            mass: 0.5,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 0.5,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Cancel pull and hide
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -DRAWER_WIDTH,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
        });
      }
    } else {
      // Open state: dragging left to close
      if (gestureState.dx < -20 || gestureState.vx < -0.02) {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -DRAWER_WIDTH,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
        });
      } else {
        // Snap back open fully
        if (onOpen) onOpen();
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            velocity: vx,
            damping: 24,
            stiffness: 240,
            mass: 0.5,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 0.5,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  // PanResponder for Edge Pull & Swipe Dismissal
  const panResponder = useRef(
    PanResponder.create({
      // CAPTURE PHASE: Capture horizontal right swipes from left/middle screen region
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (!isOpenRef.current) {
          const screenW = Dimensions.get('window').width;
          const x = evt.nativeEvent.pageX ?? evt.nativeEvent.locationX;
          const isHorizontalRightSwipe =
            gestureState.dx > 3 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.1;

          return x <= screenW * 0.7 && isHorizontalRightSwipe;
        }
        return false;
      },
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!isOpenRef.current) {
          const screenW = Dimensions.get('window').width;
          const x = evt.nativeEvent.pageX ?? evt.nativeEvent.locationX;
          const isHorizontalRightSwipe =
            gestureState.dx > 3 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.1;

          return x <= screenW * 0.7 && isHorizontalRightSwipe;
        }
        return Math.abs(gestureState.dx) > 3;
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: (evt, gestureState) => {
        if (!isOpenRef.current) {
          // Pulling open from left edge
          const currentX = Math.min(0, -DRAWER_WIDTH + Math.max(0, gestureState.dx));
          translateX.setValue(currentX);

          const progress = Math.max(0, Math.min(1, gestureState.dx / DRAWER_WIDTH));
          overlayOpacity.setValue(progress * 0.5);
        } else {
          // Dragging closed towards left
          if (gestureState.dx < 0) {
            const currentX = Math.max(-DRAWER_WIDTH, gestureState.dx);
            translateX.setValue(currentX);

            const progress = Math.max(0, Math.min(1, 1 + gestureState.dx / DRAWER_WIDTH));
            overlayOpacity.setValue(progress * 0.5);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        handleFinishGesture(gestureState);
      },
      onPanResponderTerminate: (evt, gestureState) => {
        handleFinishGesture(gestureState);
      },
    })
  ).current;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleNavigate = (item: SidebarItem) => {
    handleClose();
    setTimeout(() => {
      try {
        if (item.id === 'hsks') {
          router.push('/pages/hsks/[id]' as any);
        } else if (item.id === 'lessons') {
          router.push('/pages/lessons/[id]' as any);
        } else {
          router.push(item.target as any);
        }
      } catch (e) {
        Alert.alert(item.label, `${item.label} section will be available soon!`);
      }
    }, 200);
  };

  const handleGoHome = () => {
    handleClose();
    setTimeout(() => {
      router.push('/' as any);
    }, 200);
  };

  return (
    <View style={styles.rootContainer} {...panResponder.panHandlers}>
      {children}

      <View
        style={styles.overlayContainer}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
      {/* Backdrop Overlay */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: overlayOpacity,
            pointerEvents: isOpen ? 'auto' : 'none',
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Sliding Drawer Body */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Header Brand */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoChar}>汉</Text>
            </View>
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandName}>HanGo</Text>
              <Text style={styles.brandSubtitle}>Chinese Learning</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Lucide name="x" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Section Divider */}
        <View style={styles.divider} />

        {/* Navigation Items */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>NAVIGATION</Text>

          {sidebarItems.map((item) => {
            const isActive = pathname.includes(item.id);

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navItem,
                  isActive && styles.navItemActive,
                ]}
                onPress={() => handleNavigate(item)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: item.color + '18' },
                    isActive && { backgroundColor: item.color },
                  ]}
                >
                  <Lucide
                    name={item.icon as any}
                    size={18}
                    color={isActive ? '#ffffff' : item.color}
                  />
                </View>

                <View style={styles.itemTextContainer}>
                  <View style={styles.itemTitleRow}>
                    <Text
                      style={[
                        styles.itemTitle,
                        isActive && { color: item.color, fontWeight: '700' },
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.chineseLabelText}>
                      {item.chineseLabel}
                    </Text>
                  </View>
                  <Text style={styles.itemDescription} numberOfLines={1}>
                    {item.description}
                  </Text>
                </View>

                <Lucide
                  name="chevron-right"
                  size={16}
                  color={isActive ? item.color : '#cbd5e1'}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer with Home Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={handleGoHome}
            activeOpacity={0.7}
          >
            <Lucide name="house" size={17} color="#2563eb" />
            <Text style={styles.homeBtnText}>Home Dashboard</Text>
          </TouchableOpacity>

        </View>
      </Animated.View>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  drawer: {
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 99999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoChar: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  brandTextContainer: {
    gap: 1,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 10,
  },
  navItemActive: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextContainer: {
    flex: 1,
    gap: 2,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  chineseLabelText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 11,
    color: '#64748b',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  homeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  versionText: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

import React, { useEffect, useRef } from 'react';
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
  badge?: string;
  description?: string;
};

export type SidebarSection = {
  id: string;
  title: string;
  chineseTitle: string;
  items: SidebarItem[];
};

export const sidebarSections: SidebarSection[] = [
  {
    id: 'curriculum',
    title: 'CURRICULUM',
    chineseTitle: '课程学习',
    items: [
      {
        id: 'hsks',
        label: 'HSK Levels',
        chineseLabel: '汉语水平',
        icon: 'book-marked',
        color: '#ef4444',
        target: '/pages/hsks/[id]',
      },
      {
        id: 'lessons',
        label: 'Lessons',
        chineseLabel: '课程单元',
        icon: 'book-open',
        color: '#f59e0b',
        target: '/pages/lessons/[id]',
      },
      {
        id: 'texts',
        label: 'Reading Texts',
        chineseLabel: '课文朗读',
        icon: 'file-text',
        color: '#3b82f6',
        target: '/pages/texts',
      },
      {
        id: 'sentences',
        label: 'Sentences',
        chineseLabel: '重点例句',
        icon: 'message-square-text',
        color: '#8b5cf6',
        target: '/pages/sentences',
      },
      {
        id: 'words',
        label: 'Words',
        chineseLabel: '生词词汇',
        icon: 'languages',
        color: '#10b981',
        target: '/pages/words',
      },
      {
        id: 'characters',
        label: 'Characters',
        chineseLabel: '汉字部首',
        icon: 'spell-check',
        color: '#ec489a',
        target: '/pages/characters',
      },
      {
        id: 'rules',
        label: 'Grammar Rules',
        chineseLabel: '语法规则',
        icon: 'graduation-cap',
        color: '#6366f1',
        target: '/pages/rules',
      },
    ],
  },
  {
    id: 'practice',
    title: 'PRACTICE',
    chineseTitle: '综合练习',
    items: [
      {
        id: 'listeningLoop',
        label: 'Listening Loop',
        chineseLabel: '听力跟读',
        icon: 'headphones',
        color: '#ec4899',
        target: '/pages/listeningLoop',
        badge: 'Loop',
      },
      {
        id: 'characterWrite',
        label: 'Write Characters',
        chineseLabel: '写字描红',
        icon: 'pencil-line',
        color: '#0284c7',
        target: '/pages/characterWrite',
        badge: 'Canvas',
      },
      {
        id: 'writing',
        label: 'Writing Studio',
        chineseLabel: '中文写作',
        icon: 'keyboard',
        color: '#8b5cf6',
        target: '/pages/writing',
      },
    ],
  },
  {
    id: 'system',
    title: 'ACCOUNT & HELP',
    chineseTitle: '账号与帮助',
    items: [
      {
        id: 'sync',
        label: 'My Account',
        chineseLabel: '云端同步',
        icon: 'cloud',
        color: '#7c3aed',
        target: '/pages/sync',
        badge: 'Cloud',
      },
      {
        id: 'instructions',
        label: 'Instructions',
        chineseLabel: '使用指南',
        icon: 'circle-help',
        color: '#059669',
        target: '/pages/instructions',
      },
    ],
  },
];

// Flat export for backwards compatibility
export const sidebarItems: SidebarItem[] = sidebarSections.flatMap((s) => s.items);

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  children?: React.ReactNode;
};

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 310);

export const Sidebar = ({ isOpen, onClose, onOpen, children }: SidebarProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

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
          damping: 26,
          stiffness: 260,
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
            damping: 26,
            stiffness: 260,
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
            damping: 26,
            stiffness: 260,
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
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (!isOpenRef.current) {
          if (pathnameRef.current?.includes('characterWrite')) {
            return false;
          }

          const screenW = Dimensions.get('window').width;
          const edgeThreshold = screenW * 0.20;
          const startX =
            gestureState.x0 !== undefined && gestureState.x0 !== null && gestureState.x0 > 0
              ? gestureState.x0
              : (evt.nativeEvent.pageX ?? evt.nativeEvent.locationX);

          const isHorizontalRightSwipe =
            gestureState.dx > 12 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.3;

          return startX <= edgeThreshold && isHorizontalRightSwipe;
        }
        return false;
      },
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!isOpenRef.current) {
          if (pathnameRef.current?.includes('characterWrite')) {
            return false;
          }

          const screenW = Dimensions.get('window').width;
          const edgeThreshold = screenW * 0.20;
          const startX =
            gestureState.x0 !== undefined && gestureState.x0 !== null && gestureState.x0 > 0
              ? gestureState.x0
              : (evt.nativeEvent.pageX ?? evt.nativeEvent.locationX);

          const isHorizontalRightSwipe =
            gestureState.dx > 12 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.3;

          return startX <= edgeThreshold && isHorizontalRightSwipe;
        }
        return Math.abs(gestureState.dx) > 6;
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: (evt, gestureState) => {
        if (!isOpenRef.current) {
          const currentX = Math.min(0, -DRAWER_WIDTH + Math.max(0, gestureState.dx));
          translateX.setValue(currentX);

          const progress = Math.max(0, Math.min(1, gestureState.dx / DRAWER_WIDTH));
          overlayOpacity.setValue(progress * 0.5);
        } else {
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
        duration: 190,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 170,
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
    }, 180);
  };

  const handleGoHome = () => {
    handleClose();
    setTimeout(() => {
      router.push('/' as any);
    }, 180);
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
              paddingTop: Math.max(insets.top, 14),
              paddingBottom: Math.max(insets.bottom, 12),
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
              <Lucide name="x" size={17} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Section Divider */}
          <View style={styles.divider} />

          {/* Navigation Items Organized by Section */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {sidebarSections.map((section, sIndex) => (
              <View key={section.id} style={[styles.sectionBlock, sIndex > 0 && styles.sectionBlockMargin]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>{section.title}</Text>
                  <Text style={styles.sectionChineseLabel}>{section.chineseTitle}</Text>
                </View>

                {section.items.map((item) => {
                  const isActive = pathname.includes(item.id);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.navItem,
                        isActive && styles.navItemActive,
                      ]}
                      onPress={() => handleNavigate(item)}
                      activeOpacity={0.65}
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
                          size={16}
                          color={isActive ? '#ffffff' : item.color}
                        />
                      </View>

                      <View style={styles.itemTextContainer}>
                        <Text
                          style={[
                            styles.itemTitle,
                            isActive && { color: item.color, fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        <Text style={styles.chineseLabelText}>
                          {item.chineseLabel}
                        </Text>
                      </View>

                      {item.badge && (
                        <View style={[styles.itemBadge, { backgroundColor: item.color + '15' }]}>
                          <Text style={[styles.itemBadgeText, { color: item.color }]}>
                            {item.badge}
                          </Text>
                        </View>
                      )}

                      <Lucide
                        name="chevron-right"
                        size={14}
                        color={isActive ? item.color : '#cbd5e1'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* Clean Footer with Home Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={handleGoHome}
              activeOpacity={0.7}
            >
              <View style={styles.homeBtnLeft}>
                <View style={styles.homeIconBox}>
                  <Lucide name="home" size={16} color="#2563eb" />
                </View>
                <Text style={styles.homeBtnText}>Home Dashboard</Text>
              </View>
              <Lucide name="chevron-right" size={15} color="#94a3b8" />
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
    shadowColor: '#0f172a',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 16,
    zIndex: 99999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  logoChar: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
  },
  brandTextContainer: {
    gap: 1,
  },
  brandName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.2,
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 14,
    marginVertical: 4,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  sectionBlock: {
    gap: 2,
  },
  sectionBlockMargin: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  sectionChineseLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#cbd5e1',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 9,
  },
  navItemActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1e293b',
  },
  chineseLabelText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  itemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginRight: 2,
  },
  itemBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 2,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  homeBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  homeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
});

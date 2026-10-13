import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { useSidebar } from '@/context/sidebar-context';

type Props = {
  useBackArrow?: boolean;
  showMenu?: boolean;
  label?: string;
  subtitle?: string;
  items?: React.ReactNode[];
  onBack?: () => void;
};

const Header = ({
  useBackArrow = true,
  showMenu = false,
  label,
  subtitle,
  items,
  onBack,
}: Props) => {
  const router = useRouter();
  const { openSidebar } = useSidebar();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* Left Action (Back or Menu) */}
      <View style={styles.leftContainer}>
        {(useBackArrow || Boolean(onBack)) && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.navButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Lucide name={onBack ? 'x' : 'arrow-left'} size={19} color="#1e293b" />
          </TouchableOpacity>
        )}

        {!useBackArrow && !onBack && showMenu && (
          <TouchableOpacity
            onPress={openSidebar}
            style={styles.navButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Lucide name="menu" size={19} color="#1e293b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Center Title & Optional Subtitle */}
      <View style={styles.centerContainer} pointerEvents="box-none">
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right Actions */}
      <View style={styles.rightContainer}>
        {items?.map((item, index) => (
          <View key={index} style={styles.itemWrapper}>
            {item}
          </View>
        ))}
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    height: 58,
    width: '100%',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 100,
  },
  leftContainer: {
    minWidth: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
    textAlign: 'center',
  },
  rightContainer: {
    minWidth: 42,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    zIndex: 2,
  },
  itemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

interface ViewAllButtonProps {
  count: number;
  label: string;
  accentColor?: string;
  onPress: () => void;
}

export const ViewAllButton: React.FC<ViewAllButtonProps> = ({
  count,
  label,
  accentColor = '#2563eb',
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: accentColor + '33', backgroundColor: accentColor + '0d' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.text, { color: accentColor }]}>
          View All {count} {label}
        </Text>
        <Lucide name="arrow-right" size={16} color={accentColor} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});

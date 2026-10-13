import Lucide from '@react-native-vector-icons/lucide';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScopeToggleProps {
  searchScope: 'linked' | 'global';
  onSelectScope: (scope: 'linked' | 'global') => void;
  accentColor?: string;
  linkedTotalCount: number;
  globalTotalCount?: number;
}

export const ScopeToggle: React.FC<ScopeToggleProps> = ({
  searchScope,
  onSelectScope,
  accentColor = '#2563eb',
  linkedTotalCount,
  globalTotalCount,
}) => {
  return (
    <View style={styles.scopeToggleContainer}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectScope('linked')}
        style={[
          styles.scopeTab,
          searchScope === 'linked' && { backgroundColor: accentColor },
        ]}
      >
        <Lucide
          name="link-2"
          size={14}
          color={searchScope === 'linked' ? '#ffffff' : '#64748b'}
        />
        <Text
          style={[
            styles.scopeTabText,
            searchScope === 'linked' && styles.scopeTabTextActive,
          ]}
        >
          Linked Content ({linkedTotalCount})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectScope('global')}
        style={[
          styles.scopeTab,
          searchScope === 'global' && { backgroundColor: accentColor },
        ]}
      >
        <Lucide
          name="globe"
          size={14}
          color={searchScope === 'global' ? '#ffffff' : '#64748b'}
        />
        <Text
          style={[
            styles.scopeTabText,
            searchScope === 'global' && styles.scopeTabTextActive,
          ]}
        >
          wide search{globalTotalCount !== undefined ? ` (${globalTotalCount})` : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  scopeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffffcc',
    borderRadius: 12,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6,
  },
  scopeTab: {
    backgroundColor: "transparent",
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9,
  },
  scopeTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748b',
  },
  scopeTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

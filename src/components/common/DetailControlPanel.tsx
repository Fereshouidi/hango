import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SearchBar } from './SearchBar';
import { ScopeToggle } from './ScopeToggle';
import { CategoryTabs, CategoryTabType } from './CategoryTabs';

export interface DetailControlPanelProps {
  // Search Bar
  searchQuery: string;
  onSearchChange: (text: string) => void;
  searchPlaceholder?: string;
  // Scope Toggle (optional)
  searchScope?: 'linked' | 'global';
  onSelectScope?: (scope: 'linked' | 'global') => void;
  accentColor?: string;
  linkedTotalCount?: number;
  globalTotalCount?: number;
  // Tab Switcher
  activeTab: CategoryTabType;
  onSelectTab: (tab: CategoryTabType) => void;
  counts?: {
    lessons?: number;
    texts?: number;
    sentences?: number;
    words?: number;
    characters?: number;
    rules?: number;
  };
}

export const DetailControlPanel: React.FC<DetailControlPanelProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search content...',
  searchScope,
  onSelectScope,
  accentColor = '#2563eb',
  linkedTotalCount = 0,
  globalTotalCount,
  activeTab,
  onSelectTab,
  counts,
}) => {
  const hasScopeToggle = searchScope !== undefined && onSelectScope !== undefined;

  return (
    <View style={styles.container}>
      {/* Row 1: Search Bar */}
      <View style={styles.searchRow}>
        <SearchBar
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
        />
      </View>

      {/* Row 2: Scope Toggle (Linked vs Global) */}
      {hasScopeToggle && (
        <View style={styles.scopeRow}>
          <ScopeToggle
            searchScope={searchScope}
            onSelectScope={onSelectScope}
            accentColor={accentColor}
            linkedTotalCount={linkedTotalCount}
            globalTotalCount={globalTotalCount}
          />
        </View>
      )}

      {/* Subtle Divider */}
      <View style={styles.divider} />

      {/* Row 3: Tab Switcher (CategoryTabs) */}
      <View style={styles.tabsRow}>
        <CategoryTabs
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          counts={counts}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffffe2',
    borderRadius: 16,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    // marginTop: 6,
    // marginBottom: 4,
  },
  searchRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  scopeRow: {
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9e1',
    marginHorizontal: 2,
  },
  tabsRow: {
    width: '100%',
  },
});

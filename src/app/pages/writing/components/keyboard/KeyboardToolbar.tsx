import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { KeyboardTab } from '../../types';

interface KeyboardToolbarProps {
  activeTab: KeyboardTab;
  onSelectTab: (tab: KeyboardTab) => void;
  hidePinyin: boolean;
  onToggleHidePinyin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  keyboardTotal?: number;
  loadedCount?: number;
  isDictation?: boolean;
}

export const KeyboardToolbar: React.FC<KeyboardToolbarProps> = ({
  activeTab,
  onSelectTab,
  hidePinyin,
  onToggleHidePinyin,
  searchQuery,
  onSearchChange,
  keyboardTotal = 0,
  loadedCount = 0,
  isDictation = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Top row: Mode tabs & Show/Hide Pinyin toggle */}
      <View style={styles.topRow}>
        <View style={styles.tabsWrapper}>
          {(['hanzi', 'pinyin', 'punct', 'numbers'] as const).map((tab) => {
            const labels: Record<KeyboardTab, string> = {
              hanzi: '汉字',
              pinyin: '拼音',
              punct: '标点',
              numbers: '数字',
            };
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => onSelectTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hide / Show Pinyin Toggle Button */}
        <TouchableOpacity
          style={[styles.pinyinToggleBtn, hidePinyin && styles.pinyinToggleBtnHidden]}
          onPress={onToggleHidePinyin}
          activeOpacity={0.7}
        >
          <Lucide
            name={hidePinyin ? 'eye-off' : 'eye'}
            size={12}
            color={hidePinyin ? '#dc2626' : '#8b5cf6'}
          />
          <Text
            style={[
              styles.pinyinToggleText,
              hidePinyin && styles.pinyinToggleTextHidden,
            ]}
          >
            {hidePinyin ? 'Pinyin Off' : 'Pinyin On'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Middle row: Informative Character Count Badge */}
      {activeTab === 'hanzi' && (
        <View style={styles.countBadgeRow}>
          {isDictation ? (
            <View style={[styles.countBadge, styles.countBadgeDictation]}>
              <Lucide name="sparkles" size={11} color="#d97706" />
              <Text style={styles.countBadgeTextDictation}>
                Dictation Pool: {loadedCount} characters (target sentence + extra distractors)
              </Text>
            </View>
          ) : (
            <View style={styles.countBadge}>
              <Lucide name="layers" size={11} color="#8b5cf6" />
              <Text style={styles.countBadgeText}>
                {searchQuery.trim().length > 0
                  ? `Showing ${loadedCount} of ${keyboardTotal} characters`
                  : `Total: ${keyboardTotal} characters (${loadedCount} loaded)`}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Search Bar - active when browsing Hanzi (in free write mode) */}
      {activeTab === 'hanzi' && !isDictation && (
        <View style={styles.searchBarWrapper}>
          <Lucide name="search" size={13} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pinyin, hanzi, or meaning..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Lucide name="x-circle" size={13} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 5,
    paddingBottom: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  tabsWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#8b5cf6',
    fontWeight: '700',
  },
  pinyinToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  pinyinToggleBtnHidden: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  pinyinToggleText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  pinyinToggleTextHidden: {
    color: '#dc2626',
  },
  countBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  countBadgeDictation: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  countBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
  },
  countBadgeTextDictation: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#b45309',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
    padding: 0,
  },
});

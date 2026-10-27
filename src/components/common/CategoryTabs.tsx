import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { CharacterIcon } from '@/components/common/CharacterIcon';

export type CategoryTabType = 'all' | 'lessons' | 'texts' | 'sentences' | 'words' | 'characters' | 'rules';

interface CategoryTabsProps {
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

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeTab,
  onSelectTab,
  counts,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsScroll}
    >
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
        onPress={() => onSelectTab('all')}
      >
        <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All Items</Text>
      </TouchableOpacity>

      {counts?.lessons !== undefined && (
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'lessons' && styles.tabBtnActive]}
          onPress={() => onSelectTab('lessons')}
        >
          <Lucide name="book-open" size={14} color={activeTab === 'lessons' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'lessons' && styles.tabTextActive]}>
            Lessons ({counts.lessons})
          </Text>
        </TouchableOpacity>
      )}

      {counts?.texts !== undefined && (
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'texts' && styles.tabBtnActive]}
          onPress={() => onSelectTab('texts')}
        >
          <Lucide name="file-text" size={14} color={activeTab === 'texts' ? '#3b82f6' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'texts' && styles.tabTextActive]}>
            Texts ({counts.texts})
          </Text>
        </TouchableOpacity>
      )}

      {counts?.sentences !== undefined && (
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'sentences' && styles.tabBtnActive]}
          onPress={() => onSelectTab('sentences')}
        >
          <Lucide name="message-square-text" size={14} color={activeTab === 'sentences' ? '#8b5cf6' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'sentences' && styles.tabTextActive]}>
            Sentences ({counts.sentences})
          </Text>
        </TouchableOpacity>
      )}

      {counts?.words !== undefined && (
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'words' && styles.tabBtnActive]}
          onPress={() => onSelectTab('words')}
        >
          <Lucide name="languages" size={14} color={activeTab === 'words' ? '#059669' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'words' && styles.tabTextActive]}>
            Words ({counts.words})
          </Text>
        </TouchableOpacity>
      )}

      {counts?.characters !== undefined && (
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'characters' && styles.tabBtnActive]}
          onPress={() => onSelectTab('characters')}
        >
          <CharacterIcon size={14} color={activeTab === 'characters' ? '#ec4899' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'characters' && styles.tabTextActive]}>
            Hanzi ({counts.characters})
          </Text>
        </TouchableOpacity>
      )}

      {counts?.rules !== undefined && (
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'rules' && styles.tabBtnActive]}
          onPress={() => onSelectTab('rules')}
        >
          <Lucide name="book-open-check" size={14} color={activeTab === 'rules' ? '#d97706' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'rules' && styles.tabTextActive]}>
            Rules ({counts.rules})
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabsScroll: {
    gap: 5,
    paddingVertical: 0,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffffffa9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtnActive: {
    backgroundColor: '#f8fafcd3',
    borderColor: '#0284c7',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
});

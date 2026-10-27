import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { CharacterIcon } from '@/components/common/CharacterIcon';
import { useRouter } from 'expo-router';

export type EmptyStateType =
  | 'characters'
  | 'words'
  | 'texts'
  | 'sentences'
  | 'rules'
  | 'lessons'
  | 'hsks'
  | 'generic';

interface EntityMeta {
  icon: string;
  accent: string;
  single: string;
  plural: string;
  addRoute?: string;
  defaultDesc: string;
}

const ENTITY_CONFIG: Record<EmptyStateType, EntityMeta> = {
  characters: {
    icon: 'chinese-character',
    accent: '#ec4899',
    single: 'Character',
    plural: 'characters',
    addRoute: '/pages/addCharacter',
    defaultDesc: 'Build your character library with stroke orders, pinyin, and definitions.',
  },
  words: {
    icon: 'languages',
    accent: '#059669',
    single: 'Word',
    plural: 'words',
    addRoute: '/pages/addWord',
    defaultDesc: 'Expand your vocabulary bank with new Chinese words, pinyin, and English meanings.',
  },
  texts: {
    icon: 'file-text',
    accent: '#3b82f6',
    single: 'Text',
    plural: 'reading texts',
    addRoute: '/pages/addText',
    defaultDesc: 'Create reading passages and dialogues to practice reading comprehension in context.',
  },
  sentences: {
    icon: 'message-square-text',
    accent: '#8b5cf6',
    single: 'Sentence',
    plural: 'sentences',
    addRoute: '/pages/addSentence',
    defaultDesc: 'Save example sentences and conversations to master natural grammar and flow.',
  },
  rules: {
    icon: 'book-open-check',
    accent: '#f59e0b',
    single: 'Rule',
    plural: 'grammar rules',
    addRoute: '/pages/addRule',
    defaultDesc: 'Track important grammar structures, sentence patterns, and usage notes.',
  },
  lessons: {
    icon: 'graduation-cap',
    accent: '#6366f1',
    single: 'Lesson',
    plural: 'lessons',
    addRoute: '/pages/addLesson',
    defaultDesc: 'Organize your vocabulary, texts, and sentences into structured study lessons.',
  },
  hsks: {
    icon: 'award',
    accent: '#0ea5e9',
    single: 'HSK Level',
    plural: 'HSK levels',
    addRoute: '/pages/addHSK',
    defaultDesc: 'Organize your Chinese learning goals by standard HSK proficiency levels.',
  },
  generic: {
    icon: 'inbox',
    accent: '#64748b',
    single: 'Item',
    plural: 'items',
    defaultDesc: 'Nothing to display here yet.',
  },
};

export interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: string;
  accentColor?: string;
  itemLabel?: string;
  singleLabel?: string;
  searchQuery?: string;
  onClearSearch?: () => void;
  filterLabel?: string;
  onClearFilter?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  customTitle?: string;
  customDescription?: string;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  icon,
  accentColor,
  itemLabel,
  singleLabel,
  searchQuery,
  onClearSearch,
  filterLabel,
  onClearFilter,
  onAction,
  actionLabel,
  customTitle,
  customDescription,
  style,
}) => {
  const router = useRouter();
  const config = ENTITY_CONFIG[type] || ENTITY_CONFIG.generic;

  const accent = accentColor || config.accent;
  const displayIcon = icon || (searchQuery ? 'search-x' : filterLabel ? 'filter-x' : config.icon);
  const single = singleLabel || config.single;
  const plural = itemLabel || config.plural;

  const isSearchActive = Boolean(searchQuery && searchQuery.trim().length > 0);
  const isFilterActive = Boolean(filterLabel && filterLabel.trim().length > 0);

  // Compute title
  let title = customTitle;
  if (!title) {
    if (isSearchActive) {
      title = 'No matches found';
    } else if (isFilterActive) {
      title = `No ${plural} for ${filterLabel}`;
    } else {
      title = `No ${plural} yet`;
    }
  }

  // Compute description
  let description = customDescription;
  if (!description) {
    if (isSearchActive) {
      description = `We couldn't find any ${plural} matching "${searchQuery}". Try checking the spelling, pinyin, or English translation.`;
    } else if (isFilterActive) {
      description = `No ${plural} are currently linked to ${filterLabel}. You can clear this filter to view all items or add new ones.`;
    } else {
      description = config.defaultDesc;
    }
  }

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (config.addRoute) {
      router.push(config.addRoute as any);
    }
  };

  const finalActionLabel = actionLabel || `Add ${single}`;

  return (
    <View style={[styles.container, style]}>
      {/* Visual Layered Halo & Glass Icon Badge */}
      <View style={[styles.outerHalo, { backgroundColor: accent + '14' }]}>
        <View
          style={[
            styles.innerBadge,
            { backgroundColor: accent + '22', borderColor: accent + '40' },
          ]}
        >
          {displayIcon === 'chinese-character' || displayIcon === 'spell-check' ? (
            <CharacterIcon size={30} color={accent} />
          ) : (
            <Lucide name={displayIcon as any} size={30} color={accent} />
          )}
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {isSearchActive && onClearSearch && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={onClearSearch}
            activeOpacity={0.7}
          >
            <Lucide name="x" size={14} color="#475569" />
            <Text style={styles.clearBtnText}>Clear Search</Text>
          </TouchableOpacity>
        )}

        {isFilterActive && onClearFilter && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={onClearFilter}
            activeOpacity={0.7}
          >
            <Lucide name="filter" size={14} color="#475569" />
            <Text style={styles.clearBtnText}>View All {plural}</Text>
          </TouchableOpacity>
        )}

        {/* Primary Action Button (Add item) */}
        {(onAction || config.addRoute) && (
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: accent, shadowColor: accent },
            ]}
            onPress={handleAction}
            activeOpacity={0.8}
          >
            <Lucide name="plus" size={16} color="#ffffff" />
            <Text style={styles.primaryBtnText}>{finalActionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Helpful Hint Pill */}
      {/* {!isSearchActive && !isFilterActive && (
        <View style={styles.hintPill}>
          <Lucide name="sparkles" size={12} color="#94a3b8" />
          <Text style={styles.hintText}>
            Tip: Items added here will be available across learning tools
          </Text>
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor: "#ffffffe6",
    borderRadius: 20,
    width: '100%',
    height: "100%",
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerHalo: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  innerBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  clearBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginTop: 22,
  },
  hintText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
});

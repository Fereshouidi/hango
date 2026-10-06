import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import {
  getAllRules,
  getRulesByCharacterId,
  getRulesByHSKId,
  getRulesByLessonId,
  getRulesBySentenceId,
  getRulesByTextId,
  getRulesByWordId,
} from '@/db/utils';
import { RuleType } from '@/types';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { randomColors } from '@/constants/theme';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { RuleCard } from '@/components/cards/RuleCard';
import { SearchBar } from '@/components/common/SearchBar';

export default function RulesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    hskId?: string;
    lessonId?: string;
    textId?: string;
    sentenceId?: string;
    wordId?: string;
    characterId?: string;
    caracterid?: string;
    ruleId?: string;
  }>();

  const parseNum = (val?: string) => (val && !isNaN(Number(val)) ? Number(val) : 0);

  const hskId = parseNum(params.hskId);
  const lessonId = parseNum(params.lessonId);
  const textId = parseNum(params.textId);
  const sentenceId = parseNum(params.sentenceId);
  const wordId = parseNum(params.wordId);
  const characterId = parseNum(params.characterId || params.caracterid);
  const ruleId = parseNum(params.ruleId);
  const genericId = parseNum(params.id);

  const [rules, setRules] = useState<RuleType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<number | null>(null);

  const getFilterBadgeLabel = (): string | null => {
    if (hskId > 0) return `HSK Level ${hskId}`;
    if (lessonId > 0) return `Lesson ${lessonId}`;
    if (textId > 0) return `Text ${textId}`;
    if (sentenceId > 0) return `Sentence ${sentenceId}`;
    if (wordId > 0) return `Word ${wordId}`;
    if (characterId > 0) return `Character ${characterId}`;
    if (ruleId > 0) return `Rule ${ruleId}`;
    if (genericId > 0) return `ID ${genericId}`;
    return null;
  };

  const activeFilterLabel = getFilterBadgeLabel();

  const loadData = useCallback(() => {
    try {
      let data: RuleType[] = [];

      if (hskId > 0) {
        data = getRulesByHSKId(hskId) as unknown as RuleType[];
      } else if (lessonId > 0) {
        data = getRulesByLessonId(lessonId) as unknown as RuleType[];
      } else if (textId > 0) {
        data = getRulesByTextId(textId) as unknown as RuleType[];
      } else if (sentenceId > 0) {
        data = getRulesBySentenceId(sentenceId) as unknown as RuleType[];
      } else if (wordId > 0) {
        data = getRulesByWordId(wordId) as unknown as RuleType[];
      } else if (characterId > 0) {
        data = getRulesByCharacterId(characterId) as unknown as RuleType[];
      } else if (genericId > 0) {
        data = getRulesByLessonId(genericId) as unknown as RuleType[];
        if (!data || data.length === 0) {
          data = getRulesByHSKId(genericId) as unknown as RuleType[];
        }
      } else {
        data = getAllRules() as unknown as RuleType[];
      }

      setRules(data || []);
    } catch (e) {
      console.error('Failed to load rules:', e);
    }
  }, [hskId, lessonId, textId, sentenceId, wordId, characterId, genericId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, [loadData]);

  const q = searchQuery.toLowerCase().trim();
  const filteredRules = rules.filter(
    (r) => !q || r.content.toLowerCase().includes(q)
  );

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={true}
        label="Grammar Rules"
        subtitle={activeFilterLabel || undefined}
        items={[
          <TouchableOpacity
            key="add"
            onPress={() => router.push('/pages/addRule')}
            activeOpacity={0.7}
          >
            <Lucide name="plus" size={20} color="#373737ff" style={styles.actionBtnIcon} />
          </TouchableOpacity>,
          <TouchableOpacity
            key="delete"
            onPress={() => Alert.alert('Delete', 'Grammar rule deletion option')}
            activeOpacity={0.7}
          >
            <Lucide name="trash" size={20} color="#373737ff" style={styles.actionBtnIcon} />
          </TouchableOpacity>,
        ]}
      />

      <View style={styles.controlBar}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search grammar rules & notes..."
        />

        {activeFilterLabel && (
          <View style={styles.filterRow}>
            <View style={styles.filterBadge}>
              <Lucide name="filter" size={12} color="#6366f1" />
              <Text style={styles.filterBadgeText}>{activeFilterLabel}</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
      >
        {filteredRules.length > 0 ? (
          filteredRules.map((rule, index) => {
            const cardBg = randomColors[index % randomColors.length];
            return (
              <RuleCard
                key={rule.id || index}
                rule={rule}
                index={index}
                cardBg={cardBg}
                isPlaying={playingId === (rule.id || index + 1)}
                onPlayAudio={(id) => setPlayingId(id)}
              />
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Lucide name="book-open-check" size={40} color="#cbd5e1" />
            <ThemedText style={styles.emptyText}>
              {searchQuery
                ? 'No matching grammar rules found'
                : activeFilterLabel
                ? `No grammar rules found for ${activeFilterLabel}`
                : 'No grammar rules available'}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actionBtnIcon: {
    fontSize: 22,
    backgroundColor: '#e8e8e8ff',
    borderRadius: 50,
    width: 40,
    height: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: '#414040ff',
  },
  controlBar: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    position: 'absolute',
    top: 60,
    width: '100%',
    height: 90,
    zIndex: 1000,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338ca',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingTop: 80,
    paddingBottom: 30,
    gap: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

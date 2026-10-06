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
  getAllWords,
  getWordsByCharacterId,
  getWordsByHSKId,
  getWordsByLessonId,
  getWordsByRuleId,
  getWordsBySentenceId,
  getWordsByTextId,
} from '@/db/utils';
import { WordType } from '@/types';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { randomColors } from '@/constants/theme';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { WordCard } from '@/components/cards/WordCard';
import { SearchBar } from '@/components/common/SearchBar';
import { StudyToggleBar } from '@/components/common/StudyToggleBar';

export default function WordsScreen() {
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
  const characterId = parseNum(params.characterId || params.caracterid);
  const ruleId = parseNum(params.ruleId);
  const genericId = parseNum(params.id);

  const [words, setWords] = useState<WordType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const getFilterBadgeLabel = (): string | null => {
    if (hskId > 0) return `HSK Level ${hskId}`;
    if (lessonId > 0) return `Lesson ${lessonId}`;
    if (textId > 0) return `Text ${textId}`;
    if (sentenceId > 0) return `Sentence ${sentenceId}`;
    if (characterId > 0) return `Character ${characterId}`;
    if (ruleId > 0) return `Rule ${ruleId}`;
    if (genericId > 0) return `ID ${genericId}`;
    return null;
  };

  const activeFilterLabel = getFilterBadgeLabel();

  const loadData = useCallback(() => {
    try {
      let data: WordType[] = [];

      if (hskId > 0) {
        data = getWordsByHSKId(hskId) as unknown as WordType[];
      } else if (lessonId > 0) {
        data = getWordsByLessonId(lessonId) as unknown as WordType[];
      } else if (textId > 0) {
        data = getWordsByTextId(textId) as unknown as WordType[];
      } else if (sentenceId > 0) {
        data = getWordsBySentenceId(sentenceId) as unknown as WordType[];
      } else if (characterId > 0) {
        data = getWordsByCharacterId(characterId) as unknown as WordType[];
      } else if (ruleId > 0) {
        data = getWordsByRuleId(ruleId) as unknown as WordType[];
      } else if (genericId > 0) {
        data = getWordsByLessonId(genericId) as unknown as WordType[];
        if (!data || data.length === 0) {
          data = getWordsByHSKId(genericId) as unknown as WordType[];
        }
      } else {
        data = getAllWords() as unknown as WordType[];
      }

      setWords(data || []);
    } catch (e) {
      console.error('Failed to load words:', e);
    }
  }, [hskId, lessonId, textId, sentenceId, characterId, ruleId, genericId]);

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
  const filteredWords = words.filter(
    (w) =>
      !q ||
      w.content.toLowerCase().includes(q) ||
      w.pinyin.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q)
  );

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={true}
        label="Words"
        subtitle={activeFilterLabel || undefined}
        items={[
          <TouchableOpacity
            key="add"
            onPress={() => router.push('/pages/addWord')}
            activeOpacity={0.7}
          >
            <Lucide name="plus" size={20} color="#373737ff" style={styles.actionBtnIcon} />
          </TouchableOpacity>,
          <TouchableOpacity
            key="delete"
            onPress={() => Alert.alert('Delete', 'Word deletion option')}
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
          placeholder="Search words, pinyin, meaning..."
        />

        <View style={styles.toggleRow}>
          <StudyToggleBar
            showPinyin={showPinyin}
            setShowPinyin={setShowPinyin}
            showMeaning={showMeaning}
            setShowMeaning={setShowMeaning}
            accentColor="#059669"
          />

          {activeFilterLabel && (
            <View style={styles.filterBadge}>
              <Lucide name="filter" size={12} color="#10b981" />
              <Text style={styles.filterBadgeText}>{activeFilterLabel}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
      >
        {filteredWords.length > 0 ? (
          filteredWords.map((word, index) => {
            const cardBg = randomColors[index % randomColors.length];
            return (
              <WordCard
                key={word.id || index}
                word={word}
                index={index}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                cardBg={cardBg}
                isPlaying={playingId === (word.id || index + 1)}
                onPlayAudio={(id) => setPlayingId(id)}
              />
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Lucide name="languages" size={40} color="#cbd5e1" />
            <ThemedText style={styles.emptyText}>
              {searchQuery
                ? 'No matching words found'
                : activeFilterLabel
                ? `No words found for ${activeFilterLabel}`
                : 'No vocabulary words available'}
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
    height: 100,
    zIndex: 1000,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  scrollView: {
    width: '100%',
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: 8,
    paddingBottom: 24,
    paddingTop: 100,
    gap: 6,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

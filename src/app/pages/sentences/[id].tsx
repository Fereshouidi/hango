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
  getAllSentences,
  getSentencesByCharacterId,
  getSentencesByHSKId,
  getSentencesByLessonId,
  getSentencesByRuleId,
  getSentencesByTextId,
  getSentencesByWordId,
} from '@/db/utils';
import { SentenceType } from '@/types';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { randomColors } from '@/constants/theme';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SentenceCard } from '@/components/cards/SentenceCard';
import { SearchBar } from '@/components/common/SearchBar';
import { StudyToggleBar } from '@/components/common/StudyToggleBar';

export default function SentencesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    hskId?: string;
    lessonId?: string;
    textId?: string;
    wordId?: string;
    characterId?: string;
    caracterid?: string;
    ruleId?: string;
  }>();

  const parseNum = (val?: string) => (val && !isNaN(Number(val)) ? Number(val) : 0);

  const hskId = parseNum(params.hskId);
  const lessonId = parseNum(params.lessonId);
  const textId = parseNum(params.textId);
  const wordId = parseNum(params.wordId);
  const characterId = parseNum(params.characterId || params.caracterid);
  const ruleId = parseNum(params.ruleId);
  const genericId = parseNum(params.id);

  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const getFilterBadgeLabel = (): string | null => {
    if (hskId > 0) return `HSK Level ${hskId}`;
    if (lessonId > 0) return `Lesson ${lessonId}`;
    if (textId > 0) return `Text ${textId}`;
    if (wordId > 0) return `Word ${wordId}`;
    if (characterId > 0) return `Character ${characterId}`;
    if (ruleId > 0) return `Rule ${ruleId}`;
    if (genericId > 0) return `ID ${genericId}`;
    return null;
  };

  const activeFilterLabel = getFilterBadgeLabel();

  const loadData = useCallback(() => {
    try {
      let data: SentenceType[] = [];

      if (hskId > 0) {
        data = getSentencesByHSKId(hskId) as unknown as SentenceType[];
      } else if (lessonId > 0) {
        data = getSentencesByLessonId(lessonId) as unknown as SentenceType[];
      } else if (textId > 0) {
        data = getSentencesByTextId(textId) as unknown as SentenceType[];
      } else if (wordId > 0) {
        data = getSentencesByWordId(wordId) as unknown as SentenceType[];
      } else if (characterId > 0) {
        data = getSentencesByCharacterId(characterId) as unknown as SentenceType[];
      } else if (ruleId > 0) {
        data = getSentencesByRuleId(ruleId) as unknown as SentenceType[];
      } else if (genericId > 0) {
        data = getSentencesByLessonId(genericId) as unknown as SentenceType[];
        if (!data || data.length === 0) {
          data = getSentencesByHSKId(genericId) as unknown as SentenceType[];
        }
      } else {
        data = getAllSentences() as unknown as SentenceType[];
      }

      setSentences(data || []);
    } catch (e) {
      console.error('Failed to load sentences:', e);
    }
  }, [hskId, lessonId, textId, wordId, characterId, ruleId, genericId]);

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
  const filteredSentences = sentences.filter(
    (s) =>
      !q ||
      s.content.toLowerCase().includes(q) ||
      s.pinyin.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q)
  );

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={true}
        label="Sentences"
        subtitle={activeFilterLabel || undefined}
        items={[
          <TouchableOpacity
            key="add"
            onPress={() => router.push('/pages/addSentence')}
            activeOpacity={0.7}
          >
            <Lucide name="plus" size={20} color="#373737ff" style={styles.actionBtnIcon} />
          </TouchableOpacity>,
          <TouchableOpacity
            key="delete"
            onPress={() => Alert.alert('Delete', 'Sentence deletion option')}
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
          placeholder="Search sentences, pinyin, meaning..."
        />

        <View style={styles.toggleRow}>
          <StudyToggleBar
            showPinyin={showPinyin}
            setShowPinyin={setShowPinyin}
            showMeaning={showMeaning}
            setShowMeaning={setShowMeaning}
            accentColor="#2563eb"
          />

          {activeFilterLabel && (
            <View style={styles.filterBadge}>
              <Lucide name="filter" size={12} color="#8b5cf6" />
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
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
      >
        {filteredSentences.length > 0 ? (
          filteredSentences.map((sentence, index) => {
            const cardBg = randomColors[index % randomColors.length];
            return (
              <SentenceCard
                key={sentence.id || index}
                sentence={sentence}
                index={index}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                cardBg={cardBg}
                isPlaying={playingId === (sentence.id || index + 1)}
                onPlayAudio={(id) => setPlayingId(id)}
              />
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Lucide name="message-square-text" size={40} color="#cbd5e1" />
            <ThemedText style={styles.emptyText}>
              {searchQuery
                ? 'No matching sentences found'
                : activeFilterLabel
                ? `No sentences found for ${activeFilterLabel}`
                : 'No sentences available'}
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
    paddingHorizontal: 10,
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
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7e22ce',
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

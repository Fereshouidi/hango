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
  getAllTexts,
  getTextsByCharacterId,
  getTextsByHSKId,
  getTextsByLessonId,
  getTextsByRuleId,
  getTextsBySentenceId,
  getTextsByWordId,
} from '@/db/utils';
import { TextType } from '@/types';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { randomColors } from '@/constants/theme';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { TextCard } from '@/components/cards/TextCard';
import { SearchBar } from '@/components/common/SearchBar';
import { StudyToggleBar } from '@/components/common/StudyToggleBar';

export default function TextsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    hskId?: string;
    lessonId?: string;
    sentenceId?: string;
    wordId?: string;
    characterId?: string;
    caracterid?: string;
    ruleId?: string;
  }>();

  const parseNum = (val?: string) => (val && !isNaN(Number(val)) ? Number(val) : 0);

  const hskId = parseNum(params.hskId);
  const lessonId = parseNum(params.lessonId);
  const sentenceId = parseNum(params.sentenceId);
  const wordId = parseNum(params.wordId);
  const characterId = parseNum(params.characterId || params.caracterid);
  const ruleId = parseNum(params.ruleId);
  const genericId = parseNum(params.id);

  const [texts, setTexts] = useState<TextType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const getFilterBadgeLabel = (): string | null => {
    if (hskId > 0) return `HSK Level ${hskId}`;
    if (lessonId > 0) return `Lesson ${lessonId}`;
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
      let data: TextType[] = [];

      if (hskId > 0) {
        data = getTextsByHSKId(hskId) as unknown as TextType[];
      } else if (lessonId > 0) {
        data = getTextsByLessonId(lessonId) as unknown as TextType[];
      } else if (sentenceId > 0) {
        data = getTextsBySentenceId(sentenceId) as unknown as TextType[];
      } else if (wordId > 0) {
        data = getTextsByWordId(wordId) as unknown as TextType[];
      } else if (characterId > 0) {
        data = getTextsByCharacterId(characterId) as unknown as TextType[];
      } else if (ruleId > 0) {
        data = getTextsByRuleId(ruleId) as unknown as TextType[];
      } else if (genericId > 0) {
        data = getTextsByLessonId(genericId) as unknown as TextType[];
        if (!data || data.length === 0) {
          data = getTextsByHSKId(genericId) as unknown as TextType[];
        }
      } else {
        data = getAllTexts() as unknown as TextType[];
      }

      setTexts(data || []);
    } catch (e) {
      console.error('Failed to load texts:', e);
    }
  }, [hskId, lessonId, sentenceId, wordId, characterId, ruleId, genericId]);

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
  const filteredTexts = texts.filter(
    (t) =>
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q) ||
      t.pinyin.toLowerCase().includes(q) ||
      t.meaning.toLowerCase().includes(q)
  );

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={true}
        label="Texts"
        subtitle={activeFilterLabel || undefined}
        items={[
          <TouchableOpacity
            key="add"
            onPress={() => router.push('/pages/addText')}
            activeOpacity={0.7}
          >
            <Lucide name="plus" size={20} color="#373737ff" style={styles.actionBtnIcon} />
          </TouchableOpacity>,
          <TouchableOpacity
            key="delete"
            onPress={() => Alert.alert('Delete', 'Text deletion option')}
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
          placeholder="Search passages, pinyin, meaning..."
        />

        <View style={styles.toggleRow}>
          <StudyToggleBar
            showPinyin={showPinyin}
            setShowPinyin={setShowPinyin}
            showMeaning={showMeaning}
            setShowMeaning={setShowMeaning}
            accentColor="#3b82f6"
          />

          {activeFilterLabel && (
            <View style={styles.filterBadge}>
              <Lucide name="filter" size={12} color="#3b82f6" />
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
        {filteredTexts.length > 0 ? (
          filteredTexts.map((textItem, index) => {
            const cardBg = randomColors[index % randomColors.length];
            return (
              <TextCard
                key={textItem.id || index}
                textObj={textItem}
                index={index}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                cardBg={cardBg}
                isPlaying={playingId === (textItem.id || index + 1)}
                onPlayAudio={(id) => setPlayingId(id)}
              />
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Lucide name="file-text" size={40} color="#cbd5e1" />
            <ThemedText style={styles.emptyText}>
              {searchQuery
                ? 'No matching text passages found'
                : activeFilterLabel
                ? `No texts found for ${activeFilterLabel}`
                : 'No reading texts available'}
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
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
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

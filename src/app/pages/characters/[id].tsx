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
  getAllCharacters,
  getCharactersByHSKId,
  getCharactersByLessonId,
  getCharactersByTextId,
  getCharactersBySentenceId,
  getCharactersByWordId,
  getCharactersByRuleId,
} from '@/db/utils';
import { CharacterType } from '@/types';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { randomColors } from '@/constants/theme';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { CharacterCard } from '@/components/cards/CharacterCard';
import { SearchBar } from '@/components/common/SearchBar';
import { StudyToggleBar } from '@/components/common/StudyToggleBar';

export default function CharactersScreen() {
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
  const ruleId = parseNum(params.ruleId);
  const genericId = parseNum(params.id);

  const [characters, setCharacters] = useState<CharacterType[]>([]);
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
    if (wordId > 0) return `Word ${wordId}`;
    if (ruleId > 0) return `Rule ${ruleId}`;
    if (genericId > 0) return `ID ${genericId}`;
    return null;
  };

  const activeFilterLabel = getFilterBadgeLabel();

  const loadData = useCallback(() => {
    try {
      let data: CharacterType[] = [];

      if (hskId > 0) {
        data = getCharactersByHSKId(hskId) as unknown as CharacterType[];
      } else if (lessonId > 0) {
        data = getCharactersByLessonId(lessonId) as unknown as CharacterType[];
      } else if (textId > 0) {
        data = getCharactersByTextId(textId) as unknown as CharacterType[];
      } else if (sentenceId > 0) {
        data = getCharactersBySentenceId(sentenceId) as unknown as CharacterType[];
      } else if (wordId > 0) {
        data = getCharactersByWordId(wordId) as unknown as CharacterType[];
      } else if (ruleId > 0) {
        data = getCharactersByRuleId(ruleId) as unknown as CharacterType[];
      } else if (genericId > 0) {
        data = getCharactersByLessonId(genericId) as unknown as CharacterType[];
        if (!data || data.length === 0) {
          data = getCharactersByHSKId(genericId) as unknown as CharacterType[];
        }
      } else {
        data = getAllCharacters() as unknown as CharacterType[];
      }

      setCharacters(data || []);
    } catch (e) {
      console.error('Failed to load characters:', e);
    }
  }, [hskId, lessonId, textId, sentenceId, wordId, ruleId, genericId]);

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
  const filteredCharacters = characters.filter(
    (c) =>
      !q ||
      c.content.toLowerCase().includes(q) ||
      c.pinyin.toLowerCase().includes(q) ||
      c.meaning.toLowerCase().includes(q)
  );

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={true}
        label="Characters"
        subtitle={activeFilterLabel || undefined}
        items={[
          <TouchableOpacity
            key="add"
            onPress={() => router.push('/pages/addCharacter')}
            activeOpacity={0.7}
          >
            <Lucide name="plus" size={20} color="#373737ff" style={styles.actionBtnIcon} />
          </TouchableOpacity>,
          <TouchableOpacity
            key="delete"
            onPress={() => Alert.alert('Delete', 'Character deletion option')}
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
          placeholder="Search characters, pinyin, meaning..."
        />

        <View style={styles.toggleRow}>
          <StudyToggleBar
            showPinyin={showPinyin}
            setShowPinyin={setShowPinyin}
            showMeaning={showMeaning}
            setShowMeaning={setShowMeaning}
            accentColor="#ec4899"
          />

          {activeFilterLabel && (
            <View style={styles.filterBadge}>
              <Lucide name="filter" size={12} color="#ec4899" />
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
            tintColor="#ec4899"
            colors={['#ec4899']}
          />
        }
      >
        {filteredCharacters.length > 0 ? (
          <View style={styles.gridContainer}>
            {filteredCharacters.map((char, index) => {
              const cardBg = randomColors[index % randomColors.length];
              return (
                <View key={char.id || index} style={{ width: '48.5%' }}>
                  <CharacterCard
                    char={char}
                    index={index}
                    showPinyin={showPinyin}
                    showMeaning={showMeaning}
                    cardBg={cardBg}
                    isPlaying={playingId === (char.id || index + 1)}
                    onPlayAudio={(id) => setPlayingId(id)}
                  />
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Lucide name="spell-check" size={40} color="#cbd5e1" />
            <ThemedText style={styles.emptyText}>
              {searchQuery
                ? 'No matching characters found'
                : activeFilterLabel
                ? `No characters found for ${activeFilterLabel}`
                : 'No characters available'}
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
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#be185d',
  },
  scrollView: {
    width: '100%',
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 100,
    paddingBottom: 30,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
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

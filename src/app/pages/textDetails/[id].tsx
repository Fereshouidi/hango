import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  CharacterType,
  HSKType,
  LessonType,
  RuleType,
  SentenceType,
  TextType,
  WordType,
} from '@/types';
import {
  getCharactersByTextId,
  getHSKById,
  getLessonById,
  getRulesByTextId,
  getSentencesByTextId,
  getTextById,
  getWordsByTextId,
} from '@/db/utils';
import { handleLongText, speakChineseText, speakEnglishText } from '@/utils/tts';
import { SentenceCard } from '@/components/cards/SentenceCard';
import { WordCard } from '@/components/cards/WordCard';
import { CharacterCard } from '@/components/cards/CharacterCard';
import { RuleCard } from '@/components/cards/RuleCard';
import { SearchBar } from '@/components/common/SearchBar';
import { CategoryTabs, CategoryTabType } from '@/components/common/CategoryTabs';
import { PassageHeroCard } from '@/components/details/PassageHeroCard';

const TextDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; textId?: string }>();
  const rawId = params.textId || params.id;
  const textId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : 1;

  const [textObj, setTextObj] = useState<TextType | null>(null);
  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [hsk, setHsk] = useState<HSKType | null>(null);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [words, setWords] = useState<WordType[]>([]);
  const [characters, setCharacters] = useState<CharacterType[]>([]);
  const [rules, setRules] = useState<RuleType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Audio Playback State
  const [isPlayingPassage, setIsPlayingPassage] = useState(false);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  // Toggles & Study Filters
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTextData = useCallback(() => {
    try {
      if (!textId) return;
      const data = getTextById(textId);
      setTextObj(data);

      if (data?.lessonId) {
        const les = getLessonById(data.lessonId);
        setLesson(les);
      }
      if (data?.hskId) {
        const hskData = getHSKById(data.hskId);
        setHsk(hskData);
      }

      const sentenceData = getSentencesByTextId(textId) as unknown as SentenceType[];
      setSentences(sentenceData || []);

      const wordData = getWordsByTextId(textId) as unknown as WordType[];
      setWords(wordData || []);

      const charData = getCharactersByTextId(textId) as unknown as CharacterType[];
      setCharacters(charData || []);

      const ruleData = getRulesByTextId(textId) as unknown as RuleType[];
      setRules(ruleData || []);
    } catch (error) {
      console.error('Error loading text details:', error);
    }
  }, [textId]);

  useFocusEffect(
    useCallback(() => {
      loadTextData();
    }, [loadTextData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTextData();
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, [loadTextData]);

  // Handle Full Passage Speech
  const handlePlayPassage = () => {
    if (!textObj?.content) return;
    setIsPlayingPassage(true);
    speakChineseText(
      textObj.content,
      () => setIsPlayingPassage(true),
      () => setIsPlayingPassage(false)
    );
  };

  // Item audio play helper
  const playItemAudio = (id: number, text: string, key: string, isEnglish = false) => {
    setPlayingItemId(key);
    if (isEnglish) {
      speakEnglishText(
        text,
        () => setPlayingItemId(key),
        () => setPlayingItemId(null)
      );
    } else {
      speakChineseText(
        text,
        () => setPlayingItemId(key),
        () => setPlayingItemId(null)
      );
    }
  };

  // Search filtering
  const q = searchQuery.toLowerCase().trim();

  const filteredSentences = sentences.filter(
    (s) =>
      !q ||
      s.content.toLowerCase().includes(q) ||
      s.pinyin.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q)
  );

  const filteredWords = words.filter(
    (w) =>
      !q ||
      w.content.toLowerCase().includes(q) ||
      w.pinyin.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q)
  );

  const filteredCharacters = characters.filter(
    (c) =>
      !q ||
      c.content.toLowerCase().includes(q) ||
      c.pinyin.toLowerCase().includes(q) ||
      c.meaning.toLowerCase().includes(q)
  );

  const filteredRules = rules.filter(
    (r) => !q || r.content.toLowerCase().includes(q)
  );

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label={textObj?.title || 'Reading Text Details'}
        // subtitle={textObj?.meaning ? handleLongText(textObj?.pinyin, 30) : undefined}
        items={[
          <TouchableOpacity
            key="tts"
            style={[styles.headerAudioBtn, isPlayingPassage && styles.headerAudioBtnPlaying]}
            onPress={handlePlayPassage}
            activeOpacity={0.7}
          >
            <Lucide
              name={isPlayingPassage ? 'volume-2' : 'volume-1'}
              size={18}
              color={isPlayingPassage ? '#ffffff' : '#0284c7'}
            />
          </TouchableOpacity>,
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />
        }
      >
        {/* HERO PASSAGE CARD */}
        <PassageHeroCard
          textObj={textObj}
          hsk={hsk}
          sentenceCount={sentences.length}
          wordCount={words.length}
          isPlayingPassage={isPlayingPassage}
          onPlayPassage={handlePlayPassage}
          showPinyin={showPinyin}
          setShowPinyin={setShowPinyin}
          showMeaning={showMeaning}
          setShowMeaning={setShowMeaning}
        />

        {/* SEARCH BAR */}
        <View style={styles.controlsRow}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search content in this text..."
          />
        </View>

        {/* CATEGORY TABS */}
        <CategoryTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            sentences: sentences.length,
            words: words.length,
            characters: characters.length,
            rules: rules.length,
          }}
        />

        {/* SENTENCES SECTION */}
        {(activeTab === 'all' || activeTab === 'sentences') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Lucide name="message-square-text" size={18} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Sentences ({filteredSentences.length})</Text>
              <TouchableOpacity
                style={styles.addInlineBtn}
                onPress={() => router.push(textId ? `/pages/addSentence?textId=${textId}` : '/pages/addSentence')}
              >
                <Lucide name="plus" size={14} color="#8b5cf6" />
                <Text style={styles.addInlineText}>Sentence</Text>
              </TouchableOpacity>
            </View>

            {filteredSentences.length === 0 ? (
              <Text style={styles.emptyText}>No sentences found in this text.</Text>
            ) : (
              filteredSentences.map((s, idx) => (
                <SentenceCard
                  key={s.id}
                  sentence={s}
                  index={idx}
                  showPinyin={showPinyin}
                  showMeaning={showMeaning}
                  isPlaying={playingItemId === `sentence-${s.id}`}
                  onPlayAudio={(id, content) => playItemAudio(id, content, `sentence-${id}`)}
                />
              ))
            )}
          </View>
        )}

        {/* WORDS SECTION */}
        {(activeTab === 'all' || activeTab === 'words') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Lucide name="languages" size={18} color="#059669" />
              <Text style={styles.sectionTitle}>Vocabulary Words ({filteredWords.length})</Text>
              <TouchableOpacity
                style={styles.addInlineBtn}
                onPress={() => router.push(textId ? `/pages/addWord?textId=${textId}` : '/pages/addWord')}
              >
                <Lucide name="plus" size={14} color="#059669" />
                <Text style={[styles.addInlineText, { color: '#059669' }]}>Word</Text>
              </TouchableOpacity>
            </View>

            {filteredWords.length === 0 ? (
              <Text style={styles.emptyText}>No vocabulary words associated with this text.</Text>
            ) : (
              <View style={styles.wordsGrid}>
                {filteredWords.map((w) => (
                  <View key={w.id} style={{ width: '48%' }}>
                    <WordCard
                      word={w}
                      showPinyin={showPinyin}
                      showMeaning={showMeaning}
                      isPlaying={playingItemId === `word-${w.id}`}
                      onPlayAudio={(id, content) => playItemAudio(id, content, `word-${id}`)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* CHARACTERS SECTION */}
        {(activeTab === 'all' || activeTab === 'characters') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Lucide name="spell-check" size={18} color="#ec4899" />
              <Text style={styles.sectionTitle}>Hanzi Characters ({filteredCharacters.length})</Text>
              <TouchableOpacity
                style={styles.addInlineBtn}
                onPress={() => router.push(textId ? `/pages/addCharacter?textId=${textId}` : '/pages/addCharacter')}
              >
                <Lucide name="plus" size={14} color="#ec4899" />
                <Text style={[styles.addInlineText, { color: '#ec4899' }]}>Character</Text>
              </TouchableOpacity>
            </View>

            {filteredCharacters.length === 0 ? (
              <Text style={styles.emptyText}>No characters linked to this text.</Text>
            ) : (
              <View style={styles.charactersGrid}>
                {filteredCharacters.map((c) => (
                  <View key={c.id} style={{ width: '48%' }}>
                    <CharacterCard
                      char={c}
                      showPinyin={showPinyin}
                      showMeaning={showMeaning}
                      isPlaying={playingItemId === `char-${c.id}`}
                      onPlayAudio={(id, content) => playItemAudio(id, content, `char-${id}`)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* GRAMMAR RULES SECTION */}
        {(activeTab === 'all' || activeTab === 'rules') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Lucide name="book-open-check" size={18} color="#d97706" />
              <Text style={styles.sectionTitle}>Grammar Rules ({filteredRules.length})</Text>
              <TouchableOpacity
                style={styles.addInlineBtn}
                onPress={() => router.push(textId ? `/pages/addRule?textId=${textId}` : '/pages/addRule')}
              >
                <Lucide name="plus" size={14} color="#d97706" />
                <Text style={[styles.addInlineText, { color: '#d97706' }]}>Rule</Text>
              </TouchableOpacity>
            </View>

            {filteredRules.length === 0 ? (
              <Text style={styles.emptyText}>No grammar rules linked to this text.</Text>
            ) : (
              filteredRules.map((r, idx) => (
                <RuleCard
                  key={r.id}
                  rule={r}
                  index={idx}
                  isPlaying={playingItemId === `rule-${r.id}`}
                  onPlayAudio={(id, content) => playItemAudio(id, content, `rule-${id}`, true)}
                />
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
};

export default TextDetails;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 10,
    paddingHorizontal: 10,
    gap: 5,
  },
  headerAudioBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0284c718',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0284c740',
  },
  headerAudioBtnPlaying: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  sectionContainer: {
    backgroundColor: "#ffffffe1",
    padding: 10,
    borderRadius: 10,
    gap: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginLeft: 8,
  },
  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addInlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  charactersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
});

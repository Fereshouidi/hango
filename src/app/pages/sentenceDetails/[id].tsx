import { CharacterCard } from '@/components/cards/CharacterCard';
import { RuleCard } from '@/components/cards/RuleCard';
import { TextCard } from '@/components/cards/TextCard';
import { WordCard } from '@/components/cards/WordCard';
import { CategoryTabType } from '@/components/common/CategoryTabs';
import { DetailControlPanel } from '@/components/common/DetailControlPanel';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { ViewAllButton } from '@/components/common/ViewAllButton';
import { SentenceHeroCard } from '@/components/details/SentenceHeroCard';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import {
  getAllCharacters,
  getAllRules,
  getAllTexts,
  getAllWords,
  getCharactersBySentenceId,
  getHSKById,
  getHSKsBySentenceId,
  getLessonById,
  getLessonsBySentenceId,
  getRulesBySentenceId,
  getSentenceById,
  getTextsBySentenceId,
  getWordsBySentenceId,
} from '@/db/utils';
import {
  CharacterType,
  HSKType,
  LessonType,
  RuleType,
  SentenceType,
  TextType,
  WordType,
} from '@/types';
import { speakChineseText, speakEnglishText } from '@/utils/tts';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ITEM_LIMIT = 4;
const PAGE_SIZE = 10;

const SentenceDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; sentenceId?: string }>();
  const rawId = params.sentenceId || params.id;
  const sentenceId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : 1;

  const [sentenceObj, setSentenceObj] = useState<SentenceType | null>(null);
  const [hsk, setHsk] = useState<HSKType | null>(null);
  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [texts, setTexts] = useState<TextType[]>([]);
  const [words, setWords] = useState<WordType[]>([]);
  const [characters, setCharacters] = useState<CharacterType[]>([]);
  const [rules, setRules] = useState<RuleType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Audio Playback State
  const [isPlayingSentence, setIsPlayingSentence] = useState(false);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  // Toggles & Study Filters
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'linked' | 'global'>('linked');
  const [allTexts, setAllTexts] = useState<TextType[]>([]);
  const [allWords, setAllWords] = useState<WordType[]>([]);
  const [allCharacters, setAllCharacters] = useState<CharacterType[]>([]);
  const [allRules, setAllRules] = useState<RuleType[]>([]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, searchQuery, searchScope]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const loadSentenceData = useCallback(() => {
    try {
      if (!sentenceId) return;
      const data = getSentenceById(sentenceId);
      setSentenceObj(data);

      if (data?.hskId) {
        const hskData = getHSKById(data.hskId);
        setHsk(hskData);
      } else {
        const hsksData = getHSKsBySentenceId(sentenceId) as unknown as HSKType[];
        if (hsksData && hsksData.length > 0) setHsk(hsksData[0]);
      }

      if (data?.lessonId) {
        const lesData = getLessonById(data.lessonId);
        setLesson(lesData);
      } else {
        const lessonsData = getLessonsBySentenceId(sentenceId) as unknown as LessonType[];
        if (lessonsData && lessonsData.length > 0) setLesson(lessonsData[0]);
      }

      const textData = getTextsBySentenceId(sentenceId) as unknown as TextType[];
      setTexts(textData || []);

      const wordData = getWordsBySentenceId(sentenceId) as unknown as WordType[];
      setWords(wordData || []);

      const charData = getCharactersBySentenceId(sentenceId) as unknown as CharacterType[];
      setCharacters(charData || []);

      const ruleData = getRulesBySentenceId(sentenceId) as unknown as RuleType[];
      setRules(ruleData || []);

      // Load all database items for global search
      setAllTexts((getAllTexts() as unknown as TextType[]) || []);
      setAllWords((getAllWords() as unknown as WordType[]) || []);
      setAllCharacters((getAllCharacters() as unknown as CharacterType[]) || []);
      setAllRules((getAllRules() as unknown as RuleType[]) || []);
    } catch (error) {
      console.error('Error loading sentence details:', error);
    }
  }, [sentenceId]);

  useFocusEffect(
    useCallback(() => {
      loadSentenceData();
    }, [loadSentenceData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSentenceData();
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, [loadSentenceData]);

  // Play full sentence audio
  const handlePlaySentence = () => {
    if (!sentenceObj?.content) return;
    setIsPlayingSentence(true);
    speakChineseText(
      sentenceObj.content,
      () => setIsPlayingSentence(true),
      () => setIsPlayingSentence(false)
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

  // ── Sentence search symbols ──
  const sentenceClean = (sentenceObj?.content || '')
    .replace(/[。！？!?.,， \n\r\t]+$/g, '')
    .trim()
    .toLowerCase();
  const sentenceMeaningClean = (sentenceObj?.meaning || '')
    .split(/[;,]/)[0]
    .trim()
    .toLowerCase();

  // Search filtering
  const q = searchQuery.toLowerCase().trim();
  const sentenceSymbol = sentenceObj?.content?.trim() || '';

  const matchesItem = (
    content: string = '',
    title: string = '',
    pinyin: string = '',
    meaning: string = ''
  ) => {
    if (!q) return true;
    const c = content.toLowerCase();
    const t = title.toLowerCase();
    const p = pinyin.toLowerCase();
    const m = meaning.toLowerCase();
    return c.includes(q) || t.includes(q) || p.includes(q) || m.includes(q);
  };

  const textMatchesSentence = (t: TextType) => {
    if (!sentenceClean) return false;
    const c = (t.content || '').toLowerCase();
    const m = (t.meaning || '').toLowerCase();
    return (
      c.includes(sentenceClean) ||
      sentenceClean.includes(c) ||
      (sentenceMeaningClean.length > 2 && m.includes(sentenceMeaningClean))
    );
  };

  const wordMatchesSentence = (w: WordType) => {
    if (!sentenceClean) return false;
    const c = (w.content || '').toLowerCase();
    return sentenceClean.includes(c);
  };

  const charMatchesSentence = (ch: CharacterType) => {
    if (!sentenceClean) return false;
    const c = (ch.content || '').toLowerCase();
    return sentenceClean.includes(c);
  };

  const filteredTexts = (searchScope === 'linked' ? texts : allTexts.filter(textMatchesSentence)).filter((t) =>
    matchesItem(t.content, t.title || '', t.pinyin || '', t.meaning || '')
  );

  const filteredWords = (searchScope === 'linked' ? words : allWords.filter(wordMatchesSentence)).filter((w) =>
    matchesItem(w.content, '', w.pinyin || '', w.meaning || '')
  );

  const filteredCharacters = (searchScope === 'linked' ? characters : allCharacters.filter(charMatchesSentence)).filter((c) =>
    matchesItem(c.content, '', c.pinyin || '', c.meaning || '')
  );

  const filteredRules = (searchScope === 'linked' ? rules : allRules).filter((r) =>
    matchesItem(r.content, '', '', '')
  );

  const linkedTotalCount = texts.length + words.length + characters.length + rules.length;
  const totalItemCount = filteredTexts.length + filteredWords.length + filteredCharacters.length + filteredRules.length;
  const globalTotalCount =
    allTexts.filter(textMatchesSentence).length +
    allWords.filter(wordMatchesSentence).length +
    allCharacters.filter(charMatchesSentence).length +
    allRules.length;

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label={sentenceObj ? `Sentence #${sentenceObj.id}` : 'Sentence Details'}
        items={[
          <TouchableOpacity
            key="edit-sentence"
            onPress={() => router.push(`/pages/addSentence?sentenceId=${sentenceId}` as any)}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Lucide name="edit-3" size={18} color="#8b5cf6" />
          </TouchableOpacity>,
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8b5cf6']} />
        }
      >
        {/* HERO SENTENCE CARD */}
        <SentenceHeroCard
          sentence={sentenceObj}
          sentenceId={sentenceId}
          hsk={hsk}
          lesson={lesson}
          textCount={texts.length}
          wordCount={words.length}
          characterCount={characters.length}
          ruleCount={rules.length}
          isPlaying={isPlayingSentence}
          onPlay={handlePlaySentence}
          onEdit={() => router.push(`/pages/addSentence?sentenceId=${sentenceId}` as any)}
          showPinyin={showPinyin}
          setShowPinyin={setShowPinyin}
          showMeaning={showMeaning}
          setShowMeaning={setShowMeaning}
        />

        {/* UNIFIED CONTROLS: SEARCH, SCOPE & TABS */}
        <DetailControlPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            searchScope === 'linked'
              ? 'Search sentence linked content...'
              : 'Search all database for this sentence...'
          }
          searchScope={searchScope}
          onSelectScope={setSearchScope}
          accentColor="#8b5cf6"
          linkedTotalCount={linkedTotalCount}
          globalTotalCount={globalTotalCount}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            texts: filteredTexts.length,
            words: filteredWords.length,
            characters: filteredCharacters.length,
            rules: filteredRules.length,
          }}
        />

        {/* TEXTS SECTION */}
        {(activeTab === 'all' || activeTab === 'texts') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Lucide name="file-text" size={18} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Reading Texts ({filteredTexts.length})</Text>
              <TouchableOpacity
                style={styles.addInlineBtn}
                onPress={() => router.push(sentenceId ? `/pages/addText?sentenceId=${sentenceId}` : '/pages/addText')}
              >
                <Lucide name="plus" size={14} color="#3b82f6" />
                <Text style={[styles.addInlineText, { color: '#3b82f6' }]}>Text</Text>
              </TouchableOpacity>
            </View>

            {filteredTexts.length === 0 ? (
              <Text style={styles.emptyText}>No reading texts linked to this sentence.</Text>
            ) : (
              <>
                {filteredTexts.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((text, idx) => (
                  <TextCard
                    key={text.id || idx}
                    textObj={text}
                    index={idx}
                    showPinyin={showPinyin}
                    showMeaning={showMeaning}
                    isPlaying={playingItemId === `text-${text.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `text-${id}`)}
                  />
                ))}
                {activeTab === 'all' && filteredTexts.length > ITEM_LIMIT && (
                  <ViewAllButton
                    count={filteredTexts.length}
                    label="Reading Texts"
                    accentColor="#3b82f6"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/texts/${sentenceId}`,
                        params: {
                          sentenceId,
                          scope: searchScope,
                          search: searchQuery,
                        },
                      } as any)
                    }
                  />
                )}
                {activeTab !== 'all' && (
                  <LoadMoreFooter
                    currentCount={Math.min(visibleCount, filteredTexts.length)}
                    totalCount={filteredTexts.length}
                    pageSize={PAGE_SIZE}
                    accentColor="#3b82f6"
                    itemLabel="reading texts"
                    onLoadMore={handleLoadMore}
                  />
                )}
              </>
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
                onPress={() => router.push(sentenceId ? `/pages/addWord?sentenceId=${sentenceId}` : '/pages/addWord')}
              >
                <Lucide name="plus" size={14} color="#059669" />
                <Text style={[styles.addInlineText, { color: '#059669' }]}>Word</Text>
              </TouchableOpacity>
            </View>

            {filteredWords.length === 0 ? (
              <Text style={styles.emptyText}>No vocabulary words associated with this sentence.</Text>
            ) : (
              <>
                <View style={styles.wordsGrid}>
                  {filteredWords.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((w) => (
                    // <View key={w.id} style={{ width: '48.5%' }}>
                    <WordCard
                      word={w}
                      showPinyin={showPinyin}
                      showMeaning={showMeaning}
                      isPlaying={playingItemId === `word-${w.id}`}
                      onPlayAudio={(id, content) => playItemAudio(id, content, `word-${id}`)}
                    />
                    // </View>
                  ))}
                </View>
                {activeTab === 'all' && filteredWords.length > ITEM_LIMIT && (
                  <ViewAllButton
                    count={filteredWords.length}
                    label="Vocabulary Words"
                    accentColor="#059669"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/words/${sentenceId}`,
                        params: {
                          sentenceId,
                          scope: searchScope,
                          search: searchQuery,
                        },
                      } as any)
                    }
                  />
                )}
                {activeTab !== 'all' && (
                  <LoadMoreFooter
                    currentCount={Math.min(visibleCount, filteredWords.length)}
                    totalCount={filteredWords.length}
                    pageSize={PAGE_SIZE}
                    accentColor="#059669"
                    itemLabel="words"
                    onLoadMore={handleLoadMore}
                  />
                )}
              </>
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
                onPress={() => router.push(sentenceId ? `/pages/addCharacter?sentenceId=${sentenceId}` : '/pages/addCharacter')}
              >
                <Lucide name="plus" size={14} color="#ec4899" />
                <Text style={[styles.addInlineText, { color: '#ec4899' }]}>Character</Text>
              </TouchableOpacity>
            </View>

            {filteredCharacters.length === 0 ? (
              <Text style={styles.emptyText}>No characters linked to this sentence.</Text>
            ) : (
              <>
                <View style={styles.wordsGrid}>
                  {filteredCharacters.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((c) => (
                    <View key={c.id} style={{ width: '49%', marginVertical: 5 }}>
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
                {activeTab === 'all' && filteredCharacters.length > ITEM_LIMIT && (
                  <ViewAllButton
                    count={filteredCharacters.length}
                    label="Characters"
                    accentColor="#ec489a"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/characters/${sentenceId}`,
                        params: {
                          sentenceId,
                          scope: searchScope,
                          search: searchQuery,
                        },
                      } as any)
                    }
                  />
                )}
                {activeTab !== 'all' && (
                  <LoadMoreFooter
                    currentCount={Math.min(visibleCount, filteredCharacters.length)}
                    totalCount={filteredCharacters.length}
                    pageSize={PAGE_SIZE}
                    accentColor="#ec489a"
                    itemLabel="characters"
                    onLoadMore={handleLoadMore}
                  />
                )}
              </>
            )}
          </View>
        )}

        {/* GRAMMAR RULES SECTION */}
        {(activeTab === 'all' || activeTab === 'rules') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Lucide name="graduation-cap" size={18} color="#d97706" />
              <Text style={styles.sectionTitle}>Grammar Points ({filteredRules.length})</Text>
              <TouchableOpacity
                style={styles.addInlineBtn}
                onPress={() => router.push(sentenceId ? `/pages/addRule?sentenceId=${sentenceId}` : '/pages/addRule')}
              >
                <Lucide name="plus" size={14} color="#d97706" />
                <Text style={[styles.addInlineText, { color: '#d97706' }]}>Rule</Text>
              </TouchableOpacity>
            </View>

            {filteredRules.length === 0 ? (
              <Text style={styles.emptyText}>No grammar points linked to this sentence.</Text>
            ) : (
              <>
                {filteredRules.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((r, idx) => (
                  <RuleCard
                    key={r.id || idx}
                    rule={r}
                    index={idx}
                    isPlaying={playingItemId === `rule-${r.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `rule-${id}`, true)}
                  />
                ))}
                {activeTab === 'all' && filteredRules.length > ITEM_LIMIT && (
                  <ViewAllButton
                    count={filteredRules.length}
                    label="Grammar Points"
                    accentColor="#d97706"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/rules/${sentenceId}`,
                        params: {
                          sentenceId,
                          scope: searchScope,
                          search: searchQuery,
                        },
                      } as any)
                    }
                  />
                )}
                {activeTab !== 'all' && (
                  <LoadMoreFooter
                    currentCount={Math.min(visibleCount, filteredRules.length)}
                    totalCount={filteredRules.length}
                    pageSize={PAGE_SIZE}
                    accentColor="#d97706"
                    itemLabel="grammar rules"
                    onLoadMore={handleLoadMore}
                  />
                )}
              </>
            )}
          </View>
        )}

        {/* Empty state */}
        {totalItemCount === 0 && (
          <View style={styles.emptyContainer}>
            <Lucide name="inbox" size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>This sentence has no linked items yet</Text>
            <Text style={styles.emptySubtitle}>
              Link texts, words, characters, or rules using the Edit Sentence page.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
};

export default SentenceDetails;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 5,
    paddingHorizontal: 5,
    gap: 5,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8e8e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c6c6c6ff',
  },

  sectionContainer: {
    backgroundColor: '#ffffffe1',
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
    fontWeight: '600',
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
    // gap: 10,
    justifyContent: 'space-between',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

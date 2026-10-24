import { CharacterCard } from '@/components/cards/CharacterCard';
import { LessonCard } from '@/components/cards/LessonCard';
import { RuleCard } from '@/components/cards/RuleCard';
import { SentenceCard } from '@/components/cards/SentenceCard';
import { TextCard } from '@/components/cards/TextCard';
import { WordCard } from '@/components/cards/WordCard';
import { CategoryTabType } from '@/components/common/CategoryTabs';
import { DetailControlPanel } from '@/components/common/DetailControlPanel';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { ViewAllButton } from '@/components/common/ViewAllButton';
import { HskHeroCard } from '@/components/details/HskHeroCard';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import {
  getAllCharacters,
  getAllLessons,
  getAllRules,
  getAllSentences,
  getAllTexts,
  getAllWords,
  getCharactersByHSKId,
  getHSKById,
  getLessonsByHSKId,
  getRulesByHSKId,
  getSentencesByHSKId,
  getTextsByHSKId,
  getWordsByHSKId,
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

const HSKDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; hskId?: string }>();
  const rawId = params.hskId || params.id;
  const hskId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : 1;

  const [hsk, setHsk] = useState<HSKType | null>(null);
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [texts, setTexts] = useState<TextType[]>([]);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [words, setWords] = useState<WordType[]>([]);
  const [characters, setCharacters] = useState<CharacterType[]>([]);
  const [rules, setRules] = useState<RuleType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  // Learning Study Controls
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'linked' | 'global'>('linked');

  const [allLessons, setAllLessons] = useState<LessonType[]>([]);
  const [allTexts, setAllTexts] = useState<TextType[]>([]);
  const [allSentences, setAllSentences] = useState<SentenceType[]>([]);
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

  const loadHskData = useCallback(() => {
    try {
      if (!hskId) return;
      const hskData = getHSKById(hskId);
      setHsk(hskData);

      const lessonData = getLessonsByHSKId(hskId) as unknown as LessonType[];
      setLessons(lessonData || []);

      const textData = getTextsByHSKId(hskId) as unknown as TextType[];
      setTexts(textData || []);

      const sentenceData = getSentencesByHSKId(hskId) as unknown as SentenceType[];
      setSentences(sentenceData || []);

      const wordData = getWordsByHSKId(hskId) as unknown as WordType[];
      setWords(wordData || []);

      const charData = getCharactersByHSKId(hskId) as unknown as CharacterType[];
      setCharacters(charData || []);

      const ruleData = getRulesByHSKId(hskId) as unknown as RuleType[];
      setRules(ruleData || []);

      // Load all database items for global search
      setAllLessons((getAllLessons() as unknown as LessonType[]) || []);
      setAllTexts((getAllTexts() as unknown as TextType[]) || []);
      setAllSentences((getAllSentences() as unknown as SentenceType[]) || []);
      setAllWords((getAllWords() as unknown as WordType[]) || []);
      setAllCharacters((getAllCharacters() as unknown as CharacterType[]) || []);
      setAllRules((getAllRules() as unknown as RuleType[]) || []);
    } catch (error) {
      console.error('Error loading HSK details:', error);
    }
  }, [hskId]);

  useFocusEffect(
    useCallback(() => {
      loadHskData();
    }, [loadHskData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHskData();
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, [loadHskData]);

  // ── Source selection based on scope ──
  const sourceLessons = searchScope === 'linked' ? lessons : allLessons;
  const sourceTexts = searchScope === 'linked' ? texts : allTexts;
  const sourceSentences = searchScope === 'linked' ? sentences : allSentences;
  const sourceWords = searchScope === 'linked' ? words : allWords;
  const sourceCharacters = searchScope === 'linked' ? characters : allCharacters;
  const sourceRules = searchScope === 'linked' ? rules : allRules;

  // Search filtering
  const q = searchQuery.toLowerCase().trim();
  const hskSymbol = hsk?.name?.trim() || '';

  const matchesItem = (
    content: string = '',
    title: string = '',
    pinyin: string = '',
    meaning: string = ''
  ) => {
    const c = content.toLowerCase();
    const t = title.toLowerCase();
    const p = pinyin.toLowerCase();
    const m = meaning.toLowerCase();

    if (q) {
      return c.includes(q) || t.includes(q) || p.includes(q) || m.includes(q);
    }
    return true;
  };

  const filteredLessons = sourceLessons.filter((l) =>
    matchesItem('', l.title || `lesson ${l.num}`, '', '')
  );

  const filteredTexts = sourceTexts.filter((t) =>
    matchesItem(t.content, t.title || '', t.pinyin || '', t.meaning || '')
  );

  const filteredSentences = sourceSentences.filter((s) =>
    matchesItem(s.content, '', s.pinyin || '', s.meaning || '')
  );

  const filteredWords = sourceWords.filter((w) =>
    matchesItem(w.content, '', w.pinyin || '', w.meaning || '')
  );

  const filteredCharacters = sourceCharacters.filter((c) =>
    matchesItem(c.content, '', c.pinyin || '', c.meaning || '')
  );

  const filteredRules = sourceRules.filter((r) =>
    matchesItem(r.content, '', '', '')
  );

  const linkedTotalCount = lessons.length + texts.length + sentences.length + words.length + characters.length + rules.length;

  const totalItemCount =
    lessons.length + texts.length + sentences.length + words.length + characters.length + rules.length;

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label={hsk ? hsk.name : 'HSK Details'}
        items={[
          <TouchableOpacity
            key="pinyin-toggle"
            onPress={() => setShowPinyin((prev) => !prev)}
            activeOpacity={0.7}
            style={[styles.headerIconBtn, showPinyin && styles.headerIconBtnActive]}
          >
            <Lucide
              name="type"
              size={18}
              color={showPinyin ? '#6366f1' : '#64748b'}
            />
          </TouchableOpacity>,
          <TouchableOpacity
            key="meaning-toggle"
            onPress={() => setShowMeaning((prev) => !prev)}
            activeOpacity={0.7}
            style={[styles.headerIconBtn, showMeaning && styles.headerIconBtnActive]}
          >
            <Lucide
              name={showMeaning ? 'eye' : 'eye-off'}
              size={18}
              color={showMeaning ? '#6366f1' : '#64748b'}
            />
          </TouchableOpacity>,
          <TouchableOpacity
            key="edit-hsk"
            onPress={() => router.push(`/pages/addHSK?hskId=${hskId}` as any)}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Lucide name="edit-3" size={18} color="#6366f1" />
          </TouchableOpacity>,
        ]}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO HSK CARD */}
        <HskHeroCard
          hsk={hsk}
          hskId={hskId}
          lessonCount={lessons.length}
          textCount={texts.length}
          sentenceCount={sentences.length}
          wordCount={words.length}
          characterCount={characters.length}
          ruleCount={rules.length}
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
              ? 'Search content in this HSK level...'
              : 'Search all database lessons, texts, words, rules...'
          }
          searchScope={searchScope}
          onSelectScope={setSearchScope}
          accentColor="#6366f1"
          linkedTotalCount={linkedTotalCount}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            lessons: filteredLessons.length,
            texts: filteredTexts.length,
            sentences: filteredSentences.length,
            words: filteredWords.length,
            characters: filteredCharacters.length,
            rules: filteredRules.length,
          }}
        />

        {/* SECTION: LESSONS */}
        {(activeTab === 'all' || activeTab === 'lessons') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#2563eb' }]}>
                <Lucide name="book-open" size={15} color="#ffffff" />
              </View>
              <View style={styles.sectionHeaderCenter}>
                <Text style={styles.sectionHeading}>Lessons</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{filteredLessons.length}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push(`/pages/addLesson?hskId=${hskId}` as any)}
                style={[styles.addBtn, { backgroundColor: '#2563eb' }]}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={styles.addBtnText}>add lesson</Text>
              </TouchableOpacity>
            </View>

            {filteredLessons.length === 0 ? (
              <Text style={styles.emptySectionText}>No lessons linked to this HSK level.</Text>
            ) : (
              <>
                {filteredLessons.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((lesson, idx) => (
                  <LessonCard
                    key={lesson.id || idx}
                    lesson={lesson}
                    index={idx}
                    accentColor="#2563eb"
                    isPlaying={playingItemId === `lesson-${lesson.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `lesson-${id}`)}
                  />
                ))}
                {activeTab === 'all' && filteredLessons.length > ITEM_LIMIT && (
                  <ViewAllButton
                    count={filteredLessons.length}
                    label="Lessons"
                    accentColor="#2563eb"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/lessons/${hskId}`,
                        params: {
                          hskId,
                          scope: searchScope,
                          search: searchQuery,
                        },
                      } as any)
                    }
                  />
                )}
                {activeTab !== 'all' && (
                  <LoadMoreFooter
                    currentCount={Math.min(visibleCount, filteredLessons.length)}
                    totalCount={filteredLessons.length}
                    pageSize={PAGE_SIZE}
                    accentColor="#2563eb"
                    itemLabel="lessons"
                    onLoadMore={handleLoadMore}
                  />
                )}
              </>
            )}
          </View>
        )}

        {/* SECTION: TEXTS */}
        {(activeTab === 'all' || activeTab === 'texts') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#3b82f6' }]}>
                <Lucide name="file-text" size={15} color="#ffffff" />
              </View>
              <View style={styles.sectionHeaderCenter}>
                <Text style={styles.sectionHeading}>Reading Texts</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{filteredTexts.length}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push(`/pages/addText?hskId=${hskId}` as any)}
                style={[styles.addBtn, { backgroundColor: '#3b82f6' }]}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={styles.addBtnText}>add text</Text>
              </TouchableOpacity>
            </View>

            {filteredTexts.length === 0 ? (
              <Text style={styles.emptySectionText}>No reading texts linked to this HSK level.</Text>
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
                    searchQuery={searchQuery}
                  />
                ))}
                {activeTab === 'all' && filteredTexts.length > ITEM_LIMIT && (
                  <ViewAllButton
                    count={filteredTexts.length}
                    label="Reading Texts"
                    accentColor="#3b82f6"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/texts/${hskId}`,
                        params: {
                          hskId,
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

        {/* SECTION: SENTENCES */}
        {(activeTab === 'all' || activeTab === 'sentences') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#8b5cf6' }]}>
                <Lucide name="message-square-text" size={15} color="#ffffff" />
              </View>
              <View style={styles.sectionHeaderCenter}>
                <Text style={styles.sectionHeading}>Sentences</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{filteredSentences.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/pages/addSentence?hskId=${hskId}` as any)}
                style={[styles.addBtn, { backgroundColor: '#8b5cf6' }]}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={styles.addBtnText}>add sentence</Text>
              </TouchableOpacity>
            </View>

            {filteredSentences.length === 0 ? (
              <Text style={styles.emptySectionText}>No sentences linked to this HSK level.</Text>
            ) : (
              <>
                {filteredSentences.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((sentence, idx) => (
                  <SentenceCard
                    key={sentence.id || idx}
                    sentence={sentence}
                    index={idx}
                    showPinyin={showPinyin}
                    showMeaning={showMeaning}
                    isPlaying={playingItemId === `sentence-${sentence.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `sentence-${id}`)}
                    searchQuery={searchQuery}
                  />
                ))}
                {activeTab === 'all' && filteredSentences.length > ITEM_LIMIT && (
                  <ViewAllButton
                    count={filteredSentences.length}
                    label="Sentences"
                    accentColor="#8b5cf6"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/sentences/${hskId}`,
                        params: {
                          hskId,
                          scope: searchScope,
                          search: searchQuery,
                        },
                      } as any)
                    }
                  />
                )}
                {activeTab !== 'all' && (
                  <LoadMoreFooter
                    currentCount={Math.min(visibleCount, filteredSentences.length)}
                    totalCount={filteredSentences.length}
                    pageSize={PAGE_SIZE}
                    accentColor="#8b5cf6"
                    itemLabel="sentences"
                    onLoadMore={handleLoadMore}
                  />
                )}
              </>
            )}
          </View>
        )}

        {/* SECTION: WORDS */}
        {(activeTab === 'all' || activeTab === 'words') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#059669' }]}>
                <Lucide name="languages" size={15} color="#ffffff" />
              </View>
              <View style={styles.sectionHeaderCenter}>
                <Text style={styles.sectionHeading}>Vocabulary</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{filteredWords.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/pages/addWord?hskId=${hskId}` as any)}
                style={[styles.addBtn, { backgroundColor: '#059669' }]}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={styles.addBtnText}>add word</Text>
              </TouchableOpacity>
            </View>

            {filteredWords.length === 0 ? (
              <Text style={styles.emptySectionText}>No vocabulary words linked to this HSK level.</Text>
            ) : (
              <>
                <View style={styles.wordsGrid}>
                  {filteredWords.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((word, idx) => (
                    // <View key={word.id || idx} style={{ width: '40%' }}>
                    <WordCard
                      key={word.id || idx}
                      word={word}
                      showPinyin={showPinyin}
                      showMeaning={showMeaning}
                      isPlaying={playingItemId === `word-${word.id}`}
                      onPlayAudio={(id, content) => playItemAudio(id, content, `word-${id}`)}
                      searchQuery={searchQuery}
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
                        pathname: `/pages/words/${hskId}`,
                        params: {
                          hskId,
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
                    itemLabel="vocabulary words"
                    onLoadMore={handleLoadMore}
                  />
                )}
              </>
            )}
          </View>
        )}

        {/* SECTION: CHARACTERS */}
        {(activeTab === 'all' || activeTab === 'characters') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#ec489a' }]}>
                <Lucide name="spell-check" size={15} color="#ffffff" />
              </View>
              <View style={styles.sectionHeaderCenter}>
                <Text style={styles.sectionHeading}>Characters (Hanzi)</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{filteredCharacters.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/pages/addCharacter?hskId=${hskId}` as any)}
                style={[styles.addBtn, { backgroundColor: '#ec489a' }]}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={styles.addBtnText}>add character</Text>
              </TouchableOpacity>
            </View>

            {filteredCharacters.length === 0 ? (
              <Text style={styles.emptySectionText}>No characters linked to this HSK level.</Text>
            ) : (
              <>
                <View style={styles.charsGrid}>
                  {filteredCharacters.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((char, idx) => (
                    <View key={char.id || idx} style={{ width: '48.5%' }}>
                      <CharacterCard
                        char={char}
                        showPinyin={showPinyin}
                        showMeaning={showMeaning}
                        isPlaying={playingItemId === `char-${char.id}`}
                        onPlayAudio={(id, content) => playItemAudio(id, content, `char-${id}`)}
                        searchQuery={searchQuery}
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
                        pathname: `/pages/characters/${hskId}`,
                        params: {
                          hskId,
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

        {/* SECTION: GRAMMAR RULES */}
        {(activeTab === 'all' || activeTab === 'rules') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#d97706' }]}>
                <Lucide name="graduation-cap" size={15} color="#ffffff" />
              </View>
              <View style={styles.sectionHeaderCenter}>
                <Text style={styles.sectionHeading}>Grammar Points</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{filteredRules.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/pages/addRule?hskId=${hskId}` as any)}
                style={[styles.addBtn, { backgroundColor: '#d97706' }]}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={styles.addBtnText}>add rule</Text>
              </TouchableOpacity>
            </View>

            {filteredRules.length === 0 ? (
              <Text style={styles.emptySectionText}>No grammar points linked to this HSK level.</Text>
            ) : (
              <>
                {filteredRules.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((rule, idx) => (
                  <RuleCard
                    key={rule.id || idx}
                    rule={rule}
                    index={idx}
                    isPlaying={playingItemId === `rule-${rule.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `rule-${id}`, true)}
                    searchQuery={searchQuery}
                  />
                ))}
                {activeTab === 'all' && filteredRules.length > ITEM_LIMIT && (
                  <ViewAllButton
                    count={filteredRules.length}
                    label="Grammar Points"
                    accentColor="#d97706"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/rules/${hskId}`,
                        params: {
                          hskId,
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
                    itemLabel="grammar points"
                    onLoadMore={handleLoadMore}
                  />
                )}
              </>
            )}
          </View>
        )}

        {/* Empty State */}
        {totalItemCount === 0 && (
          <View style={styles.emptyContainer}>
            <Lucide name="inbox" size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>This HSK level has no content yet</Text>
            <Text style={styles.emptySubtitle}>
              Link lessons, texts, sentences, words, or characters using the Edit HSK page.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
};

export default HSKDetails;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 5,
    gap: 5,
    paddingBottom: 0,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8e8e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#414040ff',
  },
  headerIconBtnActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },

  sectionContainer: {
    gap: 10,
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ffffffe6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  addBtn: {
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addBtnText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  countBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  emptySectionText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  wordsGrid: {
    width: "100%",
    // backgroundColor: "red",
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: 10,
    // justifyContent: 'space-between',
  },
  charsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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

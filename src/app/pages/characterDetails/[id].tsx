import { RuleCard } from '@/components/cards/RuleCard';
import { SentenceCard } from '@/components/cards/SentenceCard';
import { TextCard } from '@/components/cards/TextCard';
import { WordCard } from '@/components/cards/WordCard';
import { CategoryTabType } from '@/components/common/CategoryTabs';
import { DetailControlPanel } from '@/components/common/DetailControlPanel';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { ViewAllButton } from '@/components/common/ViewAllButton';
import { CharacterDetailSection } from '@/components/details/CharacterDetailSection';
import { CharacterHeroCard } from '@/components/details/CharacterHeroCard';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import {
  getAllRules,
  getAllSentences,
  getAllTexts,
  getAllWords,
  getCharacterById,
  getHSKById,
  getHSKsByCharacterId,
  getLessonById,
  getLessonsByCharacterId,
  getRulesByCharacterId,
  getSentencesByCharacterId,
  getTextsByCharacterId,
  getWordsByCharacterId,
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
import { speakChineseText } from '@/utils/tts';
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

const toneColors: Record<string, string> = {
  '1': '#ef4444',
  '2': '#f59e0b',
  '3': '#10b981',
  '4': '#3b82f6',
  '5': '#6b7280',
};

const CharacterDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; characterId?: string }>();
  const rawId = params.characterId || params.id;
  const characterId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : 1;

  const [character, setCharacter] = useState<CharacterType | null>(null);
  const [hsk, setHsk] = useState<HSKType | null>(null);
  const [lesson, setLesson] = useState<LessonType | null>(null);

  // Linked content state
  const [words, setWords] = useState<WordType[]>([]);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [texts, setTexts] = useState<TextType[]>([]);
  const [rules, setRules] = useState<RuleType[]>([]);

  // Global database state
  const [allWords, setAllWords] = useState<WordType[]>([]);
  const [allSentences, setAllSentences] = useState<SentenceType[]>([]);
  const [allTexts, setAllTexts] = useState<TextType[]>([]);
  const [allRules, setAllRules] = useState<RuleType[]>([]);

  // Search & scope state
  const [searchScope, setSearchScope] = useState<'linked' | 'global'>('linked');
  const [refreshing, setRefreshing] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, searchQuery, searchScope]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const loadData = useCallback(() => {
    try {
      if (!characterId) return;

      const charData = getCharacterById(characterId);
      setCharacter(charData);

      // Resolve HSK: check FK column, then junction table
      if (charData?.hskId) {
        setHsk(getHSKById(charData.hskId));
      } else {
        const hsks = getHSKsByCharacterId(characterId) as unknown as HSKType[];
        setHsk(hsks?.[0] ?? null);
      }

      // Resolve Lesson: check FK column, then junction table
      if (charData?.lessonId) {
        setLesson(getLessonById(charData.lessonId));
      } else {
        const lessons = getLessonsByCharacterId(characterId) as unknown as LessonType[];
        setLesson(lessons?.[0] ?? null);
      }

      // Load linked items
      setWords((getWordsByCharacterId(characterId) as unknown as WordType[]) || []);
      setSentences((getSentencesByCharacterId(characterId) as unknown as SentenceType[]) || []);
      setTexts((getTextsByCharacterId(characterId) as unknown as TextType[]) || []);
      setRules((getRulesByCharacterId(characterId) as unknown as RuleType[]) || []);

      // Load all DB items
      setAllTexts((getAllTexts() as unknown as TextType[]) || []);
      setAllWords((getAllWords() as unknown as WordType[]) || []);
      setAllSentences((getAllSentences() as unknown as SentenceType[]) || []);
      setAllRules((getAllRules() as unknown as RuleType[]) || []);
    } catch (error) {
      console.error('Error loading character details:', error);
    }
  }, [characterId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 400);
  }, [loadData]);

  const handlePlay = () => {
    if (!character?.content) return;
    setIsPlaying(true);
    speakChineseText(
      character.content,
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
  };

  const playItemAudio = (id: number, text: string, key: string) => {
    setPlayingItemId(key);
    speakChineseText(
      text,
      () => setPlayingItemId(key),
      () => setPlayingItemId(null)
    );
  };

  // ── Source selection based on scope ──
  const sourceTexts = searchScope === 'linked' ? texts : allTexts;
  const sourceWords = searchScope === 'linked' ? words : allWords;
  const sourceSentences = searchScope === 'linked' ? sentences : allSentences;
  const sourceRules = searchScope === 'linked' ? rules : allRules;

  // ── Search & Filter Logic ──
  const q = searchQuery.toLowerCase().trim();
  const toneColor = toneColors[character?.tone || '5'] || '#ec4899';
  const charSymbol = character?.content?.trim() || '';

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

    if (searchScope === 'global') {
      if (!charSymbol) return true;
      const lowerSymbol = charSymbol.toLowerCase();
      return c.includes(lowerSymbol) || t.includes(lowerSymbol) || m.includes(lowerSymbol);
    }

    return true;
  };

  const filteredTexts = sourceTexts.filter((t) =>
    matchesItem(t.content, t.title || '', t.pinyin || '', t.meaning || '')
  );

  const filteredWords = sourceWords.filter((w) =>
    matchesItem(w.content, '', w.pinyin || '', w.meaning || '')
  );

  const filteredSentences = sourceSentences.filter((s) =>
    matchesItem(s.content, '', s.pinyin || '', s.meaning || '')
  );

  const filteredRules = sourceRules.filter((r) =>
    matchesItem(r.content, '', '', '')
  );

  const linkedTotalCount = texts.length + words.length + sentences.length + rules.length;

  // Calculate matched global items count even when linked scope is selected
  const globalMatchCount = searchScope === 'global'
    ? filteredTexts.length + filteredWords.length + filteredSentences.length + filteredRules.length
    : (
      allTexts.filter((t) => matchesItem(t.content, t.title || '', t.pinyin || '', t.meaning || '')).length +
      allWords.filter((w) => matchesItem(w.content, '', w.pinyin || '', w.meaning || '')).length +
      allSentences.filter((s) => matchesItem(s.content, '', s.pinyin || '', s.meaning || '')).length +
      allRules.filter((r) => matchesItem(r.content, '', '', '')).length
    );

  const totalFilteredCount = filteredTexts.length + filteredWords.length + filteredSentences.length + filteredRules.length;

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={true}
        label={character?.content || 'Character'}
        subtitle={character?.meaning?.split(',')[0] || undefined}
        items={[
          <TouchableOpacity
            key="write"
            onPress={() => router.push(`/pages/characterWrite/${characterId}` as any)}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Lucide name="pencil-line" size={18} color="#64748b" />
          </TouchableOpacity>,
          <TouchableOpacity
            key="edit"
            onPress={() => router.push(`/pages/addCharacter?characterId=${characterId}` as any)}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Lucide name="pencil" size={18} color="#64748b" />
          </TouchableOpacity>,
          <TouchableOpacity
            key="add"
            onPress={() => router.push('/pages/addCharacter' as any)}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Lucide name="plus" size={18} color="#64748b" />
          </TouchableOpacity>,
        ]}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={toneColor}
            colors={[toneColor]}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HERO CARD ── */}
        <CharacterHeroCard
          character={character}
          hsk={hsk}
          lesson={lesson}
          textCount={filteredTexts.length}
          wordCount={filteredWords.length}
          sentenceCount={filteredSentences.length}
          ruleCount={filteredRules.length}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onWrite={() => router.push(`/pages/characterWrite/${characterId}` as any)}
          onEdit={() => router.push(`/pages/addCharacter?characterId=${characterId}` as any)}
          showPinyin={showPinyin}
          setShowPinyin={setShowPinyin}
          showMeaning={showMeaning}
          setShowMeaning={setShowMeaning}
          searchQuery={searchQuery}
        />

        {/* ── UNIFIED CONTROLS: SEARCH, SCOPE & TABS ── */}
        <DetailControlPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            searchScope === 'linked'
              ? "Search character's linked content..."
              : "Search all database texts, sentences, words..."
          }
          searchScope={searchScope}
          onSelectScope={setSearchScope}
          accentColor={toneColor}
          linkedTotalCount={linkedTotalCount}
          globalTotalCount={globalMatchCount}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            texts: filteredTexts.length,
            words: filteredWords.length,
            sentences: filteredSentences.length,
            rules: filteredRules.length,
          }}
        />

        {/* ── READING TEXTS ── */}
        {(activeTab === 'all' || activeTab === 'texts') && (
          <CharacterDetailSection
            title="Reading Texts"
            iconName="file-text"
            badgeColor="#3b82f6"
            count={filteredTexts.length}
            addBtnText="add text"
            onAddPress={() => router.push(`/pages/addText?characterId=${characterId}` as any)}
            emptyLabel="No reading texts linked yet"
          >
            {filteredTexts.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((textObj, idx) => (
              <TextCard
                key={textObj.id || idx}
                textObj={textObj}
                index={idx}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                isPlaying={playingItemId === `text-${textObj.id}`}
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
                    pathname: `/pages/texts/${characterId}`,
                    params: {
                      characterId,
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
          </CharacterDetailSection>
        )}

        {/* ── VOCABULARY WORDS ── */}
        {(activeTab === 'all' || activeTab === 'words') && (
          <CharacterDetailSection
            title="Vocabulary Words"
            iconName="languages"
            badgeColor="#059669"
            count={filteredWords.length}
            addBtnText="add word"
            onAddPress={() => router.push(`/pages/addWord?characterId=${characterId}` as any)}
            emptyLabel="No vocabulary words linked yet"
          >
            <View style={styles.wordsGrid}>
              {filteredWords.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((word, idx) => (
                // <View key={word.id || idx} style={{ width: '48.5%' }}>
                <WordCard
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
                    pathname: `/pages/words/${characterId}`,
                    params: {
                      characterId,
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
          </CharacterDetailSection>
        )}

        {/* ── EXAMPLE SENTENCES ── */}
        {(activeTab === 'all' || activeTab === 'sentences') && (
          <CharacterDetailSection
            title="Example Sentences"
            iconName="message-square-text"
            badgeColor="#8b5cf6"
            count={filteredSentences.length}
            addBtnText="add sentence"
            onAddPress={() => router.push(`/pages/addSentence?characterId=${characterId}` as any)}
            emptyLabel="No example sentences linked yet"
          >
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
                    pathname: `/pages/sentences/${characterId}`,
                    params: {
                      characterId,
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
          </CharacterDetailSection>
        )}

        {/* ── GRAMMAR RULES ── */}
        {(activeTab === 'all' || activeTab === 'rules') && (
          <CharacterDetailSection
            title="Grammar Points"
            iconName="graduation-cap"
            badgeColor="#d97706"
            count={filteredRules.length}
            addBtnText="add rule"
            onAddPress={() => router.push(`/pages/addRule?characterId=${characterId}` as any)}
            emptyLabel="No grammar points linked yet"
          >
            {filteredRules.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((rule, idx) => (
              <RuleCard
                key={rule.id || idx}
                rule={rule}
                index={idx}
                isPlaying={playingItemId === `rule-${rule.id}`}
                onPlayAudio={(id, content) => playItemAudio(id, content, `rule-${id}`)}
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
                    pathname: `/pages/rules/${characterId}`,
                    params: {
                      characterId,
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
          </CharacterDetailSection>
        )}

        {/* ── SEARCH QUERY NO RESULTS EMPTY STATE ── */}
        {q.length > 0 && totalFilteredCount === 0 && (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: toneColor + '18' }]}>
              <Lucide name="search-x" size={36} color={toneColor} />
            </View>
            <Text style={styles.emptyTitle}>No matching results</Text>
            <Text style={styles.emptySubtitle}>
              No items matched "{q}" in {searchScope === 'linked' ? 'linked content' : 'the database'}.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
};

export default CharacterDetails;

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
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  headerIconBtnActive: {
    backgroundColor: '#fdf2f8',
    borderColor: '#ec4899',
  },

  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: 8,
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});

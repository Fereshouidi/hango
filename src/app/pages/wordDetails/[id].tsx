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
  getWordById,
  getHSKById,
  getLessonById,
  getHSKsByWordId,
  getLessonsByWordId,
  getTextsByWordId,
  getSentencesByWordId,
  getCharactersByWordId,
  getRulesByWordId,
  getAllTexts,
  getAllSentences,
  getAllCharacters,
  getAllRules,
} from '@/db/utils';
import { speakChineseText } from '@/utils/tts';
import { TextCard } from '@/components/cards/TextCard';
import { SentenceCard } from '@/components/cards/SentenceCard';
import { CharacterCard } from '@/components/cards/CharacterCard';
import { RuleCard } from '@/components/cards/RuleCard';
import { SearchBar } from '@/components/common/SearchBar';
import { CategoryTabs, CategoryTabType } from '@/components/common/CategoryTabs';
import { WordHeroCard } from '@/components/details/WordHeroCard';
import { CharacterScopeToggle } from '@/components/details/CharacterScopeToggle';
import { CharacterDetailSection } from '@/components/details/CharacterDetailSection';
import { ThemedText } from '@/components/themed-text';

const WordDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; wordId?: string }>();
  const rawId = params.wordId || params.id;
  const wordId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : 1;

  const [word, setWord] = useState<WordType | null>(null);
  const [hsk, setHsk] = useState<HSKType | null>(null);
  const [lesson, setLesson] = useState<LessonType | null>(null);

  // Linked content state
  const [texts, setTexts] = useState<TextType[]>([]);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [characters, setCharacters] = useState<CharacterType[]>([]);
  const [rules, setRules] = useState<RuleType[]>([]);

  // Global database state
  const [allTexts, setAllTexts] = useState<TextType[]>([]);
  const [allSentences, setAllSentences] = useState<SentenceType[]>([]);
  const [allCharacters, setAllCharacters] = useState<CharacterType[]>([]);
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

  const loadData = useCallback(() => {
    try {
      if (!wordId) return;

      const wordData = getWordById(wordId);
      setWord(wordData);

      // Resolve HSK: check FK column, then junction table
      if (wordData?.hskId) {
        setHsk(getHSKById(wordData.hskId));
      } else {
        const hsks = getHSKsByWordId(wordId) as unknown as HSKType[];
        setHsk(hsks?.[0] ?? null);
      }

      // Resolve Lesson: check FK column, then junction table
      if (wordData?.lessonId) {
        setLesson(getLessonById(wordData.lessonId));
      } else {
        const lessons = getLessonsByWordId(wordId) as unknown as LessonType[];
        setLesson(lessons?.[0] ?? null);
      }

      // Load linked items
      setTexts((getTextsByWordId(wordId) as unknown as TextType[]) || []);
      setSentences((getSentencesByWordId(wordId) as unknown as SentenceType[]) || []);
      setCharacters((getCharactersByWordId(wordId) as unknown as CharacterType[]) || []);
      setRules((getRulesByWordId(wordId) as unknown as RuleType[]) || []);

      // Load all DB items
      setAllTexts((getAllTexts() as unknown as TextType[]) || []);
      setAllSentences((getAllSentences() as unknown as SentenceType[]) || []);
      setAllCharacters((getAllCharacters() as unknown as CharacterType[]) || []);
      setAllRules((getAllRules() as unknown as RuleType[]) || []);
    } catch (error) {
      console.error('Error loading word details:', error);
    }
  }, [wordId]);

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
    if (!word?.content) return;
    setIsPlaying(true);
    speakChineseText(
      word.content,
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
  const sourceSentences = searchScope === 'linked' ? sentences : allSentences;
  const sourceCharacters = searchScope === 'linked' ? characters : allCharacters;
  const sourceRules = searchScope === 'linked' ? rules : allRules;

  // ── Search & Filter Logic ──
  const q = searchQuery.toLowerCase().trim();
  const wordSymbol = word?.content?.trim() || '';

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
      if (!wordSymbol) return true;
      const lowerSymbol = wordSymbol.toLowerCase();
      return c.includes(lowerSymbol) || t.includes(lowerSymbol) || m.includes(lowerSymbol);
    }

    return true;
  };

  const filteredTexts = sourceTexts.filter((t) =>
    matchesItem(t.content, t.title || '', t.pinyin || '', t.meaning || '')
  );

  const filteredSentences = sourceSentences.filter((s) =>
    matchesItem(s.content, '', s.pinyin || '', s.meaning || '')
  );

  const filteredCharacters = sourceCharacters.filter((ch) =>
    matchesItem(ch.content, '', ch.pinyin || '', ch.meaning || '')
  );

  const filteredRules = sourceRules.filter((r) =>
    matchesItem(r.content, '', '', '')
  );

  const linkedTotalCount = texts.length + sentences.length + characters.length + rules.length;

  const globalMatchCount = searchScope === 'global'
    ? filteredTexts.length + filteredSentences.length + filteredCharacters.length + filteredRules.length
    : (
        allTexts.filter((t) => matchesItem(t.content, t.title || '', t.pinyin || '', t.meaning || '')).length +
        allSentences.filter((s) => matchesItem(s.content, '', s.pinyin || '', s.meaning || '')).length +
        allCharacters.filter((ch) => matchesItem(ch.content, '', ch.pinyin || '', ch.meaning || '')).length +
        allRules.filter((r) => matchesItem(r.content, '', '', '')).length
      );

  const totalFilteredCount = filteredTexts.length + filteredSentences.length + filteredCharacters.length + filteredRules.length;

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={true}
        label={word?.content || 'Word Details'}
        subtitle={word?.meaning?.split(',')[0] || undefined}
        items={[
          <TouchableOpacity
            key="edit"
            onPress={() => router.push(`/pages/addWord?wordId=${wordId}` as any)}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Lucide name="pencil" size={18} color="#64748b" />
          </TouchableOpacity>,
          <TouchableOpacity
            key="add"
            onPress={() => router.push('/pages/addWord' as any)}
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
            tintColor="#059669"
            colors={['#059669']}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HERO CARD ── */}
        <WordHeroCard
          word={word}
          hsk={hsk}
          lesson={lesson}
          textCount={filteredTexts.length}
          sentenceCount={filteredSentences.length}
          characterCount={filteredCharacters.length}
          ruleCount={filteredRules.length}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onEdit={() => router.push(`/pages/addWord?wordId=${wordId}` as any)}
          showPinyin={showPinyin}
          setShowPinyin={setShowPinyin}
          showMeaning={showMeaning}
          setShowMeaning={setShowMeaning}
        />

        {/* ── SEARCH & SCOPE SELECTOR ── */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              searchScope === 'linked'
                ? "Search word's linked content..."
                : "Search all database texts, sentences, words..."
            }
          />

          <CharacterScopeToggle
            searchScope={searchScope}
            onSelectScope={setSearchScope}
            toneColor="#059669"
            linkedTotalCount={linkedTotalCount}
            globalTotalCount={globalMatchCount}
          />
        </View>

        {/* ── CATEGORY TABS ── */}
        <CategoryTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            texts: filteredTexts.length,
            words: 0,
            sentences: filteredSentences.length,
            characters: filteredCharacters.length,
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
            onAddPress={() => router.push(`/pages/addText?wordId=${wordId}` as any)}
            emptyLabel="No reading texts linked yet"
          >
            {filteredTexts.map((textObj, idx) => (
              <TextCard
                key={textObj.id || idx}
                textObj={textObj}
                index={idx}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                isPlaying={playingItemId === `text-${textObj.id}`}
                onPlayAudio={(id, content) => playItemAudio(id, content, `text-${id}`)}
              />
            ))}
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
            onAddPress={() => router.push(`/pages/addSentence?wordId=${wordId}` as any)}
            emptyLabel="No example sentences linked yet"
          >
            {filteredSentences.map((sentence, idx) => (
              <SentenceCard
                key={sentence.id || idx}
                sentence={sentence}
                index={idx}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                isPlaying={playingItemId === `sentence-${sentence.id}`}
                onPlayAudio={(id, content) => playItemAudio(id, content, `sentence-${id}`)}
              />
            ))}
          </CharacterDetailSection>
        )}

        {/* ── CHARACTERS ── */}
        {(activeTab === 'all' || activeTab === 'characters') && (
          <CharacterDetailSection
            title="Characters"
            iconName="spell-check"
            badgeColor="#ec4899"
            count={filteredCharacters.length}
            addBtnText="add character"
            onAddPress={() => router.push(`/pages/addCharacter?wordId=${wordId}` as any)}
            emptyLabel="No characters linked yet"
          >
            <View style={styles.charsGrid}>
              {filteredCharacters.map((charObj, idx) => (
                <View key={charObj.id || idx} style={{ width: '48%' }}>
                    {/* <ThemedText style={{color: "black"}}>{JSON.stringify(charObj, null, 2)}</ThemedText> */}
                  {charObj && <CharacterCard
                    character={charObj as unknown as CharacterType}
                    showPinyin={showPinyin}
                    showMeaning={showMeaning}
                    isPlaying={playingItemId === `char-${charObj.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `char-${id}`)}
                  />}
                </View>
              ))}
            </View>
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
            onAddPress={() => router.push(`/pages/addRule?wordId=${wordId}` as any)}
            emptyLabel="No grammar points linked yet"
          >
            {filteredRules.map((rule, idx) => (
              <RuleCard
                key={rule.id || idx}
                rule={rule}
                index={idx}
                isPlaying={playingItemId === `rule-${rule.id}`}
                onPlayAudio={(id, content) => playItemAudio(id, content, `rule-${id}`)}
              />
            ))}
          </CharacterDetailSection>
        )}

        {/* ── SEARCH QUERY NO RESULTS EMPTY STATE ── */}
        {q.length > 0 && totalFilteredCount === 0 && (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: '#05966918' }]}>
              <Lucide name="search-x" size={36} color="#059669" />
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

export default WordDetails;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 10,
    gap: 8,
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
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
  },
  searchContainer: {
    marginTop: 4,
    gap: 8,
  },
  charsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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

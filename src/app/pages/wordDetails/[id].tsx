import { CharacterCard } from '@/components/cards/CharacterCard';
import { RuleCard } from '@/components/cards/RuleCard';
import { SentenceCard } from '@/components/cards/SentenceCard';
import { TextCard } from '@/components/cards/TextCard';
import { CategoryTabType } from '@/components/common/CategoryTabs';
import { DetailControlPanel } from '@/components/common/DetailControlPanel';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { OptionsMenuModal, OptionItem } from '@/components/common/OptionsMenuModal';
import { ViewAllButton } from '@/components/common/ViewAllButton';
import { CharacterDetailSection } from '@/components/details/CharacterDetailSection';
import { WordHeroCard } from '@/components/details/WordHeroCard';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import {
  deleteCharacter,
  deleteRule,
  deleteSentence,
  deleteText,
  getAllCharacters,
  getAllRules,
  getAllSentences,
  getAllTexts,
  getCharactersByWordId,
  getHSKById,
  getHSKsByWordId,
  getLessonById,
  getLessonsByWordId,
  getRulesByWordId,
  getSentencesByWordId,
  getTextsByWordId,
  getWordById,
  unlinkCharacterFromWord,
  unlinkRuleFromWord,
  unlinkSentenceFromWord,
  unlinkTextFromWord,
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
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ITEM_LIMIT = 3;
const PAGE_SIZE = 10;

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

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Options Menu state
  const [activeItem, setActiveItem] = useState<{
    type: 'text' | 'sentence' | 'character' | 'rule';
    item: any;
  } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleOpenOptions = (
    type: 'text' | 'sentence' | 'character' | 'rule',
    item: any
  ) => {
    setActiveItem({ type, item });
    setMenuVisible(true);
  };

  const buildMenuOptions = (): OptionItem[] => {
    if (!activeItem || !activeItem.item) return [];
    const { type, item } = activeItem;
    const typeLabel =
      type === 'text'
        ? 'Text'
        : type === 'sentence'
        ? 'Sentence'
        : type === 'character'
        ? 'Character'
        : 'Rule';

    return [
      {
        id: 'view',
        label: 'View Details',
        iconName: 'external-link',
        color: '#059669',
        onPress: () => {
          setMenuVisible(false);
          setActiveItem(null);
          if (type === 'text') router.push(`/pages/textDetails/${item.id}` as any);
          else if (type === 'sentence') router.push(`/pages/sentenceDetails/${item.id}` as any);
          else if (type === 'character') router.push(`/pages/characterDetails/${item.id}` as any);
          else if (type === 'rule') router.push(`/pages/ruleDetails/${item.id}` as any);
        },
      },
      {
        id: 'remove',
        label: `Remove from Word`,
        iconName: 'minus-circle',
        color: '#ef4444',
        destructive: true,
        onPress: () => {
          Alert.alert(
            'Remove from Word',
            `Are you sure you want to remove this ${typeLabel.toLowerCase()} from "${word?.content || ''}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  try {
                    if (type === 'text') unlinkTextFromWord(item.id, wordId);
                    else if (type === 'sentence') unlinkSentenceFromWord(item.id, wordId);
                    else if (type === 'character') unlinkCharacterFromWord(item.id, wordId);
                    else if (type === 'rule') unlinkRuleFromWord(item.id, wordId);
                    loadData();
                  } catch (e) {
                    Alert.alert('Error', 'Failed to remove item from word.');
                  }
                },
              },
            ]
          );
        },
      },
      {
        id: 'delete',
        label: `Delete ${typeLabel} Permanently`,
        iconName: 'trash-2',
        color: '#dc2626',
        destructive: true,
        onPress: () => {
          Alert.alert(
            `Delete ${typeLabel}`,
            `Are you sure you want to permanently delete this ${typeLabel.toLowerCase()}? This cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  try {
                    if (type === 'text') deleteText(item.id);
                    else if (type === 'sentence') deleteSentence(item.id);
                    else if (type === 'character') deleteCharacter(item.id);
                    else if (type === 'rule') deleteRule(item.id);
                    loadData();
                  } catch (e) {
                    Alert.alert('Error', `Failed to delete ${typeLabel.toLowerCase()}.`);
                  }
                },
              },
            ]
          );
        },
      },
    ];
  };

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, searchQuery, searchScope]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

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
  const effectiveHighlight = searchQuery.trim() || wordSymbol;
  const wideSearchHighlightStyle = effectiveHighlight
    ? {
        backgroundColor: '#fee2e2',
        color: '#ef4444',
        fontWeight: '800' as const,
        borderRadius: 4,
        paddingHorizontal: 2,
      }
    : undefined;

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
            <Lucide name="pencil" size={18} color="#1e293b" />
          </TouchableOpacity>,
          <TouchableOpacity
            key="add"
            onPress={() => router.push('/pages/addWord' as any)}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Lucide name="plus" size={18} color="#1e293b" />
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
          searchQuery={searchQuery}
        />

        {/* ── UNIFIED CONTROLS: SEARCH, SCOPE & TABS ── */}
        <DetailControlPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            searchScope === 'linked'
              ? "Search word's linked content..."
              : "Search all database texts, sentences, words..."
          }
          searchScope={searchScope}
          onSelectScope={setSearchScope}
          accentColor="#059669"
          linkedTotalCount={linkedTotalCount}
          globalTotalCount={globalMatchCount}
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
            {filteredTexts.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((textObj, idx) => (
              <TextCard
                key={textObj.id || idx}
                textObj={textObj}
                index={idx}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                isPlaying={playingItemId === `text-${textObj.id}`}
                onPlayAudio={(id, content) => playItemAudio(id, content, `text-${id}`)}
                searchQuery={effectiveHighlight}
                highlightStyle={wideSearchHighlightStyle}
                onOptionsPress={(item) => handleOpenOptions('text', item)}
              />
            ))}
            {activeTab === 'all' && filteredTexts.length > 0 && (
              <ViewAllButton
                count={filteredTexts.length}
                label="Reading Texts"
                accentColor="#3b82f6"
                onPress={() =>
                  router.push({
                    pathname: `/pages/texts/${wordId}`,
                    params: {
                      wordId,
                      scope: searchScope,
                      search: effectiveHighlight,
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
            {filteredSentences.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((sentence, idx) => (
              <SentenceCard
                key={sentence.id || idx}
                sentence={sentence}
                index={idx}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                isPlaying={playingItemId === `sentence-${sentence.id}`}
                onPlayAudio={(id, content) => playItemAudio(id, content, `sentence-${id}`)}
                searchQuery={effectiveHighlight}
                highlightStyle={wideSearchHighlightStyle}
                onOptionsPress={(item) => handleOpenOptions('sentence', item)}
              />
            ))}
            {activeTab === 'all' && filteredSentences.length > 0 && (
              <ViewAllButton
                count={filteredSentences.length}
                label="Sentences"
                accentColor="#8b5cf6"
                onPress={() =>
                  router.push({
                    pathname: `/pages/sentences/${wordId}`,
                    params: {
                      wordId,
                      scope: searchScope,
                      search: effectiveHighlight,
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

        {/* ── CHARACTERS ── */}
        {(activeTab === 'all' || activeTab === 'characters') && (
          <CharacterDetailSection
            title="Characters"
            iconName="character"
            badgeColor="#ec4899"
            count={filteredCharacters.length}
            addBtnText="add character"
            onAddPress={() => router.push(`/pages/addCharacter?wordId=${wordId}` as any)}
            emptyLabel="No characters linked yet"
          >
            <View style={styles.charsGrid}>
              {filteredCharacters.slice(0, activeTab === 'all' ? ITEM_LIMIT + 1 : visibleCount).map((charObj, idx) => (
                <View key={charObj.id || idx} style={{ width: '48.5%', marginBottom: 8 }}>
                  {charObj && (
                    <CharacterCard
                      character={charObj as unknown as CharacterType}
                      showPinyin={showPinyin}
                      showMeaning={showMeaning}
                      isPlaying={playingItemId === `char-${charObj.id}`}
                      onPlayAudio={(id, content) => playItemAudio(id, content, `char-${id}`)}
                      searchQuery={effectiveHighlight}
                      highlightStyle={wideSearchHighlightStyle}
                      onOptionsPress={(item) => handleOpenOptions('character', item)}
                    />
                  )}
                </View>
              ))}
            </View>
            {activeTab === 'all' && filteredCharacters.length > 0 && (
              <ViewAllButton
                count={filteredCharacters.length}
                label="Characters"
                accentColor="#ec489a"
                onPress={() =>
                  router.push({
                    pathname: `/pages/characters/${wordId}`,
                    params: {
                      wordId,
                      scope: searchScope,
                      search: effectiveHighlight,
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
            {filteredRules.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((rule, idx) => (
              <RuleCard
                key={rule.id || idx}
                rule={rule}
                index={idx}
                isPlaying={playingItemId === `rule-${rule.id}`}
                onPlayAudio={(id, content) => playItemAudio(id, content, `rule-${id}`)}
                searchQuery={effectiveHighlight}
                highlightStyle={wideSearchHighlightStyle}
                onOptionsPress={(item) => handleOpenOptions('rule', item)}
              />
            ))}
            {activeTab === 'all' && filteredRules.length > 0 && (
              <ViewAllButton
                count={filteredRules.length}
                label="Grammar Points"
                accentColor="#d97706"
                onPress={() =>
                  router.push({
                    pathname: `/pages/rules/${wordId}`,
                    params: {
                      wordId,
                      scope: searchScope,
                      search: effectiveHighlight,
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

      <OptionsMenuModal
        visible={menuVisible}
        onClose={() => {
          setMenuVisible(false);
          setActiveItem(null);
        }}
        title={
          activeItem?.item
            ? activeItem.type === 'text'
              ? activeItem.item.title || 'Text Options'
              : `"${activeItem.item.content}" Options`
            : 'Options'
        }
        options={buildMenuOptions()}
      />
    </ThemedView>
  );
};

export default WordDetails;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 5,
    gap: 4,
    paddingBottom: 0,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  headerIconBtnActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
  },

  charsGrid: {
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

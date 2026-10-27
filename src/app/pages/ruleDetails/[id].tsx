import { CharacterCard } from '@/components/cards/CharacterCard';
import { SentenceCard } from '@/components/cards/SentenceCard';
import { TextCard } from '@/components/cards/TextCard';
import { WordCard } from '@/components/cards/WordCard';
import { CategoryTabType } from '@/components/common/CategoryTabs';
import { DetailControlPanel } from '@/components/common/DetailControlPanel';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { OptionsMenuModal, OptionItem } from '@/components/common/OptionsMenuModal';
import { ViewAllButton } from '@/components/common/ViewAllButton';
import { CharacterIcon } from '@/components/common/CharacterIcon';
import { RuleHeroCard } from '@/components/details/RuleHeroCard';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import {
  deleteCharacter,
  deleteSentence,
  deleteText,
  deleteWord,
  getAllCharacters,
  getAllSentences,
  getAllTexts,
  getAllWords,
  getCharactersByRuleId,
  getHSKsByRuleId,
  getLessonsByRuleId,
  getRuleById,
  getSentencesByRuleId,
  getTextsByRuleId,
  getWordsByRuleId,
  unlinkCharacterFromRule,
  unlinkSentenceFromRule,
  unlinkTextFromRule,
  unlinkWordFromRule,
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
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const ITEM_LIMIT = 4;
const PAGE_SIZE = 10;

const RuleDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; ruleId?: string }>();
  const rawId = params.ruleId || params.id;
  const ruleId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : 1;

  const [ruleObj, setRuleObj] = useState<RuleType | null>(null);
  const [hsks, setHsks] = useState<HSKType[]>([]);
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [texts, setTexts] = useState<TextType[]>([]);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [words, setWords] = useState<WordType[]>([]);
  const [characters, setCharacters] = useState<CharacterType[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Audio Playback State
  const [isPlayingRule, setIsPlayingRule] = useState(false);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  // Toggles & Study Filters
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'linked' | 'global'>('linked');

  const [allTexts, setAllTexts] = useState<TextType[]>([]);
  const [allSentences, setAllSentences] = useState<SentenceType[]>([]);
  const [allWords, setAllWords] = useState<WordType[]>([]);
  const [allCharacters, setAllCharacters] = useState<CharacterType[]>([]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Options Menu state
  const [activeItem, setActiveItem] = useState<{
    type: 'text' | 'word' | 'sentence' | 'character';
    item: any;
  } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleOpenOptions = (
    type: 'text' | 'word' | 'sentence' | 'character',
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
        : type === 'word'
        ? 'Word'
        : type === 'sentence'
        ? 'Sentence'
        : 'Character';

    return [
      {
        id: 'view',
        label: 'View Details',
        iconName: 'external-link',
        color: '#ec4899',
        onPress: () => {
          setMenuVisible(false);
          setActiveItem(null);
          if (type === 'text') router.push(`/pages/textDetails/${item.id}` as any);
          else if (type === 'word') router.push(`/pages/wordDetails/${item.id}` as any);
          else if (type === 'sentence') router.push(`/pages/sentenceDetails/${item.id}` as any);
          else if (type === 'character') router.push(`/pages/characterDetails/${item.id}` as any);
        },
      },
      {
        id: 'remove',
        label: `Remove from Rule`,
        iconName: 'minus-circle',
        color: '#ef4444',
        destructive: true,
        onPress: () => {
          Alert.alert(
            'Remove from Rule',
            `Are you sure you want to remove this ${typeLabel.toLowerCase()} from "${ruleObj?.content || 'Rule'}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  try {
                    if (type === 'text') unlinkTextFromRule(item.id, ruleId);
                    else if (type === 'word') unlinkWordFromRule(item.id, ruleId);
                    else if (type === 'sentence') unlinkSentenceFromRule(item.id, ruleId);
                    else if (type === 'character') unlinkCharacterFromRule(item.id, ruleId);
                    loadRuleData();
                  } catch (e) {
                    Alert.alert('Error', 'Failed to remove item from rule.');
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
                    else if (type === 'word') deleteWord(item.id);
                    else if (type === 'sentence') deleteSentence(item.id);
                    else if (type === 'character') deleteCharacter(item.id);
                    loadRuleData();
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

  const loadRuleData = useCallback(() => {
    try {
      if (!ruleId) return;
      const data = getRuleById(ruleId);
      setRuleObj(data);

      const hskData = getHSKsByRuleId(ruleId) as unknown as HSKType[];
      setHsks(hskData || []);

      const lessonData = getLessonsByRuleId(ruleId) as unknown as LessonType[];
      setLessons(lessonData || []);

      const textData = getTextsByRuleId(ruleId) as unknown as TextType[];
      setTexts(textData || []);

      const sentenceData = getSentencesByRuleId(ruleId) as unknown as SentenceType[];
      setSentences(sentenceData || []);

      const wordData = getWordsByRuleId(ruleId) as unknown as WordType[];
      setWords(wordData || []);

      const charData = getCharactersByRuleId(ruleId) as unknown as CharacterType[];
      setCharacters(charData || []);

      // Load all database items for global search
      setAllTexts((getAllTexts() as unknown as TextType[]) || []);
      setAllSentences((getAllSentences() as unknown as SentenceType[]) || []);
      setAllWords((getAllWords() as unknown as WordType[]) || []);
      setAllCharacters((getAllCharacters() as unknown as CharacterType[]) || []);
    } catch (error) {
      console.error('Error loading rule details:', error);
    }
  }, [ruleId]);

  useFocusEffect(
    useCallback(() => {
      loadRuleData();
    }, [loadRuleData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRuleData();
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, [loadRuleData]);

  // Play full rule content audio
  const handlePlayRule = () => {
    if (!ruleObj?.content) return;
    setIsPlayingRule(true);
    speakEnglishText(
      ruleObj.content,
      () => setIsPlayingRule(true),
      () => setIsPlayingRule(false)
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

  // ── Source selection based on scope ──
  const sourceTexts = searchScope === 'linked' ? texts : allTexts;
  const sourceSentences = searchScope === 'linked' ? sentences : allSentences;
  const sourceWords = searchScope === 'linked' ? words : allWords;
  const sourceCharacters = searchScope === 'linked' ? characters : allCharacters;

  // Search filtering
  const q = searchQuery.toLowerCase().trim();
  const ruleSymbol = ruleObj?.content?.trim() || '';

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

  const linkedTotalCount = texts.length + sentences.length + words.length + characters.length;
  const totalItemCount = filteredTexts.length + filteredSentences.length + filteredWords.length + filteredCharacters.length;

  const effectiveHighlight = searchQuery.trim() || ruleSymbol;
  const wideSearchHighlightStyle = effectiveHighlight
    ? {
        backgroundColor: '#fee2e2',
        color: '#ef4444',
        fontWeight: '800' as const,
        borderRadius: 4,
        paddingHorizontal: 2,
      }
    : undefined;



  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label={ruleObj ? `Rule #${ruleObj.id}` : 'Grammar Rule Details'}
        items={[
          <TouchableOpacity
            key="edit-rule"
            onPress={() => router.push(`/pages/addRule?ruleId=${ruleId}` as any)}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Lucide name="edit-3" size={18} color="#1e293b" />
          </TouchableOpacity>,
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#d97706']} />
        }
      >
        {/* HERO RULE CARD */}
        <RuleHeroCard
          rule={ruleObj}
          ruleId={ruleId}
          hsks={hsks}
          lessons={lessons}
          textCount={texts.length}
          sentenceCount={sentences.length}
          wordCount={words.length}
          characterCount={characters.length}
          isPlaying={isPlayingRule}
          onPlay={handlePlayRule}
          showPinyin={showPinyin}
          setShowPinyin={setShowPinyin}
          showMeaning={showMeaning}
          setShowMeaning={setShowMeaning}
        />

        {/* UNIFIED CONTROLS: SEARCH & TABS */}
        <DetailControlPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search items in this rule..."
          accentColor="#d97706"
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            texts: filteredTexts.length,
            sentences: filteredSentences.length,
            words: filteredWords.length,
            characters: filteredCharacters.length,
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
                onPress={() => router.push(ruleId ? `/pages/addText?ruleId=${ruleId}` : '/pages/addText')}
              >
                <Lucide name="plus" size={14} color="#3b82f6" />
                <Text style={[styles.addInlineText, { color: '#3b82f6' }]}>Text</Text>
              </TouchableOpacity>
            </View>

            {filteredTexts.length === 0 ? (
              <Text style={styles.emptyText}>No reading texts linked to this rule.</Text>
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
                    searchQuery={effectiveHighlight}
                    highlightStyle={wideSearchHighlightStyle}
                    onOptionsPress={(item) => handleOpenOptions('text', item)}
                  />
                ))}
                {activeTab === 'all' && filteredTexts.length > ITEM_LIMIT && (
                  <ViewAllButton
                    count={filteredTexts.length}
                    label="Reading Texts"
                    accentColor="#3b82f6"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/texts/${ruleId}`,
                        params: {
                          ruleId,
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
              </>
            )}
          </View>
        )}

        {/* SENTENCES SECTION */}
        {(activeTab === 'all' || activeTab === 'sentences') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Lucide name="message-square-text" size={18} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Sentences ({filteredSentences.length})</Text>
              <TouchableOpacity
                style={styles.addInlineBtn}
                onPress={() => router.push(ruleId ? `/pages/addSentence?ruleId=${ruleId}` : '/pages/addSentence')}
              >
                <Lucide name="plus" size={14} color="#8b5cf6" />
                <Text style={styles.addInlineText}>Sentence</Text>
              </TouchableOpacity>
            </View>

            {filteredSentences.length === 0 ? (
              <Text style={styles.emptyText}>No sentences linked to this rule.</Text>
            ) : (
              <>
                {filteredSentences.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((s, idx) => (
                  <SentenceCard
                    key={s.id || idx}
                    sentence={s}
                    index={idx}
                    showPinyin={showPinyin}
                    showMeaning={showMeaning}
                    isPlaying={playingItemId === `sentence-${s.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `sentence-${id}`)}
                    searchQuery={effectiveHighlight}
                    highlightStyle={wideSearchHighlightStyle}
                    onOptionsPress={(item) => handleOpenOptions('sentence', item)}
                  />
                ))}
                {activeTab === 'all' && filteredSentences.length > ITEM_LIMIT && (
                  <ViewAllButton
                    count={filteredSentences.length}
                    label="Sentences"
                    accentColor="#8b5cf6"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/sentences/${ruleId}`,
                        params: {
                          ruleId,
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
                onPress={() => router.push(ruleId ? `/pages/addWord?ruleId=${ruleId}` : '/pages/addWord')}
              >
                <Lucide name="plus" size={14} color="#059669" />
                <Text style={[styles.addInlineText, { color: '#059669' }]}>Word</Text>
              </TouchableOpacity>
            </View>

            {filteredWords.length === 0 ? (
              <Text style={styles.emptyText}>No vocabulary words associated with this rule.</Text>
            ) : (
              <>
                <View style={styles.wordsGrid}>
                  {filteredWords.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((w) => (
                    <View key={w.id} style={{ width: '48.5%' }}>
                      <WordCard
                        word={w}
                        showPinyin={showPinyin}
                        showMeaning={showMeaning}
                        isPlaying={playingItemId === `word-${w.id}`}
                        onPlayAudio={(id, content) => playItemAudio(id, content, `word-${id}`)}
                        searchQuery={effectiveHighlight}
                        highlightStyle={wideSearchHighlightStyle}
                        onOptionsPress={(item) => handleOpenOptions('word', item)}
                      />
                    </View>
                  ))}
                </View>
                {activeTab === 'all' && filteredWords.length > ITEM_LIMIT && (
                  <ViewAllButton
                    count={filteredWords.length}
                    label="Vocabulary Words"
                    accentColor="#059669"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/words/${ruleId}`,
                        params: {
                          ruleId,
                          scope: searchScope,
                          search: effectiveHighlight,
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

        {/* CHARACTERS SECTION */}
        {(activeTab === 'all' || activeTab === 'characters') && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <CharacterIcon size={18} color="#ec4899" />
              <Text style={styles.sectionTitle}>Hanzi Characters ({filteredCharacters.length})</Text>
              <TouchableOpacity
                style={styles.addInlineBtn}
                onPress={() => router.push(ruleId ? `/pages/addCharacter?ruleId=${ruleId}` : '/pages/addCharacter')}
              >
                <Lucide name="plus" size={14} color="#ec4899" />
                <Text style={[styles.addInlineText, { color: '#ec4899' }]}>Character</Text>
              </TouchableOpacity>
            </View>

            {filteredCharacters.length === 0 ? (
              <Text style={styles.emptyText}>No characters linked to this rule.</Text>
            ) : (
              <>
                <View style={styles.charactersGrid}>
                  {filteredCharacters.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((c) => (
                    <View key={c.id} style={{ width: '48.5%', marginBottom: 8 }}>
                      <CharacterCard
                        char={c}
                        showPinyin={showPinyin}
                        showMeaning={showMeaning}
                        isPlaying={playingItemId === `char-${c.id}`}
                        onPlayAudio={(id, content) => playItemAudio(id, content, `char-${id}`)}
                        searchQuery={effectiveHighlight}
                        highlightStyle={wideSearchHighlightStyle}
                        onOptionsPress={(item) => handleOpenOptions('character', item)}
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
                        pathname: `/pages/characters/${ruleId}`,
                        params: {
                          ruleId,
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
                    accentColor="#ec4899"
                    itemLabel="characters"
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
            <Text style={styles.emptyTitle}>This rule has no linked items yet</Text>
            <Text style={styles.emptySubtitle}>
              Link texts, sentences, words, or characters using the Edit Rule page.
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
          activeItem
            ? `${activeItem.type.charAt(0).toUpperCase() + activeItem.type.slice(1)} Options`
            : 'Options'
        }
        options={buildMenuOptions()}
      />
    </ThemedView>
  );
};

export default RuleDetails;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 5,
    // paddingHorizontal: 10,
    gap: 5,
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
    backgroundColor: '#fef3c7',
    borderColor: '#d97706',
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

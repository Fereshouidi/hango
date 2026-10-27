import { CharacterCard } from '@/components/cards/CharacterCard';
import { RuleCard } from '@/components/cards/RuleCard';
import { SentenceCard } from '@/components/cards/SentenceCard';
import { WordCard } from '@/components/cards/WordCard';
import { CategoryTabType } from '@/components/common/CategoryTabs';
import { DetailControlPanel } from '@/components/common/DetailControlPanel';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { OptionsMenuModal, OptionItem } from '@/components/common/OptionsMenuModal';
import { ViewAllButton } from '@/components/common/ViewAllButton';
import { CharacterIcon } from '@/components/common/CharacterIcon';
import { PassageHeroCard } from '@/components/details/PassageHeroCard';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import {
  deleteCharacter,
  deleteRule,
  deleteSentence,
  deleteWord,
  getAllCharacters,
  getAllRules,
  getAllSentences,
  getAllWords,
  getCharactersByTextId,
  getHSKById,
  getLessonById,
  getRulesByTextId,
  getSentencesByTextId,
  getTextById,
  getWordsByTextId,
  unlinkCharacterFromText,
  unlinkRuleFromText,
  unlinkSentenceFromText,
  unlinkWordFromText,
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

const ITEM_LIMIT = 3;
const PAGE_SIZE = 10;

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

  // Global search scope state
  const [searchScope, setSearchScope] = useState<'linked' | 'global'>('linked');
  const [allSentences, setAllSentences] = useState<SentenceType[]>([]);
  const [allWords, setAllWords] = useState<WordType[]>([]);
  const [allCharacters, setAllCharacters] = useState<CharacterType[]>([]);
  const [allRules, setAllRules] = useState<RuleType[]>([]);

  const [refreshing, setRefreshing] = useState(false);

  // Audio Playback State
  const [isPlayingPassage, setIsPlayingPassage] = useState(false);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  // Toggles & Study Filters
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [showRubyPinyin, setShowRubyPinyin] = useState(false);
  const [activeTab, setActiveTab] = useState<CategoryTabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Options Menu state
  const [activeItem, setActiveItem] = useState<{
    type: 'sentence' | 'word' | 'character' | 'rule';
    item: any;
  } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleOpenOptions = (
    type: 'sentence' | 'word' | 'character' | 'rule',
    item: any
  ) => {
    setActiveItem({ type, item });
    setMenuVisible(true);
  };

  const buildMenuOptions = (): OptionItem[] => {
    if (!activeItem || !activeItem.item) return [];
    const { type, item } = activeItem;
    const typeLabel =
      type === 'sentence'
        ? 'Sentence'
        : type === 'word'
        ? 'Word'
        : type === 'character'
        ? 'Character'
        : 'Rule';

    return [
      {
        id: 'view',
        label: 'View Details',
        iconName: 'external-link',
        color: '#0284c7',
        onPress: () => {
          setMenuVisible(false);
          setActiveItem(null);
          if (type === 'sentence') router.push(`/pages/sentenceDetails/${item.id}` as any);
          else if (type === 'word') router.push(`/pages/wordDetails/${item.id}` as any);
          else if (type === 'character') router.push(`/pages/characterDetails/${item.id}` as any);
          else if (type === 'rule') router.push(`/pages/ruleDetails/${item.id}` as any);
        },
      },
      {
        id: 'remove',
        label: `Remove from Text`,
        iconName: 'minus-circle',
        color: '#ef4444',
        destructive: true,
        onPress: () => {
          Alert.alert(
            'Remove from Text',
            `Are you sure you want to remove this ${typeLabel.toLowerCase()} from this text?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  try {
                    if (type === 'sentence') unlinkSentenceFromText(item.id, textId);
                    else if (type === 'word') unlinkWordFromText(item.id, textId);
                    else if (type === 'character') unlinkCharacterFromText(item.id, textId);
                    else if (type === 'rule') unlinkRuleFromText(item.id, textId);
                    loadTextData();
                  } catch (e) {
                    Alert.alert('Error', 'Failed to remove item from text.');
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
                    if (type === 'sentence') deleteSentence(item.id);
                    else if (type === 'word') deleteWord(item.id);
                    else if (type === 'character') deleteCharacter(item.id);
                    else if (type === 'rule') deleteRule(item.id);
                    loadTextData();
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

      // Load global data for search
      setAllSentences((getAllSentences() as unknown as SentenceType[]) || []);
      setAllWords((getAllWords() as unknown as WordType[]) || []);
      setAllCharacters((getAllCharacters() as unknown as CharacterType[]) || []);
      setAllRules((getAllRules() as unknown as RuleType[]) || []);
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
  const textSymbol = textObj?.title?.trim() || textObj?.content?.slice(0, 10) || '';

  const sourceSentences = searchScope === 'linked' ? sentences : allSentences;
  const sourceWords = searchScope === 'linked' ? words : allWords;
  const sourceCharacters = searchScope === 'linked' ? characters : allCharacters;
  const sourceRules = searchScope === 'linked' ? rules : allRules;

  const filteredSentences = sourceSentences.filter(
    (s) =>
      !q ||
      s.content.toLowerCase().includes(q) ||
      s.pinyin.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q)
  );

  const filteredWords = sourceWords.filter(
    (w) =>
      !q ||
      w.content.toLowerCase().includes(q) ||
      w.pinyin.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q)
  );

  const filteredCharacters = sourceCharacters.filter(
    (c) =>
      !q ||
      c.content.toLowerCase().includes(q) ||
      c.pinyin.toLowerCase().includes(q) ||
      c.meaning.toLowerCase().includes(q)
  );

  const filteredRules = sourceRules.filter(
    (r) => !q || r.content.toLowerCase().includes(q)
  );

  const linkedTotalCount = sentences.length + words.length + characters.length + rules.length;
  const effectiveHighlight = searchQuery.trim();
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
        label={textObj?.title || 'Reading Text Details'}
        // subtitle={textObj?.meaning ? handleLongText(textObj?.pinyin, 30) : undefined}
        items={[
          <TouchableOpacity
            key="edit"
            style={styles.headerIconBtn}
            onPress={() => router.push(`/pages/addText?textId=${textId}` as any)}
            activeOpacity={0.7}
          >
            <Lucide name="pencil" size={18} color="#1e293b" />
          </TouchableOpacity>,
          <TouchableOpacity
            key="tts"
            style={[styles.headerAudioBtn, isPlayingPassage && styles.headerAudioBtnPlaying]}
            onPress={handlePlayPassage}
            activeOpacity={0.7}
          >
            <Lucide
              name={isPlayingPassage ? 'volume-2' : 'volume-1'}
              size={18}
              color={isPlayingPassage ? '#ffffff' : '#1e293b'}
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
          showRubyPinyin={showRubyPinyin}
          setShowRubyPinyin={setShowRubyPinyin}
          searchQuery={searchQuery}
        />

        {/* UNIFIED CONTROLS: SEARCH, SCOPE & TABS */}
        <DetailControlPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchScope === 'linked' ? 'Search in this text...' : 'Search all database...'}
          searchScope={searchScope}
          onSelectScope={setSearchScope}
          accentColor="#0284c7"
          linkedTotalCount={linkedTotalCount}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            sentences: filteredSentences.length,
            words: filteredWords.length,
            characters: filteredCharacters.length,
            rules: filteredRules.length,
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
              <>
                {filteredSentences.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((s, idx) => (
                  <SentenceCard
                    key={s.id}
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
                {activeTab === 'all' && filteredSentences.length > 0 && (
                  <ViewAllButton
                    count={filteredSentences.length}
                    label="Sentences"
                    accentColor="#8b5cf6"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/sentences/${textId}`,
                        params: {
                          textId,
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
                onPress={() => router.push(textId ? `/pages/addWord?textId=${textId}` : '/pages/addWord')}
              >
                <Lucide name="plus" size={14} color="#059669" />
                <Text style={[styles.addInlineText, { color: '#059669' }]}>Word</Text>
              </TouchableOpacity>
            </View>

            {filteredWords.length === 0 ? (
              <Text style={styles.emptyText}>No vocabulary words associated with this text.</Text>
            ) : (
              <>
                <View style={styles.wordsGrid}>
                  {filteredWords.slice(0, activeTab === 'all' ? ITEM_LIMIT + 1 : visibleCount).map((w) => (
                    // <View key={w.id} style={{ width: '48.5%' }}>
                    <WordCard
                      key={w.id}
                      word={w}
                      showPinyin={showPinyin}
                      showMeaning={showMeaning}
                      isPlaying={playingItemId === `word-${w.id}`}
                      onPlayAudio={(id, content) => playItemAudio(id, content, `word-${id}`)}
                      searchQuery={effectiveHighlight}
                      highlightStyle={wideSearchHighlightStyle}
                      onOptionsPress={(item) => handleOpenOptions('word', item)}
                    />
                    // </View>
                  ))}
                </View>
                {activeTab === 'all' && filteredWords.length > 0 && (
                  <ViewAllButton
                    count={filteredWords.length}
                    label="Vocabulary Words"
                    accentColor="#059669"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/words/${textId}`,
                        params: {
                          textId,
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
                onPress={() => router.push(textId ? `/pages/addCharacter?textId=${textId}` : '/pages/addCharacter')}
              >
                <Lucide name="plus" size={14} color="#ec4899" />
                <Text style={[styles.addInlineText, { color: '#ec4899' }]}>Character</Text>
              </TouchableOpacity>
            </View>

            {filteredCharacters.length === 0 ? (
              <Text style={styles.emptyText}>No characters linked to this text.</Text>
            ) : (
              <>
                <View style={styles.charactersGrid}>
                  {filteredCharacters.slice(0, activeTab === 'all' ? ITEM_LIMIT + 1 : visibleCount).map((c) => (
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
                {activeTab === 'all' && filteredCharacters.length > 0 && (
                  <ViewAllButton
                    count={filteredCharacters.length}
                    label="Characters"
                    accentColor="#ec489a"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/characters/${textId}`,
                        params: {
                          textId,
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
              <>
                {filteredRules.slice(0, activeTab === 'all' ? ITEM_LIMIT : visibleCount).map((r, idx) => (
                  <RuleCard
                    key={r.id}
                    rule={r}
                    index={idx}
                    isPlaying={playingItemId === `rule-${r.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `rule-${id}`, true)}
                    searchQuery={effectiveHighlight}
                    highlightStyle={wideSearchHighlightStyle}
                    onOptionsPress={(item) => handleOpenOptions('rule', item)}
                  />
                ))}
                {activeTab === 'all' && filteredRules.length > 0 && (
                  <ViewAllButton
                    count={filteredRules.length}
                    label="Grammar Rules"
                    accentColor="#d97706"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/rules/${textId}`,
                        params: {
                          textId,
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
                    itemLabel="grammar rules"
                    onLoadMore={handleLoadMore}
                  />
                )}
              </>
            )}
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
        title={activeItem?.item ? `"${activeItem.item.content}" Options` : 'Options'}
        options={buildMenuOptions()}
      />
    </ThemedView>
  );
};

export default TextDetails;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 5,
    // paddingHorizontal: 5,
    gap: 5,
  },
  headerAudioBtn: {
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
  headerAudioBtnPlaying: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
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
    // gap: 10,
    justifyContent: 'space-between',
  },
  charactersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

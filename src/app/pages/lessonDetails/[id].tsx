import { CharacterCard } from '@/components/cards/CharacterCard';
import { RuleCard } from '@/components/cards/RuleCard';
import { SentenceCard } from '@/components/cards/SentenceCard';
import { TextCard } from '@/components/cards/TextCard';
import { WordCard } from '@/components/cards/WordCard';
import { CategoryTabType } from '@/components/common/CategoryTabs';
import { DetailControlPanel } from '@/components/common/DetailControlPanel';
import { LoadMoreFooter } from '@/components/common/LoadMoreFooter';
import { OptionsMenuModal, OptionItem } from '@/components/common/OptionsMenuModal';
import { ViewAllButton } from '@/components/common/ViewAllButton';
import { CharacterIcon } from '@/components/common/CharacterIcon';
import { LessonHeroCard } from '@/components/details/LessonHeroCard';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import {
  deleteCharacter,
  deleteRule,
  deleteSentence,
  deleteText,
  deleteWord,
  getAllCharacters,
  getAllRules,
  getAllSentences,
  getAllTexts,
  getAllWords,
  getCharactersByLessonId,
  getHSKById,
  getLessonById,
  getRulesByLessonId,
  getSentencesByLessonId,
  getTextsByLessonId,
  getWordsByLessonId,
  unlinkCharacterFromLesson,
  unlinkRuleFromLesson,
  unlinkSentenceFromLesson,
  unlinkTextFromLesson,
  unlinkWordFromLesson,
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

const LessonDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; lessonId?: string }>();
  const rawId = params.lessonId || params.id;
  const lessonId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : 1;

  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [hsk, setHsk] = useState<HSKType | null>(null);
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

  const [allTexts, setAllTexts] = useState<TextType[]>([]);
  const [allSentences, setAllSentences] = useState<SentenceType[]>([]);
  const [allWords, setAllWords] = useState<WordType[]>([]);
  const [allCharacters, setAllCharacters] = useState<CharacterType[]>([]);
  const [allRules, setAllRules] = useState<RuleType[]>([]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Options Menu state
  const [activeItem, setActiveItem] = useState<{
    type: 'text' | 'sentence' | 'word' | 'character' | 'rule';
    item: any;
  } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleOpenOptions = (
    type: 'text' | 'sentence' | 'word' | 'character' | 'rule',
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
        color: '#2563eb',
        onPress: () => {
          setMenuVisible(false);
          setActiveItem(null);
          if (type === 'text') router.push(`/pages/textDetails/${item.id}` as any);
          else if (type === 'sentence') router.push(`/pages/sentenceDetails/${item.id}` as any);
          else if (type === 'word') router.push(`/pages/wordDetails/${item.id}` as any);
          else if (type === 'character') router.push(`/pages/characterDetails/${item.id}` as any);
          else if (type === 'rule') router.push(`/pages/ruleDetails/${item.id}` as any);
        },
      },
      {
        id: 'remove',
        label: `Remove from Lesson`,
        iconName: 'minus-circle',
        color: '#ef4444',
        destructive: true,
        onPress: () => {
          Alert.alert(
            'Remove from Lesson',
            `Are you sure you want to remove this ${typeLabel.toLowerCase()} from Lesson ${lesson?.num || ''}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  try {
                    if (type === 'text') unlinkTextFromLesson(item.id, lessonId);
                    else if (type === 'sentence') unlinkSentenceFromLesson(item.id, lessonId);
                    else if (type === 'word') unlinkWordFromLesson(item.id, lessonId);
                    else if (type === 'character') unlinkCharacterFromLesson(item.id, lessonId);
                    else if (type === 'rule') unlinkRuleFromLesson(item.id, lessonId);
                    loadLessonData();
                  } catch (e) {
                    Alert.alert('Error', 'Failed to remove item from lesson.');
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
                    else if (type === 'word') deleteWord(item.id);
                    else if (type === 'character') deleteCharacter(item.id);
                    else if (type === 'rule') deleteRule(item.id);
                    loadLessonData();
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

  const loadLessonData = useCallback(() => {
    try {
      if (!lessonId) return;
      const lessonData = getLessonById(lessonId);
      setLesson(lessonData);

      if (lessonData?.hskId) {
        const hskData = getHSKById(lessonData.hskId);
        setHsk(hskData);
      }

      const textData = getTextsByLessonId(lessonId) as unknown as TextType[];
      setTexts(textData || []);

      const sentenceData = getSentencesByLessonId(lessonId) as unknown as SentenceType[];
      setSentences(sentenceData || []);

      const wordData = getWordsByLessonId(lessonId) as unknown as WordType[];
      setWords(wordData || []);

      const charData = getCharactersByLessonId(lessonId) as unknown as CharacterType[];
      setCharacters(charData || []);

      const ruleData = getRulesByLessonId(lessonId) as unknown as RuleType[];
      setRules(ruleData || []);

      // Load all database items for global search
      setAllTexts((getAllTexts() as unknown as TextType[]) || []);
      setAllSentences((getAllSentences() as unknown as SentenceType[]) || []);
      setAllWords((getAllWords() as unknown as WordType[]) || []);
      setAllCharacters((getAllCharacters() as unknown as CharacterType[]) || []);
      setAllRules((getAllRules() as unknown as RuleType[]) || []);
    } catch (error) {
      console.error('Error loading lesson details:', error);
    }
  }, [lessonId]);

  useFocusEffect(
    useCallback(() => {
      loadLessonData();
    }, [loadLessonData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLessonData();
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, [loadLessonData]);

  // ── Source selection based on scope ──
  const sourceTexts = searchScope === 'linked' ? texts : allTexts;
  const sourceSentences = searchScope === 'linked' ? sentences : allSentences;
  const sourceWords = searchScope === 'linked' ? words : allWords;
  const sourceCharacters = searchScope === 'linked' ? characters : allCharacters;
  const sourceRules = searchScope === 'linked' ? rules : allRules;

  // Search filtering
  const q = searchQuery.toLowerCase().trim();
  const lessonSymbol = lesson?.title?.trim() || '';

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

  const filteredRules = sourceRules.filter((r) =>
    matchesItem(r.content, '', '', '')
  );

  const linkedTotalCount = texts.length + sentences.length + words.length + characters.length + rules.length;
  const totalItemCount = filteredTexts.length + filteredSentences.length + filteredWords.length + filteredCharacters.length + filteredRules.length;

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label={lesson ? `Lesson ${lesson.num}` : 'Lesson Details'}
        items={[
          <TouchableOpacity
            key="edit"
            onPress={() => router.push(`/pages/addLesson?lessonId=${lessonId}` as any)}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Lucide name="pencil" size={18} color="#1e293b" />
          </TouchableOpacity>,
          <TouchableOpacity
            key="pinyin-toggle"
            onPress={() => setShowPinyin((prev) => !prev)}
            activeOpacity={0.7}
            style={[styles.headerIconBtn, showPinyin && styles.headerIconBtnActive]}
          >
            <Lucide
              name="type"
              size={18}
              color={showPinyin ? '#2563eb' : '#1e293b'}
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
              color={showMeaning ? '#2563eb' : '#1e293b'}
            />
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
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO LESSON CARD */}
        <LessonHeroCard
          lesson={lesson}
          lessonId={lessonId}
          hsk={hsk}
          textCount={texts.length}
          sentenceCount={sentences.length}
          wordCount={words.length}
          characterCount={characters.length}
          ruleCount={rules.length}
          showPinyin={showPinyin}
          setShowPinyin={setShowPinyin}
          showMeaning={showMeaning}
          setShowMeaning={setShowMeaning}
          onEdit={() => router.push(`/pages/addLesson?lessonId=${lessonId}` as any)}
        />

        <View style={{ margin: 2 }}></View>

        {/* UNIFIED CONTROLS: SEARCH, SCOPE & TABS */}
        <DetailControlPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={
            searchScope === 'linked'
              ? 'Search content in this lesson...'
              : 'Search all database texts, sentences, words, rules...'
          }
          searchScope={searchScope}
          onSelectScope={setSearchScope}
          accentColor="#2563eb"
          linkedTotalCount={linkedTotalCount}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            texts: filteredTexts.length,
            sentences: filteredSentences.length,
            words: filteredWords.length,
            characters: filteredCharacters.length,
            rules: filteredRules.length,
          }}
        />

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
                onPress={() => { router.push(`/pages/addText?lessonId=${lessonId}`) }}
                style={[styles.addBtn, { backgroundColor: '#3b82f6' }]}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={styles.addBtnText}>add text</Text>
              </TouchableOpacity>
            </View>

            {filteredTexts.length === 0 ? (
              <Text style={styles.emptySectionText}>No reading texts linked to this lesson.</Text>
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
                        pathname: `/pages/texts/${lessonId}`,
                        params: {
                          lessonId,
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
                onPress={() => router.push(`/pages/addSentence?lessonId=${lessonId}`)}
                style={[styles.addBtn, { backgroundColor: '#8b5cf6' }]}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={styles.addBtnText}>add sentence</Text>
              </TouchableOpacity>
            </View>

            {filteredSentences.length === 0 ? (
              <Text style={styles.emptySectionText}>No sentences linked to this lesson.</Text>
            ) : (
              <>
                {filteredSentences.slice(0, activeTab === 'all' ? 3 : visibleCount).map((sentence, idx) => (
                  <SentenceCard
                    key={sentence.id || idx}
                    sentence={sentence}
                    index={idx}
                    showPinyin={showPinyin}
                    showMeaning={showMeaning}
                    isPlaying={playingItemId === `sentence-${sentence.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `sentence-${id}`)}
                    searchQuery={searchQuery}
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
                        pathname: `/pages/sentences/${lessonId}`,
                        params: {
                          lessonId,
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
                onPress={() => router.push(`/pages/addWord?lessonId=${lessonId}`)}
                style={[styles.addBtn, { backgroundColor: '#059669' }]}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={styles.addBtnText}>add word</Text>
              </TouchableOpacity>
            </View>

            {filteredWords.length === 0 ? (
              <Text style={styles.emptySectionText}>No vocabulary words linked to this lesson.</Text>
            ) : (
              <>
                <View style={styles.wordsGrid}>
                  {filteredWords.slice(0, activeTab === 'all' ? ITEM_LIMIT + 1 : visibleCount).map((word, idx) => (
                    <WordCard
                      key={word.id ?? idx}
                      word={word}
                      showPinyin={showPinyin}
                      showMeaning={showMeaning}
                      isPlaying={playingItemId === `word-${word.id}`}
                      onPlayAudio={(id, content) => playItemAudio(id, content, `word-${id}`)}
                      searchQuery={searchQuery}
                      onOptionsPress={(item) => handleOpenOptions('word', item)}
                    />
                  ))}
                </View>
                {activeTab === 'all' && filteredWords.length > 0 && (
                  <ViewAllButton
                    count={filteredWords.length}
                    label="Vocabulary Words"
                    accentColor="#059669"
                    onPress={() =>
                      router.push({
                        pathname: `/pages/words/${lessonId}`,
                        params: {
                          lessonId,
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
                <CharacterIcon size={15} color="#ffffff" />
              </View>
              <View style={styles.sectionHeaderCenter}>
                <Text style={styles.sectionHeading}>Characters (Hanzi)</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{filteredCharacters.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/pages/addCharacter?lessonId=${lessonId}`)}
                style={[styles.addBtn, { backgroundColor: '#ec489a' }]}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={styles.addBtnText}>add character</Text>
              </TouchableOpacity>
            </View>

            {filteredCharacters.length === 0 ? (
              <Text style={styles.emptySectionText}>No characters linked to this lesson.</Text>
            ) : (
              <>
                <View style={styles.charsGrid}>
                  {filteredCharacters.slice(0, activeTab === 'all' ? ITEM_LIMIT + 1 : visibleCount).map((char, idx) => (
                    <View key={char.id || idx} style={{ width: '48.5%', marginBottom: 8 }}>
                      <CharacterCard
                        char={char}
                        showPinyin={showPinyin}
                        showMeaning={showMeaning}
                        isPlaying={playingItemId === `char-${char.id}`}
                        onPlayAudio={(id, content) => playItemAudio(id, content, `char-${id}`)}
                        searchQuery={searchQuery}
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
                        pathname: `/pages/characters/${lessonId}`,
                        params: {
                          lessonId,
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
                onPress={() => router.push(`/pages/addRule?lessonId=${lessonId}`)}
                style={[styles.addBtn, { backgroundColor: '#d97706' }]}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={styles.addBtnText}>add rule</Text>
              </TouchableOpacity>
            </View>

            {filteredRules.length === 0 ? (
              <Text style={styles.emptySectionText}>No grammar points linked to this lesson.</Text>
            ) : (
              <>
                {filteredRules.slice(0, activeTab === 'all' ? 3 : visibleCount).map((rule, idx) => (
                  <RuleCard
                    key={rule.id || idx}
                    rule={rule}
                    index={idx}
                    isPlaying={playingItemId === `rule-${rule.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `rule-${id}`, true)}
                    searchQuery={searchQuery}
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
                        pathname: `/pages/rules/${lessonId}`,
                        params: {
                          lessonId,
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
            <Text style={styles.emptyTitle}>This lesson has no content yet</Text>
            <Text style={styles.emptySubtitle}>
              Link texts, sentences, words, or characters from the Add Lesson page.
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

export default LessonDetails;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 5,
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
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },

  sectionContainer: {
    gap: 10,
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#ffffffe6"
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: 10,
    justifyContent: 'space-between',
  },
  charsGrid: {
    width: "100%",
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

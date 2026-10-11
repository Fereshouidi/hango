import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import {
  getAllHSKs,
  getAllLessons,
  getTextsPaged,
  getTextsCount,
  getSentencesPaged,
  getSentencesCount,
  getCharactersPaged,
  getCharactersCountPaged,
  getRulesPaged,
  getRulesCount,
  getWordById,
  getHSKsByWordId,
  getLessonsByWordId,
  getTextsByWordId,
  getSentencesByWordId,
  getCharactersByWordId,
  getRulesByWordId,
  updateWord,
  updateWordRelations,
  linkWordRelations,
  db,
} from '@/db/utils';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  HSKType,
  LessonType,
  TextType,
  SentenceType,
  CharacterType,
  RuleType,
} from '@/types';
import {
  CharacterCard,
  ItemCard,
  SliderSection,
  SliderLoadMoreCard,
} from '@/components/add-lesson';
import { usePagedSection } from '@/hooks/usePagedSection';
import { SuccessBanner } from '@/components/banners';

const SLIDER_PAGE_SIZE = 10;

const AddWord = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawEditId = params.wordId || params.id;
  const editWordId = rawEditId && !isNaN(Number(rawEditId)) ? Number(rawEditId) : null;
  const isEditing = Boolean(editWordId);

  const preselectedHskId = params.hskId ? Number(params.hskId) : null;
  const preselectedLessonId = params.lessonId ? Number(params.lessonId) : null;
  const preselectedTextId = params.textId ? Number(params.textId) : null;
  const preselectedSentenceId = params.sentenceId ? Number(params.sentenceId) : null;

  // Word Form fields
  const [content, setContent] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [meaning, setMeaning] = useState('');

  // All entities from DB
  const [hsks, setHsks] = useState<HSKType[]>([]);
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [texts, setTexts] = useState<TextType[]>([]);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [allCharacters, setAllCharacters] = useState<CharacterType[]>([]);
  const [allRules, setAllRules] = useState<RuleType[]>([]);

  // Selected multi-entity IDs
  const [selectedHskIds, setSelectedHskIds] = useState<Set<number>>(
    preselectedHskId ? new Set([preselectedHskId]) : new Set()
  );
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<number>>(
    preselectedLessonId ? new Set([preselectedLessonId]) : new Set()
  );
  const [selectedTextIds, setSelectedTextIds] = useState<Set<number>>(
    preselectedTextId ? new Set([preselectedTextId]) : new Set()
  );
  const [selectedSentenceIds, setSelectedSentenceIds] = useState<Set<number>>(
    preselectedSentenceId ? new Set([preselectedSentenceId]) : new Set()
  );
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<number>>(new Set());
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<number>>(new Set());

  // Search queries per section
  const [searchHsks, setSearchHsks] = useState('');
  const [searchLessons, setSearchLessons] = useState('');

  // Filter modes per section ('all' | 'unassigned' | 'hsk')
  const [filterHsks, setFilterHsks] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterLessons, setFilterLessons] = useState<'all' | 'unassigned' | 'hsk'>('all');

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hsks: false,
    lessons: true,
    texts: false,
    sentences: false,
    characters: true,
    rules: false,
  });

  const [createdBannerInfo, setCreatedBannerInfo] = useState<{
    visible: boolean;
    wordContent: string;
    itemCount: number;
    details: string;
  }>({
    visible: false,
    wordContent: '',
    itemCount: 0,
    details: '',
  });

  // Paginated sections (DB-level, 10 at a time)
  const textsPage = usePagedSection<TextType>(getTextsPaged, getTextsCount);
  const sentencesPage = usePagedSection<SentenceType>(getSentencesPaged, getSentencesCount);
  const charactersPage = usePagedSection<CharacterType>(getCharactersPaged, getCharactersCountPaged);
  const rulesPage = usePagedSection<RuleType>(getRulesPaged, getRulesCount);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Load all DB items
  useFocusEffect(
    useCallback(() => {
      try {
        const hskData = getAllHSKs() as unknown as HSKType[];
        setHsks(hskData || []);
        const lessonData = getAllLessons() as unknown as LessonType[];
        setLessons(lessonData || []);

        if (editWordId) {
          const wordData = getWordById(editWordId);
          if (wordData) {
            setContent(wordData.content || '');
            setPinyin(wordData.pinyin || '');
            setMeaning(wordData.meaning || '');

            const wordHsks = (getHSKsByWordId(editWordId) as unknown as HSKType[]) || [];
            const wordLessons = (getLessonsByWordId(editWordId) as unknown as LessonType[]) || [];
            const wordTexts = (getTextsByWordId(editWordId) as unknown as TextType[]) || [];
            const wordSentences = (getSentencesByWordId(editWordId) as unknown as SentenceType[]) || [];
            const wordChars = (getCharactersByWordId(editWordId) as unknown as CharacterType[]) || [];
            const wordRules = (getRulesByWordId(editWordId) as unknown as RuleType[]) || [];

            const hskSet = new Set(wordHsks.map((h) => h.id));
            if (wordData.hskId) hskSet.add(wordData.hskId);
            setSelectedHskIds(hskSet);

            const lessonSet = new Set(wordLessons.map((l) => l.id));
            if (wordData.lessonId) lessonSet.add(wordData.lessonId);
            setSelectedLessonIds(lessonSet);

            const textSet = new Set(wordTexts.map((t) => t.id));
            if (wordData.textId) textSet.add(wordData.textId);
            setSelectedTextIds(textSet);

            const sentenceSet = new Set(wordSentences.map((s) => s.id));
            if (wordData.sentenceId) sentenceSet.add(wordData.sentenceId);
            setSelectedSentenceIds(sentenceSet);

            setSelectedCharacterIds(new Set(wordChars.map((c) => c.id)));
            setSelectedRuleIds(new Set(wordRules.map((r) => r.id)));
          }
        }
      } catch (e) {
        console.error('Failed to load DB items for addWord:', e);
      }
      textsPage.initialize();
      sentencesPage.initialize();
      charactersPage.initialize();
      rulesPage.initialize();
    }, [editWordId])
  );

  // Helper toggle ID
  const toggleId = (set: Set<number>, id: number): Set<number> => {
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  };

  // Filtered lists
  const filteredHsks = useMemo(() => {
    return hsks.filter((h) => {
      const q = searchHsks.toLowerCase().trim();
      return !q || h.name.toLowerCase().includes(q);
    });
  }, [hsks, searchHsks]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      const q = searchLessons.toLowerCase().trim();
      const matches = !q || l.title.toLowerCase().includes(q) || `lesson ${l.num}`.includes(q);
      if (!matches) return false;
      if (filterLessons === 'hsk' && selectedHskIds.size > 0 && !selectedHskIds.has(l.hskId)) return false;
      return true;
    });
  }, [lessons, searchLessons, filterLessons, selectedHskIds]);

  // Bulk select handlers
  const handleSelectAllHsks = () => {
    setSelectedHskIds((prev) => {
      const next = new Set(prev);
      filteredHsks.forEach((h) => next.add(h.id));
      return next;
    });
  };

  const handleSelectAllLessons = () => {
    setSelectedLessonIds((prev) => {
      const next = new Set(prev);
      filteredLessons.forEach((l) => next.add(l.id));
      return next;
    });
  };

  const handleSelectAllTexts = () => {
    setSelectedTextIds((prev) => {
      const next = new Set(prev);
      textsPage.items.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const handleSelectAllSentences = () => {
    setSelectedSentenceIds((prev) => {
      const next = new Set(prev);
      sentencesPage.items.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const handleSelectAllCharacters = () => {
    setSelectedCharacterIds((prev) => {
      const next = new Set(prev);
      charactersPage.items.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleSelectAllRules = () => {
    setSelectedRuleIds((prev) => {
      const next = new Set(prev);
      rulesPage.items.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const totalSelectedCount =
    selectedHskIds.size +
    selectedLessonIds.size +
    selectedTextIds.size +
    selectedSentenceIds.size +
    selectedCharacterIds.size +
    selectedRuleIds.size;

  // Save Word handler
  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please enter Chinese word content.');
      return;
    }

    try {
      const wordText = content.trim();
      const primaryHskId = selectedHskIds.size > 0 ? Array.from(selectedHskIds)[0] : null;
      const primaryLessonId = selectedLessonIds.size > 0 ? Array.from(selectedLessonIds)[0] : null;
      const primaryTextId = selectedTextIds.size > 0 ? Array.from(selectedTextIds)[0] : null;
      const primarySentenceId = selectedSentenceIds.size > 0 ? Array.from(selectedSentenceIds)[0] : null;

      if (isEditing && editWordId) {
        updateWord(editWordId, {
          content: wordText,
          pinyin: pinyin.trim(),
          meaning: meaning.trim(),
          hskId: primaryHskId ?? undefined,
          lessonId: primaryLessonId ?? undefined,
          textId: primaryTextId ?? undefined,
          sentenceId: primarySentenceId ?? undefined,
        });

        updateWordRelations(editWordId, {
          hskIds: Array.from(selectedHskIds),
          lessonIds: Array.from(selectedLessonIds),
          textIds: Array.from(selectedTextIds),
          sentenceIds: Array.from(selectedSentenceIds),
          characterIds: Array.from(selectedCharacterIds),
          ruleIds: Array.from(selectedRuleIds),
        });

        Alert.alert('Success', 'Word updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      // 1. Insert new Word record
      const result = db.runSync(
        `INSERT INTO words (content, pinyin, meaning, hskId, lessonId, textId, sentenceId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        wordText,
        pinyin.trim(),
        meaning.trim(),
        primaryHskId,
        primaryLessonId,
        primaryTextId,
        primarySentenceId
      );

      const wordId = result.lastInsertRowId;

      // 2. Link all Many-to-Many relations via junction tables
      linkWordRelations(wordId, {
        hskIds: Array.from(selectedHskIds),
        lessonIds: Array.from(selectedLessonIds),
        textIds: Array.from(selectedTextIds),
        sentenceIds: Array.from(selectedSentenceIds),
        characterIds: Array.from(selectedCharacterIds),
        ruleIds: Array.from(selectedRuleIds),
      });

      const details = `Linked ${selectedHskIds.size} HSKs, ${selectedLessonIds.size} lessons, ${selectedTextIds.size} texts, ${selectedSentenceIds.size} sentences, ${selectedCharacterIds.size} characters, ${selectedRuleIds.size} rules`;

      setCreatedBannerInfo({
        visible: true,
        wordContent: wordText,
        itemCount: totalSelectedCount,
        details,
      });

      // Clear form inputs
      setContent('');
      setPinyin('');
      setMeaning('');
      setSelectedHskIds(new Set());
      setSelectedLessonIds(new Set());
      setSelectedTextIds(new Set());
      setSelectedSentenceIds(new Set());
      setSelectedCharacterIds(new Set());
      setSelectedRuleIds(new Set());
    } catch (e) {
      console.error('Failed to save word:', e);
      Alert.alert('Database Error', 'Could not save the new word.');
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label="Create Word"
        items={[
          <TouchableOpacity
            key="check"
            style={styles.headerSaveButton}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Lucide name="check" size={20} color="#ffffff" />
          </TouchableOpacity>,
        ]}
      />

      {/* Success Banner — outside ScrollView so it truly overlays the screen */}
      <SuccessBanner
        visible={createdBannerInfo.visible}
        title="Word Created!"
        lessonTitle={createdBannerInfo.wordContent}
        details={createdBannerInfo.details}
        onClose={() =>
          setCreatedBannerInfo((prev) => ({ ...prev, visible: false }))
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ===== WORD DETAILS CARD ===== */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Lucide name="languages" size={20} color="#059669" />
              <Text style={styles.cardTitle}>Vocabulary Word Details</Text>
            </View>

            {/* Content Input (Required) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Chinese Word <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 学习 / 咖啡"
                placeholderTextColor="#94a3b8"
                value={content}
                onChangeText={setContent}
              />
            </View>

            {/* Pinyin Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pinyin (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., xué xí"
                placeholderTextColor="#94a3b8"
                value={pinyin}
                onChangeText={setPinyin}
              />
            </View>

            {/* Meaning Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Meaning / English Translation</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., to study, to learn"
                placeholderTextColor="#94a3b8"
                value={meaning}
                onChangeText={setMeaning}
              />
            </View>
          </View>

          {/* ===== HSK LEVELS SECTION ===== */}
          <SliderSection
            title="HSK Levels"
            icon="layers"
            color="#6366f1"
            totalCount={hsks.length}
            selectedCount={selectedHskIds.size}
            expanded={expandedSections.hsks}
            onToggle={() => toggleSection('hsks')}
            onSelectAll={handleSelectAllHsks}
            onClearAll={() => setSelectedHskIds(new Set())}
            searchQuery={searchHsks}
            onSearchChange={setSearchHsks}
            filterMode={filterHsks}
            onFilterChange={setFilterHsks}
            hasHskSelected={selectedHskIds.size > 0}
          >
            {filteredHsks.length === 0 ? (
              <Text style={styles.emptyText}>No HSK levels found.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
              >
                {filteredHsks.map((h) => (
                  <ItemCard
                    key={h.id}
                    title={h.name}
                    subtitle={`Level ${h.id}`}
                    selected={selectedHskIds.has(h.id)}
                    onToggle={() => setSelectedHskIds((prev) => toggleId(prev, h.id))}
                    color="#6366f1"
                    width={140}
                    isChineseTitle={false}
                  />
                ))}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== LESSONS SECTION ===== */}
          <SliderSection
            title="Lessons"
            icon="book-open"
            color="#2563eb"
            totalCount={lessons.length}
            selectedCount={selectedLessonIds.size}
            expanded={expandedSections.lessons}
            onToggle={() => toggleSection('lessons')}
            onSelectAll={handleSelectAllLessons}
            onClearAll={() => setSelectedLessonIds(new Set())}
            searchQuery={searchLessons}
            onSearchChange={setSearchLessons}
            filterMode={filterLessons}
            onFilterChange={setFilterLessons}
            hasHskSelected={selectedHskIds.size > 0}
          >
            {filteredLessons.length === 0 ? (
              <Text style={styles.emptyText}>No lessons match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
              >
                {filteredLessons.map((l) => (
                  <ItemCard
                    key={l.id}
                    title={`Lesson ${l.num}`}
                    subtitle={l.title}
                    detail={l.hskId ? `HSK ${l.hskId}` : undefined}
                    selected={selectedLessonIds.has(l.id)}
                    onToggle={() => setSelectedLessonIds((prev) => toggleId(prev, l.id))}
                    color="#2563eb"
                    width={160}
                    isChineseTitle={false}
                  />
                ))}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== READING TEXTS SECTION ===== */}
          <SliderSection
            title="Reading Texts"
            icon="file-text"
            color="#0284c7"
            totalCount={textsPage.total}
            selectedCount={selectedTextIds.size}
            expanded={expandedSections.texts}
            onToggle={() => toggleSection('texts')}
            onAddNew={() =>
              router.push(
                selectedHskIds.size > 0
                  ? `/pages/addText?hskId=${Array.from(selectedHskIds)[0]}`
                  : '/pages/addText'
              )
            }
            addNewLabel="+ Text"
            onSelectAll={handleSelectAllTexts}
            onClearAll={() => setSelectedTextIds(new Set())}
            searchQuery={textsPage.search}
            onSearchChange={textsPage.setSearch}
            filterMode={textsPage.filter}
            onFilterChange={(f) => textsPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={selectedHskIds.size > 0}
          >
            {textsPage.items.length === 0 ? (
              <Text style={styles.emptyText}>No reading texts match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    textsPage.loadMore();
                  }
                }}
                scrollEventThrottle={16}
              >
                {textsPage.items.map((t) => (
                  <ItemCard
                    key={t.id}
                    title={t.title || t.content.substring(0, 12)}
                    subtitle={t.content}
                    detail={t.meaning}
                    selected={selectedTextIds.has(t.id)}
                    onToggle={() => setSelectedTextIds((prev) => toggleId(prev, t.id))}
                    color="#0284c7"
                    width={200}
                  />
                ))}
                {textsPage.hasMore && (
                  <SliderLoadMoreCard
                    currentCount={textsPage.items.length}
                    totalCount={textsPage.total}
                    pageSize={SLIDER_PAGE_SIZE}
                    color="#0284c7"
                    onLoadMore={textsPage.loadMore}
                  />
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== SENTENCES SECTION ===== */}
          <SliderSection
            title="Sentences"
            icon="message-square-text"
            color="#8b5cf6"
            totalCount={sentencesPage.total}
            selectedCount={selectedSentenceIds.size}
            expanded={expandedSections.sentences}
            onToggle={() => toggleSection('sentences')}
            onAddNew={() =>
              router.push(
                selectedHskIds.size > 0
                  ? `/pages/addSentence?hskId=${Array.from(selectedHskIds)[0]}`
                  : '/pages/addSentence'
              )
            }
            addNewLabel="+ Sentence"
            onSelectAll={handleSelectAllSentences}
            onClearAll={() => setSelectedSentenceIds(new Set())}
            searchQuery={sentencesPage.search}
            onSearchChange={sentencesPage.setSearch}
            filterMode={sentencesPage.filter}
            onFilterChange={(f) => sentencesPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={selectedHskIds.size > 0}
          >
            {sentencesPage.items.length === 0 ? (
              <Text style={styles.emptyText}>No sentences match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    sentencesPage.loadMore();
                  }
                }}
                scrollEventThrottle={16}
              >
                {sentencesPage.items.map((s) => (
                  <ItemCard
                    key={s.id}
                    title={s.content}
                    subtitle={s.pinyin}
                    detail={s.meaning}
                    selected={selectedSentenceIds.has(s.id)}
                    onToggle={() => setSelectedSentenceIds((prev) => toggleId(prev, s.id))}
                    color="#8b5cf6"
                    width={200}
                  />
                ))}
                {sentencesPage.hasMore && (
                  <SliderLoadMoreCard
                    currentCount={sentencesPage.items.length}
                    totalCount={sentencesPage.total}
                    pageSize={SLIDER_PAGE_SIZE}
                    color="#8b5cf6"
                    onLoadMore={sentencesPage.loadMore}
                  />
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== CHARACTERS SECTION ===== */}
          <SliderSection
            title="Characters"
            icon="spell-check"
            color="#ec489a"
            totalCount={charactersPage.total}
            selectedCount={selectedCharacterIds.size}
            expanded={expandedSections.characters}
            onToggle={() => toggleSection('characters')}
            onAddNew={() =>
              router.push(
                selectedHskIds.size > 0
                  ? `/pages/addCharacter?hskId=${Array.from(selectedHskIds)[0]}`
                  : '/pages/addCharacter'
              )
            }
            addNewLabel="+ Character"
            onSelectAll={handleSelectAllCharacters}
            onClearAll={() => setSelectedCharacterIds(new Set())}
            searchQuery={charactersPage.search}
            onSearchChange={charactersPage.setSearch}
            filterMode={charactersPage.filter}
            onFilterChange={(f) => charactersPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={selectedHskIds.size > 0}
          >
            {charactersPage.items.length === 0 ? (
              <Text style={styles.emptyText}>No characters match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    charactersPage.loadMore();
                  }
                }}
                scrollEventThrottle={16}
              >
                {charactersPage.items.map((c) => (
                  <CharacterCard
                    key={c.id}
                    character={c}
                    selected={selectedCharacterIds.has(c.id)}
                    onToggle={() =>
                      setSelectedCharacterIds((prev) => toggleId(prev, c.id))
                    }
                  />
                ))}
                {charactersPage.hasMore && (
                  <SliderLoadMoreCard
                    currentCount={charactersPage.items.length}
                    totalCount={charactersPage.total}
                    pageSize={SLIDER_PAGE_SIZE}
                    color="#ec489a"
                    onLoadMore={charactersPage.loadMore}
                  />
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== RULES SECTION ===== */}
          <SliderSection
            title="Grammar Rules"
            icon="book-open-check"
            color="#d97706"
            totalCount={rulesPage.total}
            selectedCount={selectedRuleIds.size}
            expanded={expandedSections.rules}
            onToggle={() => toggleSection('rules')}
            onAddNew={() =>
              router.push(
                selectedHskIds.size > 0
                  ? `/pages/addRule?hskId=${Array.from(selectedHskIds)[0]}`
                  : '/pages/addRule'
              )
            }
            addNewLabel="+ Rule"
            onSelectAll={handleSelectAllRules}
            onClearAll={() => setSelectedRuleIds(new Set())}
            searchQuery={rulesPage.search}
            onSearchChange={rulesPage.setSearch}
            filterMode={rulesPage.filter}
            onFilterChange={(f) => rulesPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={selectedHskIds.size > 0}
          >
            {rulesPage.items.length === 0 ? (
              <Text style={styles.emptyText}>No grammar rules match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    rulesPage.loadMore();
                  }
                }}
                scrollEventThrottle={16}
              >
                {rulesPage.items.map((r) => (
                  <ItemCard
                    key={r.id}
                    title={r.content}
                    subtitle={`Rule #${r.id}`}
                    selected={selectedRuleIds.has(r.id)}
                    onToggle={() =>
                      setSelectedRuleIds((prev) => toggleId(prev, r.id))
                    }
                    color="#d97706"
                    width={200}
                    isChineseTitle={false}
                  />
                ))}
                {rulesPage.hasMore && (
                  <SliderLoadMoreCard
                    currentCount={rulesPage.items.length}
                    totalCount={rulesPage.total}
                    pageSize={SLIDER_PAGE_SIZE}
                    color="#d97706"
                    onLoadMore={rulesPage.loadMore}
                  />
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== SAVE BUTTON ===== */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Lucide name="plus-circle" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              Create Word
              {totalSelectedCount > 0 ? ` (${totalSelectedCount} linked items)` : ''}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default AddWord;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 5,
    gap: 5,
  },
  headerSaveButton: {
    backgroundColor: '#059669',
    borderRadius: 50,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#047857',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: '#ffffffe9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    // elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  requiredStar: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  slider: {
    paddingHorizontal: 12,
    gap: 10,
    paddingVertical: 4,
  },
  saveButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

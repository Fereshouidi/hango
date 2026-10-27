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
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import {
  getAllHSKs,
  getAllLessons,
  getCharactersPaged,
  getCharactersCountPaged,
  getTextsPaged,
  getTextsCount,
  getSentencesPaged,
  getSentencesCount,
  getWordsPaged,
  getWordsCount,
  getRulesPaged,
  getRulesCount,
  getLessonById,
  getTextsByLessonId,
  getSentencesByLessonId,
  getWordsByLessonId,
  getCharactersByLessonId,
  getRulesByLessonId,
  updateLesson,
  updateLessonRelations,
  db,
} from '@/db/utils';
import { usePagedSection } from '@/hooks/usePagedSection';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  HSKType,
  LessonType,
  TextType,
  SentenceType,
  WordType,
  CharacterType,
  RuleType,
} from '@/types';
import {
  CharacterCard,
  ItemCard,
  SliderSection,
  SliderLoadMoreCard,
  LessonInfoCard,
  LessonSummary,
} from '@/components/add-lesson';
import { SuccessBanner } from '@/components/banners';
import { CollapsibleLinkingSection } from '@/components/common/CollapsibleLinkingSection';

const AddLesson = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawEditId = params.lessonId || params.id;
  const editLessonId = rawEditId && !isNaN(Number(rawEditId)) ? Number(rawEditId) : null;
  const isEditing = Boolean(editLessonId);
  const preselectedHskId = params.hskId ? Number(params.hskId) : null;
  const loadedEditIdRef = useRef<number | null>(null);

  // Lesson fields
  const [title, setTitle] = useState('');
  const [num, setNum] = useState('');
  const [hsks, setHsks] = useState<HSKType[]>([]);
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [selectedHskId, setSelectedHskId] = useState<number | null>(preselectedHskId);
  const [showHskPicker, setShowHskPicker] = useState(false);
  const [createdBannerInfo, setCreatedBannerInfo] = useState<{
    visible: boolean;
    lessonTitle: string;
    hskName: string;
    itemCount: number;
    details: string;
    mode?: 'created' | 'updated';
  }>({
    visible: false,
    lessonTitle: '',
    hskName: '',
    itemCount: 0,
    details: '',
    mode: 'created',
  });

  // Selected item IDs
  const [selectedTextIds, setSelectedTextIds] = useState<Set<number>>(new Set());
  const [selectedSentenceIds, setSelectedSentenceIds] = useState<Set<number>>(new Set());
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(new Set());
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<number>>(new Set());
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<number>>(new Set());


  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    characters: false,
    words: false,
    sentences: false,
    texts: false,
    rules: false,
  });
  const [showOptionalLinks, setShowOptionalLinks] = useState(false);

  // ── Paginated sections (DB-level, 10 at a time) ──────────────────────────
  const textsPage = usePagedSection<TextType>(getTextsPaged, getTextsCount);
  const sentencesPage = usePagedSection<SentenceType>(getSentencesPaged, getSentencesCount);
  const wordsPage = usePagedSection<WordType>(getWordsPaged, getWordsCount);
  const charactersPage = usePagedSection<CharacterType>(getCharactersPaged, getCharactersCountPaged);
  const rulesPage = usePagedSection<RuleType>(getRulesPaged, getRulesCount);

  useFocusEffect(
    useCallback(() => {
      try {
        setHsks(getAllHSKs() as unknown as HSKType[]);
        setLessons(getAllLessons() as unknown as LessonType[]);

        if (editLessonId && loadedEditIdRef.current !== editLessonId) {
          const lessonData = getLessonById(editLessonId);
          if (lessonData) {
            setTitle(lessonData.title || '');
            setNum(String(lessonData.num ?? ''));
            setSelectedHskId(lessonData.hskId ?? null);

            const linkedTexts = (getTextsByLessonId(editLessonId) as unknown as TextType[]) || [];
            const linkedSentences = (getSentencesByLessonId(editLessonId) as unknown as SentenceType[]) || [];
            const linkedWords = (getWordsByLessonId(editLessonId) as unknown as WordType[]) || [];
            const linkedChars = (getCharactersByLessonId(editLessonId) as unknown as CharacterType[]) || [];
            const linkedRules = (getRulesByLessonId(editLessonId) as unknown as RuleType[]) || [];

            setSelectedTextIds(new Set(linkedTexts.map((t) => t.id)));
            setSelectedSentenceIds(new Set(linkedSentences.map((s) => s.id)));
            setSelectedWordIds(new Set(linkedWords.map((w) => w.id)));
            setSelectedCharacterIds(new Set(linkedChars.map((c) => c.id)));
            setSelectedRuleIds(new Set(linkedRules.map((r) => r.id)));

            loadedEditIdRef.current = editLessonId;
          }
        } else if (!isEditing && preselectedHskId && !selectedHskId) {
          setSelectedHskId(preselectedHskId);
        }
      } catch (e) {
        console.error('Failed to load DB items in AddLesson:', e);
      }

      // Initialize all paginated sections
      textsPage.initialize();
      sentencesPage.initialize();
      wordsPage.initialize();
      charactersPage.initialize();
      rulesPage.initialize();
    }, [editLessonId, preselectedHskId, selectedHskId, isEditing])
  );

  // Map lessonId -> lesson label (e.g. "L1: Greetings")
  const lessonMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const l of lessons) {
      map.set(l.id, `L${l.num}: ${l.title}`);
    }
    return map;
  }, [lessons]);

  const selectedHskName = selectedHskId
    ? (hsks.find((h) => h.id === selectedHskId)?.name ?? 'HSK')
    : 'None';

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Selection toggle helper
  function toggleId(set: Set<number>, id: number): Set<number> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }


  // Total selection count
  const totalSelectedCount =
    selectedCharacterIds.size +
    selectedWordIds.size +
    selectedSentenceIds.size +
    selectedTextIds.size +
    selectedRuleIds.size;

  // Save handler
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter a lesson title.');
      return;
    }
    if (!num.trim() || isNaN(Number(num))) {
      Alert.alert('Missing Field', 'Please enter a valid lesson number.');
      return;
    }

    try {
      const lessonTitle = title.trim();
      const lessonNum = Number(num);

      if (isEditing && editLessonId) {
        updateLesson(editLessonId, {
          title: lessonTitle,
          num: lessonNum,
          hskId: selectedHskId ?? null,
        });

        updateLessonRelations(editLessonId, {
          hskId: selectedHskId ?? null,
          textIds: Array.from(selectedTextIds),
          sentenceIds: Array.from(selectedSentenceIds),
          wordIds: Array.from(selectedWordIds),
          characterIds: Array.from(selectedCharacterIds),
          ruleIds: Array.from(selectedRuleIds),
        });

        const summaryDetails = [
          selectedCharacterIds.size > 0 && `${selectedCharacterIds.size} characters`,
          selectedWordIds.size > 0 && `${selectedWordIds.size} words`,
          selectedSentenceIds.size > 0 && `${selectedSentenceIds.size} sentences`,
          selectedTextIds.size > 0 && `${selectedTextIds.size} texts`,
          selectedRuleIds.size > 0 && `${selectedRuleIds.size} rules`,
        ]
          .filter(Boolean)
          .join(', ');

        setCreatedBannerInfo({
          visible: true,
          lessonTitle: `Lesson ${lessonNum}: ${lessonTitle}`,
          hskName: selectedHskName,
          itemCount: totalSelectedCount,
          details: summaryDetails,
          mode: 'updated',
        });
        return;
      }

      // 1. Create the new lesson (hskId is optional)
      const result = db.runSync(
        `INSERT INTO lessons (num, title, hskId) VALUES (?, ?, ?)`,
        lessonNum,
        lessonTitle,
        selectedHskId ?? null
      );
      const lessonId = result.lastInsertRowId;

      // 2. Link relations
      updateLessonRelations(lessonId, {
        hskId: selectedHskId ?? null,
        textIds: Array.from(selectedTextIds),
        sentenceIds: Array.from(selectedSentenceIds),
        wordIds: Array.from(selectedWordIds),
        characterIds: Array.from(selectedCharacterIds),
        ruleIds: Array.from(selectedRuleIds),
      });

      const summaryDetails = [
        selectedCharacterIds.size > 0 && `${selectedCharacterIds.size} characters`,
        selectedWordIds.size > 0 && `${selectedWordIds.size} words`,
        selectedSentenceIds.size > 0 && `${selectedSentenceIds.size} sentences`,
        selectedTextIds.size > 0 && `${selectedTextIds.size} texts`,
        selectedRuleIds.size > 0 && `${selectedRuleIds.size} rules`,
      ]
        .filter(Boolean)
        .join(', ');

      setCreatedBannerInfo({
        visible: true,
        lessonTitle: `Lesson ${lessonNum}: ${lessonTitle}`,
        hskName: selectedHskName,
        itemCount: totalSelectedCount,
        details: summaryDetails,
        mode: 'created',
      });
    } catch (error: any) {
      console.error('Failed to save lesson:', error);
      Alert.alert(
        'Error',
        error?.message?.includes('UNIQUE')
          ? 'A lesson with this title already exists. Please choose a different title.'
          : (isEditing ? 'Failed to update lesson. Please try again.' : 'Failed to create lesson. Please try again.')
      );
    }
  };

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />
      <SuccessBanner
        visible={createdBannerInfo.visible}
        title={createdBannerInfo.mode === 'updated' ? "Lesson Updated Successfully! 🎉" : "Lesson Created Successfully! 🎉"}
        lessonTitle={createdBannerInfo.lessonTitle}
        hskName={createdBannerInfo.hskName}
        itemCount={createdBannerInfo.itemCount}
        details={createdBannerInfo.details}
        actionText="Done"
        autoCloseMs={3200}
        onClose={() => {
          setCreatedBannerInfo((prev) => ({ ...prev, visible: false }));
          router.back();
        }}
        onAction={() => {
          setCreatedBannerInfo((prev) => ({ ...prev, visible: false }));
          router.back();
        }}
      />
      <Header
        useBackArrow={true}
        label={isEditing ? 'Edit Lesson' : 'Add Lesson'}
        items={[
          <TouchableOpacity
            key="save"
            onPress={handleSave}
            activeOpacity={0.7}
            style={styles.headerSaveButton}
          >
            <Lucide name="check" size={20} color="#ffffff" />
          </TouchableOpacity>,
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ===== LESSON INFO CARD ===== */}
          <LessonInfoCard
            num={num}
            onNumChange={setNum}
            title={title}
            onTitleChange={setTitle}
            hsks={hsks}
            selectedHskId={selectedHskId}
            onSelectHskId={(id) => {
              setSelectedHskId(id);
              setShowHskPicker(false);
            }}
            showHskPicker={showHskPicker}
            onToggleHskPicker={() => setShowHskPicker(!showHskPicker)}
          />

          {/* ===== OPTIONAL LINKING SECTIONS ===== */}
          <CollapsibleLinkingSection
            title="Link Content to this Lesson (Optional)"
            subtitle="Connect existing texts, sentences, words, characters, or rules"
            icon="link-2"
            accentColor="#2563eb"
            selectedCount={totalSelectedCount}
            isOpen={showOptionalLinks}
            onToggle={() => setShowOptionalLinks((prev) => !prev)}
            tip="Connecting content is completely optional! You can create this lesson now and add texts, words, or sentences to it later."
          >
          {/* ===== SELECTION HELPER BANNER ===== */}
          <View style={styles.infoBanner}>
            <Lucide name="mouse-pointer-click" size={16} color="#2563eb" />
            <Text style={styles.infoBannerText}>
              Select existing database items using the sliders below to include them in this lesson.
            </Text>
          </View>

          {/* ===== TEXTS SECTION ===== */}
          <SliderSection
            title="Texts"
            icon="file-text"
            color="#2563eb"
            totalCount={textsPage.total}
            selectedCount={selectedTextIds.size}
            expanded={expandedSections.texts}
            onToggle={() => toggleSection('texts')}
            onAddNew={() =>
              router.push(
                selectedHskId
                  ? `/pages/addText?hskId=${selectedHskId}`
                  : '/pages/addText'
              )
            }
            addNewLabel="+ Text"
            onSelectAll={() =>
              setSelectedTextIds((prev) => {
                const next = new Set(prev);
                textsPage.items.forEach((t) => next.add(t.id));
                return next;
              })
            }
            onClearAll={() => setSelectedTextIds(new Set())}
            searchQuery={textsPage.search}
            onSearchChange={textsPage.setSearch}
            filterMode={textsPage.filter}
            onFilterChange={(f) => textsPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={!!selectedHskId}
          >
            {textsPage.items.length === 0 ? (
              <Text style={styles.emptyText}>No texts match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
                onScroll={({ nativeEvent }) => {
                  const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    textsPage.loadMore();
                  }
                }}
                scrollEventThrottle={200}
              >
                {textsPage.items.map((t) => (
                  <ItemCard
                    key={t.id}
                    title={t.title}
                    subtitle={t.content}
                    detail={t.meaning}
                    selected={selectedTextIds.has(t.id)}
                    onToggle={() =>
                      setSelectedTextIds((prev) => toggleId(prev, t.id))
                    }
                    color="#2563eb"
                    width={220}
                    assignedLessonName={
                      t.lessonId ? lessonMap.get(t.lessonId) : undefined
                    }
                  />
                ))}
                {textsPage.hasMore && (
                  <SliderLoadMoreCard
                    remaining={textsPage.total - textsPage.items.length}
                    onPress={() => textsPage.loadMore()}
                    color="#2563eb"
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
                selectedHskId
                  ? `/pages/addSentence?hskId=${selectedHskId}`
                  : '/pages/addSentence'
              )
            }
            addNewLabel="+ Sentence"
            onSelectAll={() =>
              setSelectedSentenceIds((prev) => {
                const next = new Set(prev);
                sentencesPage.items.forEach((s) => next.add(s.id));
                return next;
              })
            }
            onClearAll={() => setSelectedSentenceIds(new Set())}
            searchQuery={sentencesPage.search}
            onSearchChange={sentencesPage.setSearch}
            filterMode={sentencesPage.filter}
            onFilterChange={(f) => sentencesPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={!!selectedHskId}
          >
            {sentencesPage.items.length === 0 ? (
              <Text style={styles.emptyText}>No sentences match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
                onScroll={({ nativeEvent }) => {
                  const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    sentencesPage.loadMore();
                  }
                }}
                scrollEventThrottle={200}
              >
                {sentencesPage.items.map((s) => (
                  <ItemCard
                    key={s.id}
                    title={s.content}
                    subtitle={s.pinyin}
                    detail={s.meaning}
                    selected={selectedSentenceIds.has(s.id)}
                    onToggle={() =>
                      setSelectedSentenceIds((prev) => toggleId(prev, s.id))
                    }
                    color="#8b5cf6"
                    width={200}
                    assignedLessonName={
                      s.lessonId ? lessonMap.get(s.lessonId) : undefined
                    }
                  />
                ))}
                {sentencesPage.hasMore && (
                  <SliderLoadMoreCard
                    remaining={sentencesPage.total - sentencesPage.items.length}
                    onPress={() => sentencesPage.loadMore()}
                    color="#8b5cf6"
                  />
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== WORDS SECTION ===== */}
          <SliderSection
            title="Words"
            icon="languages"
            color="#059669"
            totalCount={wordsPage.total}
            selectedCount={selectedWordIds.size}
            expanded={expandedSections.words}
            onToggle={() => toggleSection('words')}
            onAddNew={() => {
              const queryParts: string[] = [];
              if (editLessonId) queryParts.push(`lessonId=${editLessonId}`);
              if (selectedHskId) queryParts.push(`hskId=${selectedHskId}`);
              const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
              router.push(`/pages/addWord${qs}` as any);
            }}
            addNewLabel="+ Word"
            onSelectAll={() =>
              setSelectedWordIds((prev) => {
                const next = new Set(prev);
                wordsPage.items.forEach((w) => next.add(w.id));
                return next;
              })
            }
            onClearAll={() => setSelectedWordIds(new Set())}
            searchQuery={wordsPage.search}
            onSearchChange={wordsPage.setSearch}
            filterMode={wordsPage.filter}
            onFilterChange={(f) => wordsPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={!!selectedHskId}
          >
            {wordsPage.items.length === 0 ? (
              <Text style={styles.emptyText}>No words match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
                onScroll={({ nativeEvent }) => {
                  const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    wordsPage.loadMore();
                  }
                }}
                scrollEventThrottle={200}
              >
                {wordsPage.items.map((w) => (
                  <ItemCard
                    key={w.id}
                    title={w.content}
                    subtitle={w.pinyin}
                    detail={w.meaning}
                    selected={selectedWordIds.has(w.id)}
                    onToggle={() =>
                      setSelectedWordIds((prev) => toggleId(prev, w.id))
                    }
                    color="#059669"
                    width={150}
                    assignedLessonName={
                      w.lessonId ? lessonMap.get(w.lessonId) : undefined
                    }
                  />
                ))}
                {wordsPage.hasMore && (
                  <SliderLoadMoreCard
                    remaining={wordsPage.total - wordsPage.items.length}
                    onPress={() => wordsPage.loadMore()}
                    color="#059669"
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
                selectedHskId
                  ? `/pages/addCharacter?hskId=${selectedHskId}`
                  : '/pages/addCharacter'
              )
            }
            addNewLabel="+ Character"
            onSelectAll={() =>
              setSelectedCharacterIds((prev) => {
                const next = new Set(prev);
                charactersPage.items.forEach((c) => next.add(c.id));
                return next;
              })
            }
            onClearAll={() => setSelectedCharacterIds(new Set())}
            searchQuery={charactersPage.search}
            onSearchChange={charactersPage.setSearch}
            filterMode={charactersPage.filter}
            onFilterChange={(f) => charactersPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={!!selectedHskId}
          >
            {charactersPage.items.length === 0 ? (
              <Text style={styles.emptyText}>No characters match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
                onScroll={({ nativeEvent }) => {
                  const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    charactersPage.loadMore();
                  }
                }}
                scrollEventThrottle={200}
              >
                {charactersPage.items.map((c) => (
                  <CharacterCard
                    key={c.id}
                    character={c}
                    selected={selectedCharacterIds.has(c.id)}
                    onToggle={() =>
                      setSelectedCharacterIds((prev) => toggleId(prev, c.id))
                    }
                    assignedLessonName={
                      c.lessonId ? lessonMap.get(c.lessonId) : undefined
                    }
                  />
                ))}
                {charactersPage.hasMore && (
                  <SliderLoadMoreCard
                    remaining={charactersPage.total - charactersPage.items.length}
                    onPress={() => charactersPage.loadMore()}
                    color="#ec489a"
                  />
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== RULES SECTION ===== */}
          <SliderSection
            title="Grammar Rules"
            icon="graduation-cap"
            color="#d97706"
            totalCount={rulesPage.total}
            selectedCount={selectedRuleIds.size}
            expanded={expandedSections.rules}
            onToggle={() => toggleSection('rules')}
            onSelectAll={() =>
              setSelectedRuleIds((prev) => {
                const next = new Set(prev);
                rulesPage.items.forEach((r) => next.add(r.id));
                return next;
              })
            }
            onClearAll={() => setSelectedRuleIds(new Set())}
            searchQuery={rulesPage.search}
            onSearchChange={rulesPage.setSearch}
            filterMode={rulesPage.filter}
            onFilterChange={(f) => rulesPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={!!selectedHskId}
          >
            {rulesPage.items.length === 0 ? (
              <Text style={styles.emptyText}>No rules match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
                onScroll={({ nativeEvent }) => {
                  const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    rulesPage.loadMore();
                  }
                }}
                scrollEventThrottle={200}
              >
                {rulesPage.items.map((r) => (
                  <ItemCard
                    key={r.id}
                    title={r.content}
                    selected={selectedRuleIds.has(r.id)}
                    onToggle={() =>
                      setSelectedRuleIds((prev) => toggleId(prev, r.id))
                    }
                    color="#d97706"
                    width={200}
                    isChineseTitle={false}
                    assignedLessonName={
                      r.lessonId ? lessonMap.get(r.lessonId) : undefined
                    }
                  />
                ))}
                {rulesPage.hasMore && (
                  <SliderLoadMoreCard
                    remaining={rulesPage.total - rulesPage.items.length}
                    onPress={() => rulesPage.loadMore()}
                    color="#d97706"
                  />
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== SUMMARY CARD ===== */}
          <LessonSummary
            characterCount={selectedCharacterIds.size}
            wordCount={selectedWordIds.size}
            sentenceCount={selectedSentenceIds.size}
            textCount={selectedTextIds.size}
            ruleCount={selectedRuleIds.size}
          />
          </CollapsibleLinkingSection>

          {/* ===== SAVE BUTTON ===== */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Lucide name="plus-circle" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              Create Lesson
              {totalSelectedCount > 0 ? ` (${totalSelectedCount} items)` : ''}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

    </ThemedView>
  );
};

export default AddLesson;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 5,
    gap: 5,
  },

  // ---- Header check button ----
  headerSaveButton: {
    backgroundColor: '#22c55e',
    borderRadius: 50,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  // ---- Info Banner ----
  infoBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#1e40af',
    flex: 1,
    lineHeight: 18,
  },

  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  // ---- Horizontal slider ----
  slider: {
    paddingHorizontal: 12,
    gap: 10,
    paddingVertical: 4,
  },

  // ---- Save Button ----
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    gap: 8,
    shadowColor: '#2563eb',
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

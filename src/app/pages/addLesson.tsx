import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
  getAllTexts,
  getAllSentences,
  getAllWords,
  getAllCharacters,
  getAllRules,
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
  WordType,
  CharacterType,
  RuleType,
} from '@/types';
import {
  CharacterCard,
  ItemCard,
  SliderSection,
  LessonInfoCard,
  LessonSummary,
} from '@/components/add-lesson';
import { SuccessBanner } from '@/components/banners';

const AddLesson = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const preselectedHskId = params.hskId ? Number(params.hskId) : null;

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
  }>({
    visible: false,
    lessonTitle: '',
    hskName: '',
    itemCount: 0,
    details: '',
  });

  // All items from DB
  const [allTexts, setAllTexts] = useState<TextType[]>([]);
  const [allSentences, setAllSentences] = useState<SentenceType[]>([]);
  const [allWords, setAllWords] = useState<WordType[]>([]);
  const [allCharacters, setAllCharacters] = useState<CharacterType[]>([]);
  const [allRules, setAllRules] = useState<RuleType[]>([]);

  // Selected item IDs
  const [selectedTextIds, setSelectedTextIds] = useState<Set<number>>(new Set());
  const [selectedSentenceIds, setSelectedSentenceIds] = useState<Set<number>>(new Set());
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(new Set());
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<number>>(new Set());
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<number>>(new Set());

  // Search queries per section
  const [searchTexts, setSearchTexts] = useState('');
  const [searchSentences, setSearchSentences] = useState('');
  const [searchWords, setSearchWords] = useState('');
  const [searchCharacters, setSearchCharacters] = useState('');
  const [searchRules, setSearchRules] = useState('');

  // Filter modes per section ('all' | 'unassigned' | 'hsk')
  const [filterTexts, setFilterTexts] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterSentences, setFilterSentences] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterWords, setFilterWords] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterCharacters, setFilterCharacters] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterRules, setFilterRules] = useState<'all' | 'unassigned' | 'hsk'>('all');

  // Quick Add Word modal
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [newWordContent, setNewWordContent] = useState('');
  const [newWordPinyin, setNewWordPinyin] = useState('');
  const [newWordMeaning, setNewWordMeaning] = useState('');

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    characters: false,
    words: false,
    sentences: true,
    texts: true,
    rules: false,
  });

  useFocusEffect(
    useCallback(() => {
      try {
        setHsks(getAllHSKs() as unknown as HSKType[]);
        setLessons(getAllLessons() as unknown as LessonType[]);
        setAllTexts(getAllTexts() as unknown as TextType[]);
        setAllSentences(getAllSentences() as unknown as SentenceType[]);
        setAllWords(getAllWords() as unknown as WordType[]);
        setAllCharacters(getAllCharacters() as unknown as CharacterType[]);
        setAllRules(getAllRules() as unknown as RuleType[]);

        if (preselectedHskId && !selectedHskId) {
          setSelectedHskId(preselectedHskId);
        }
      } catch (e) {
        console.error('Failed to load DB items in AddLesson:', e);
      }
    }, [])
  );

  // Map lessonId -> lesson label (e.g. "L1: Greetings")
  const lessonMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const l of lessons) {
      map.set(l.id, `L${l.num}: ${l.title}`);
    }
    return map;
  }, [lessons]);

  const selectedHskName =
    hsks.find((h) => h.id === selectedHskId)?.name ?? 'HSK';

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

  // Filtered item sets
  const filteredCharacters = useMemo(() => {
    return allCharacters.filter((c) => {
      if (filterCharacters === 'unassigned' && c.lessonId) return false;
      if (filterCharacters === 'hsk' && selectedHskId && c.hskId !== selectedHskId) return false;
      if (!searchCharacters.trim()) return true;
      const q = searchCharacters.toLowerCase();
      return (
        c.content.toLowerCase().includes(q) ||
        c.pinyin.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q)
      );
    });
  }, [allCharacters, filterCharacters, selectedHskId, searchCharacters]);

  const filteredWords = useMemo(() => {
    return allWords.filter((w) => {
      if (filterWords === 'unassigned' && w.lessonId) return false;
      if (filterWords === 'hsk' && selectedHskId && w.hskId !== selectedHskId) return false;
      if (!searchWords.trim()) return true;
      const q = searchWords.toLowerCase();
      return (
        w.content.toLowerCase().includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q)
      );
    });
  }, [allWords, filterWords, selectedHskId, searchWords]);

  const filteredSentences = useMemo(() => {
    return allSentences.filter((s) => {
      if (filterSentences === 'unassigned' && s.lessonId) return false;
      if (filterSentences === 'hsk' && selectedHskId && s.hskId !== selectedHskId) return false;
      if (!searchSentences.trim()) return true;
      const q = searchSentences.toLowerCase();
      return (
        s.content.toLowerCase().includes(q) ||
        s.pinyin.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q)
      );
    });
  }, [allSentences, filterSentences, selectedHskId, searchSentences]);

  const filteredTexts = useMemo(() => {
    return allTexts.filter((t) => {
      if (filterTexts === 'unassigned' && t.lessonId) return false;
      if (filterTexts === 'hsk' && selectedHskId && t.hskId !== selectedHskId) return false;
      if (!searchTexts.trim()) return true;
      const q = searchTexts.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.meaning.toLowerCase().includes(q)
      );
    });
  }, [allTexts, filterTexts, selectedHskId, searchTexts]);

  const filteredRules = useMemo(() => {
    return allRules.filter((r) => {
      if (filterRules === 'unassigned' && r.lessonId) return false;
      if (filterRules === 'hsk' && selectedHskId && r.hskId !== selectedHskId) return false;
      if (!searchRules.trim()) return true;
      const q = searchRules.toLowerCase();
      return r.content.toLowerCase().includes(q);
    });
  }, [allRules, filterRules, selectedHskId, searchRules]);

  // Bulk select helpers
  const handleSelectAllCharacters = () => {
    setSelectedCharacterIds((prev) => {
      const next = new Set(prev);
      filteredCharacters.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleSelectAllWords = () => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      filteredWords.forEach((w) => next.add(w.id));
      return next;
    });
  };

  const handleSelectAllSentences = () => {
    setSelectedSentenceIds((prev) => {
      const next = new Set(prev);
      filteredSentences.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const handleSelectAllTexts = () => {
    setSelectedTextIds((prev) => {
      const next = new Set(prev);
      filteredTexts.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const handleSelectAllRules = () => {
    setSelectedRuleIds((prev) => {
      const next = new Set(prev);
      filteredRules.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const handleQuickAddWord = () => {
    if (!newWordContent.trim()) {
      Alert.alert('Validation', 'Please enter Chinese content for the word.');
      return;
    }
    try {
      const res = db.runSync(
        `INSERT INTO words (content, pinyin, meaning, hskId) VALUES (?, ?, ?, ?)`,
        newWordContent.trim(),
        newWordPinyin.trim() || null,
        newWordMeaning.trim() || null,
        selectedHskId
      );
      const insertedId = res.lastInsertRowId;
      const updatedWords = getAllWords() as unknown as WordType[];
      setAllWords(updatedWords);
      setSelectedWordIds((prev) => new Set(prev).add(insertedId));
      setNewWordContent('');
      setNewWordPinyin('');
      setNewWordMeaning('');
      setShowAddWordModal(false);
    } catch (e) {
      console.error('Failed to quick add word:', e);
      Alert.alert('Database Error', 'Could not create new word.');
    }
  };

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
    if (!selectedHskId) {
      Alert.alert('Missing Field', 'Please select an HSK level.');
      return;
    }

    try {
      // 1. Create the new lesson
      const result = db.runSync(
        `INSERT INTO lessons (num, title, hskId) VALUES (?, ?, ?)`,
        Number(num),
        title.trim(),
        selectedHskId
      );
      const lessonId = result.lastInsertRowId;

      // 2. Link selected texts
      for (const id of selectedTextIds) {
        db.runSync(
          `UPDATE texts SET lessonId = ?, hskId = ? WHERE id = ?`,
          lessonId,
          selectedHskId,
          id
        );
      }

      // 3. Link selected sentences
      for (const id of selectedSentenceIds) {
        db.runSync(
          `UPDATE sentences SET lessonId = ?, hskId = ? WHERE id = ?`,
          lessonId,
          selectedHskId,
          id
        );
      }

      // 4. Link selected words
      for (const id of selectedWordIds) {
        db.runSync(
          `UPDATE words SET lessonId = ?, hskId = ? WHERE id = ?`,
          lessonId,
          selectedHskId,
          id
        );
      }

      // 5. Link selected characters
      for (const id of selectedCharacterIds) {
        db.runSync(
          `UPDATE characters SET lessonId = ?, hskId = ? WHERE id = ?`,
          lessonId,
          selectedHskId,
          id
        );
      }

      // 6. Link selected rules
      for (const id of selectedRuleIds) {
        db.runSync(
          `UPDATE rules SET lessonId = ?, hskId = ? WHERE id = ?`,
          lessonId,
          selectedHskId,
          id
        );
      }

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
        lessonTitle: `Lesson ${num}: ${title.trim()}`,
        hskName: selectedHskName,
        itemCount: totalSelectedCount,
        details: summaryDetails,
      });
    } catch (error: any) {
      console.error('Failed to create lesson:', error);
      Alert.alert(
        'Error',
        error?.message?.includes('UNIQUE')
          ? 'A lesson with this title already exists. Please choose a different title.'
          : 'Failed to create lesson. Please try again.'
      );
    }
  };

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />
      <SuccessBanner
        visible={createdBannerInfo.visible}
        title="Lesson Created Successfully! 🎉"
        lessonTitle={createdBannerInfo.lessonTitle}
        hskName={createdBannerInfo.hskName}
        itemCount={createdBannerInfo.itemCount}
        details={createdBannerInfo.details}
        actionText="Go to Lessons"
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
        label="Add Lesson"
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
            totalCount={allTexts.length}
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
            onSelectAll={handleSelectAllTexts}
            onClearAll={() => setSelectedTextIds(new Set())}
            searchQuery={searchTexts}
            onSearchChange={setSearchTexts}
            filterMode={filterTexts}
            onFilterChange={setFilterTexts}
            hasHskSelected={!!selectedHskId}
          >
            {filteredTexts.length === 0 ? (
              <Text style={styles.emptyText}>No texts match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
              >
                {filteredTexts.map((t) => (
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
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== SENTENCES SECTION ===== */}
          <SliderSection
            title="Sentences"
            icon="message-square-text"
            color="#8b5cf6"
            totalCount={allSentences.length}
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
            onSelectAll={handleSelectAllSentences}
            onClearAll={() => setSelectedSentenceIds(new Set())}
            searchQuery={searchSentences}
            onSearchChange={setSearchSentences}
            filterMode={filterSentences}
            onFilterChange={setFilterSentences}
            hasHskSelected={!!selectedHskId}
          >
            {filteredSentences.length === 0 ? (
              <Text style={styles.emptyText}>No sentences match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
              >
                {filteredSentences.map((s) => (
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
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== WORDS SECTION ===== */}
          <SliderSection
            title="Words"
            icon="languages"
            color="#059669"
            totalCount={allWords.length}
            selectedCount={selectedWordIds.size}
            expanded={expandedSections.words}
            onToggle={() => toggleSection('words')}
            onAddNew={() => setShowAddWordModal(true)}
            addNewLabel="+ Word"
            onSelectAll={handleSelectAllWords}
            onClearAll={() => setSelectedWordIds(new Set())}
            searchQuery={searchWords}
            onSearchChange={setSearchWords}
            filterMode={filterWords}
            onFilterChange={setFilterWords}
            hasHskSelected={!!selectedHskId}
          >
            {filteredWords.length === 0 ? (
              <Text style={styles.emptyText}>No words match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
              >
                {filteredWords.map((w) => (
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
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== CHARACTERS SECTION ===== */}
          <SliderSection
            title="Characters"
            icon="spell-check"
            color="#ec489a"
            totalCount={allCharacters.length}
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
            onSelectAll={handleSelectAllCharacters}
            onClearAll={() => setSelectedCharacterIds(new Set())}
            searchQuery={searchCharacters}
            onSearchChange={setSearchCharacters}
            filterMode={filterCharacters}
            onFilterChange={setFilterCharacters}
            hasHskSelected={!!selectedHskId}
          >
            {filteredCharacters.length === 0 ? (
              <Text style={styles.emptyText}>No characters match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
              >
                {filteredCharacters.map((c) => (
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
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== RULES SECTION ===== */}
          <SliderSection
            title="Grammar Rules"
            icon="graduation-cap"
            color="#d97706"
            totalCount={allRules.length}
            selectedCount={selectedRuleIds.size}
            expanded={expandedSections.rules}
            onToggle={() => toggleSection('rules')}
            onSelectAll={handleSelectAllRules}
            onClearAll={() => setSelectedRuleIds(new Set())}
            searchQuery={searchRules}
            onSearchChange={setSearchRules}
            filterMode={filterRules}
            onFilterChange={setFilterRules}
            hasHskSelected={!!selectedHskId}
          >
            {filteredRules.length === 0 ? (
              <Text style={styles.emptyText}>No rules match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
              >
                {filteredRules.map((r) => (
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

      {/* ===== QUICK ADD WORD MODAL ===== */}
      <Modal
        visible={showAddWordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddWordModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconBg, { backgroundColor: '#05966918' }]}>
                  <Lucide name="languages" size={18} color="#059669" />
                </View>
                <Text style={styles.modalTitle}>Add New Word</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddWordModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Lucide name="x" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Chinese Word <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 咖啡 / 学习"
                  placeholderTextColor="#94a3b8"
                  value={newWordContent}
                  onChangeText={setNewWordContent}
                  autoFocus={true}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pinyin (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., kāfēi / xuéxí"
                  placeholderTextColor="#94a3b8"
                  value={newWordPinyin}
                  onChangeText={setNewWordPinyin}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Meaning (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., coffee / to study"
                  placeholderTextColor="#94a3b8"
                  value={newWordMeaning}
                  onChangeText={setNewWordMeaning}
                />
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAddWordModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleQuickAddWord}
                  activeOpacity={0.8}
                >
                  <Lucide name="plus" size={16} color="#ffffff" />
                  <Text style={styles.modalSaveText}>Add Word</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
};

export default AddLesson;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 7,
    gap: 7,
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

  // ---- Modal Styles ----
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 12,
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
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});

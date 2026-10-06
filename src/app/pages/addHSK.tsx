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
  createHSK,
  updateHSK,
  getHSKById,
  getAllLessons,
  getAllTexts,
  getAllSentences,
  getAllWords,
  getAllCharacters,
  getAllRules,
  getLessonsByHSKId,
  getTextsByHSKId,
  getSentencesByHSKId,
  getWordsByHSKId,
  getCharactersByHSKId,
  getRulesByHSKId,
  linkHSKRelations,
  updateHSKRelations,
} from '@/db/utils';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
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
} from '@/components/add-lesson';
import { SuccessBanner } from '@/components/banners';

const AddHSK = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawEditId = params.hskId || params.id;
  const editHskId = rawEditId && !isNaN(Number(rawEditId)) ? Number(rawEditId) : null;
  const isEditing = Boolean(editHskId);

  // HSK Form fields
  const [name, setName] = useState('');

  // DB entities
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [texts, setTexts] = useState<TextType[]>([]);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [words, setWords] = useState<WordType[]>([]);
  const [characters, setCharacters] = useState<CharacterType[]>([]);
  const [rules, setRules] = useState<RuleType[]>([]);

  // Selected multi-entity IDs
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<number>>(new Set());
  const [selectedTextIds, setSelectedTextIds] = useState<Set<number>>(new Set());
  const [selectedSentenceIds, setSelectedSentenceIds] = useState<Set<number>>(new Set());
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(new Set());
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<number>>(new Set());
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<number>>(new Set());

  // Search queries per section
  const [searchLessons, setSearchLessons] = useState('');
  const [searchTexts, setSearchTexts] = useState('');
  const [searchSentences, setSearchSentences] = useState('');
  const [searchWords, setSearchWords] = useState('');
  const [searchCharacters, setSearchCharacters] = useState('');
  const [searchRules, setSearchRules] = useState('');

  // Filter modes per section ('all' | 'unassigned')
  const [filterLessons, setFilterLessons] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterTexts, setFilterTexts] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterSentences, setFilterSentences] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterWords, setFilterWords] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterCharacters, setFilterCharacters] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterRules, setFilterRules] = useState<'all' | 'unassigned' | 'hsk'>('all');

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    lessons: true,
    texts: false,
    sentences: false,
    words: true,
    characters: false,
    rules: false,
  });

  const [createdBannerInfo, setCreatedBannerInfo] = useState<{
    visible: boolean;
    hskName: string;
    itemCount: number;
    details: string;
  }>({
    visible: false,
    hskName: '',
    itemCount: 0,
    details: '',
  });

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
        const lessonData = (getAllLessons() as unknown as LessonType[]) || [];
        setLessons(lessonData);
        const textData = (getAllTexts() as unknown as TextType[]) || [];
        setTexts(textData);
        const sentenceData = (getAllSentences() as unknown as SentenceType[]) || [];
        setSentences(sentenceData);
        const wordData = (getAllWords() as unknown as WordType[]) || [];
        setWords(wordData);
        const charData = (getAllCharacters() as unknown as CharacterType[]) || [];
        setCharacters(charData);
        const ruleData = (getAllRules() as unknown as RuleType[]) || [];
        setRules(ruleData);

        if (editHskId) {
          const hskData = getHSKById(editHskId);
          if (hskData) {
            setName(hskData.name || '');

            const hskLessons = (getLessonsByHSKId(editHskId) as unknown as LessonType[]) || [];
            const hskTexts = (getTextsByHSKId(editHskId) as unknown as TextType[]) || [];
            const hskSentences = (getSentencesByHSKId(editHskId) as unknown as SentenceType[]) || [];
            const hskWords = (getWordsByHSKId(editHskId) as unknown as WordType[]) || [];
            const hskChars = (getCharactersByHSKId(editHskId) as unknown as CharacterType[]) || [];
            const hskRules = (getRulesByHSKId(editHskId) as unknown as RuleType[]) || [];

            setSelectedLessonIds(new Set(hskLessons.map((l) => l.id)));
            setSelectedTextIds(new Set(hskTexts.map((t) => t.id)));
            setSelectedSentenceIds(new Set(hskSentences.map((s) => s.id)));
            setSelectedWordIds(new Set(hskWords.map((w) => w.id)));
            setSelectedCharacterIds(new Set(hskChars.map((c) => c.id)));
            setSelectedRuleIds(new Set(hskRules.map((r) => r.id)));
          }
        }
      } catch (e) {
        console.error('Failed to load DB items for addHSK:', e);
      }
    }, [editHskId])
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
  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      const q = searchLessons.toLowerCase().trim();
      const matches = !q || l.title.toLowerCase().includes(q) || `lesson ${l.num}`.includes(q);
      if (!matches) return false;
      if (filterLessons === 'unassigned' && l.hskId) return false;
      return true;
    });
  }, [lessons, searchLessons, filterLessons]);

  const filteredTexts = useMemo(() => {
    return texts.filter((t) => {
      const q = searchTexts.toLowerCase().trim();
      const matches =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.meaning.toLowerCase().includes(q);
      if (!matches) return false;
      if (filterTexts === 'unassigned' && t.hskId) return false;
      return true;
    });
  }, [texts, searchTexts, filterTexts]);

  const filteredSentences = useMemo(() => {
    return sentences.filter((s) => {
      const q = searchSentences.toLowerCase().trim();
      const matches =
        !q ||
        s.content.toLowerCase().includes(q) ||
        s.pinyin.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q);
      if (!matches) return false;
      if (filterSentences === 'unassigned' && s.hskId) return false;
      return true;
    });
  }, [sentences, searchSentences, filterSentences]);

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const q = searchWords.toLowerCase().trim();
      const matches =
        !q ||
        w.content.toLowerCase().includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q);
      if (!matches) return false;
      if (filterWords === 'unassigned' && w.hskId) return false;
      return true;
    });
  }, [words, searchWords, filterWords]);

  const filteredCharacters = useMemo(() => {
    return characters.filter((c) => {
      const q = searchCharacters.toLowerCase().trim();
      const matches =
        !q ||
        c.content.toLowerCase().includes(q) ||
        c.pinyin.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q);
      if (!matches) return false;
      if (filterCharacters === 'unassigned' && c.hskId) return false;
      return true;
    });
  }, [characters, searchCharacters, filterCharacters]);

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const q = searchRules.toLowerCase().trim();
      const matches = !q || r.content.toLowerCase().includes(q);
      if (!matches) return false;
      if (filterRules === 'unassigned' && r.hskId) return false;
      return true;
    });
  }, [rules, searchRules, filterRules]);

  // Bulk select handlers
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
      filteredTexts.forEach((t) => next.add(t.id));
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

  const handleSelectAllWords = () => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      filteredWords.forEach((w) => next.add(w.id));
      return next;
    });
  };

  const handleSelectAllCharacters = () => {
    setSelectedCharacterIds((prev) => {
      const next = new Set(prev);
      filteredCharacters.forEach((c) => next.add(c.id));
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

  const totalSelectedCount =
    selectedLessonIds.size +
    selectedTextIds.size +
    selectedSentenceIds.size +
    selectedWordIds.size +
    selectedCharacterIds.size +
    selectedRuleIds.size;

  // Save HSK handler
  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing HSK Name', 'Please enter HSK level name (e.g. HSK 1).');
      return;
    }

    try {
      const hskName = name.trim();

      if (isEditing && editHskId) {
        updateHSK(editHskId, hskName);
        updateHSKRelations(editHskId, {
          lessonIds: Array.from(selectedLessonIds),
          textIds: Array.from(selectedTextIds),
          sentenceIds: Array.from(selectedSentenceIds),
          wordIds: Array.from(selectedWordIds),
          characterIds: Array.from(selectedCharacterIds),
          ruleIds: Array.from(selectedRuleIds),
        });

        Alert.alert('Success', 'HSK level updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      // Create new HSK record
      const result = createHSK(hskName);
      const hskId = Number(result.lastInsertRowId);

      // Link relations
      linkHSKRelations(hskId, {
        lessonIds: Array.from(selectedLessonIds),
        textIds: Array.from(selectedTextIds),
        sentenceIds: Array.from(selectedSentenceIds),
        wordIds: Array.from(selectedWordIds),
        characterIds: Array.from(selectedCharacterIds),
        ruleIds: Array.from(selectedRuleIds),
      });

      const details = `Linked ${selectedLessonIds.size} lessons, ${selectedTextIds.size} texts, ${selectedSentenceIds.size} sentences, ${selectedWordIds.size} words, ${selectedCharacterIds.size} characters, ${selectedRuleIds.size} rules`;

      setCreatedBannerInfo({
        visible: true,
        hskName,
        itemCount: totalSelectedCount,
        details,
      });

      // Clear form inputs
      setName('');
      setSelectedLessonIds(new Set());
      setSelectedTextIds(new Set());
      setSelectedSentenceIds(new Set());
      setSelectedWordIds(new Set());
      setSelectedCharacterIds(new Set());
      setSelectedRuleIds(new Set());
    } catch (e) {
      console.error('Failed to save HSK level:', e);
      Alert.alert('Database Error', 'Could not save the HSK level. Ensure the HSK name is unique.');
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label={isEditing ? 'Edit HSK Level' : 'Create HSK Level'}
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Banner */}
          <SuccessBanner
            visible={createdBannerInfo.visible}
            title="HSK Level Created!"
            lessonTitle={createdBannerInfo.hskName}
            details={createdBannerInfo.details}
            onClose={() =>
              setCreatedBannerInfo((prev) => ({ ...prev, visible: false }))
            }
          />

          {/* ===== HSK DETAILS CARD ===== */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Lucide name="layers" size={20} color="#6366f1" />
              <Text style={styles.cardTitle}>HSK Level Details</Text>
            </View>

            {/* Name Input (Required) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                HSK Name / Level <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., HSK 1, HSK Level 2, HSK 7-9"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* ===== LESSONS SECTION ===== */}
          <SliderSection
            title="Lessons"
            icon="book-open"
            color="#2563eb"
            totalCount={lessons.length}
            selectedCount={selectedLessonIds.size}
            expanded={expandedSections.lessons}
            onToggle={() => toggleSection('lessons')}
            onAddNew={() => router.push('/pages/addLesson')}
            addNewLabel="+ Lesson"
            onSelectAll={handleSelectAllLessons}
            onClearAll={() => setSelectedLessonIds(new Set())}
            searchQuery={searchLessons}
            onSearchChange={setSearchLessons}
            filterMode={filterLessons}
            onFilterChange={setFilterLessons}
            hasHskSelected={false}
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
            totalCount={texts.length}
            selectedCount={selectedTextIds.size}
            expanded={expandedSections.texts}
            onToggle={() => toggleSection('texts')}
            onAddNew={() => router.push('/pages/addText')}
            addNewLabel="+ Text"
            onSelectAll={handleSelectAllTexts}
            onClearAll={() => setSelectedTextIds(new Set())}
            searchQuery={searchTexts}
            onSearchChange={setSearchTexts}
            filterMode={filterTexts}
            onFilterChange={setFilterTexts}
            hasHskSelected={false}
          >
            {filteredTexts.length === 0 ? (
              <Text style={styles.emptyText}>No reading texts match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
              >
                {filteredTexts.map((t) => (
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
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== SENTENCES SECTION ===== */}
          <SliderSection
            title="Sentences"
            icon="message-square-text"
            color="#8b5cf6"
            totalCount={sentences.length}
            selectedCount={selectedSentenceIds.size}
            expanded={expandedSections.sentences}
            onToggle={() => toggleSection('sentences')}
            onAddNew={() => router.push('/pages/addSentence')}
            addNewLabel="+ Sentence"
            onSelectAll={handleSelectAllSentences}
            onClearAll={() => setSelectedSentenceIds(new Set())}
            searchQuery={searchSentences}
            onSearchChange={setSearchSentences}
            filterMode={filterSentences}
            onFilterChange={setFilterSentences}
            hasHskSelected={false}
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
                    onToggle={() => setSelectedSentenceIds((prev) => toggleId(prev, s.id))}
                    color="#8b5cf6"
                    width={200}
                  />
                ))}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== WORDS SECTION ===== */}
          <SliderSection
            title="Vocabulary Words"
            icon="languages"
            color="#059669"
            totalCount={words.length}
            selectedCount={selectedWordIds.size}
            expanded={expandedSections.words}
            onToggle={() => toggleSection('words')}
            onAddNew={() => router.push('/pages/addWord')}
            addNewLabel="+ Word"
            onSelectAll={handleSelectAllWords}
            onClearAll={() => setSelectedWordIds(new Set())}
            searchQuery={searchWords}
            onSearchChange={setSearchWords}
            filterMode={filterWords}
            onFilterChange={setFilterWords}
            hasHskSelected={false}
          >
            {filteredWords.length === 0 ? (
              <Text style={styles.emptyText}>No vocabulary words match the filter.</Text>
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
                    onToggle={() => setSelectedWordIds((prev) => toggleId(prev, w.id))}
                    color="#059669"
                    width={150}
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
            totalCount={characters.length}
            selectedCount={selectedCharacterIds.size}
            expanded={expandedSections.characters}
            onToggle={() => toggleSection('characters')}
            onAddNew={() => router.push('/pages/addCharacter')}
            addNewLabel="+ Character"
            onSelectAll={handleSelectAllCharacters}
            onClearAll={() => setSelectedCharacterIds(new Set())}
            searchQuery={searchCharacters}
            onSearchChange={setSearchCharacters}
            filterMode={filterCharacters}
            onFilterChange={setFilterCharacters}
            hasHskSelected={false}
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
                  />
                ))}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== RULES SECTION ===== */}
          <SliderSection
            title="Grammar Rules"
            icon="book-open-check"
            color="#d97706"
            totalCount={rules.length}
            selectedCount={selectedRuleIds.size}
            expanded={expandedSections.rules}
            onToggle={() => toggleSection('rules')}
            onAddNew={() => router.push('/pages/addRule')}
            addNewLabel="+ Rule"
            onSelectAll={handleSelectAllRules}
            onClearAll={() => setSelectedRuleIds(new Set())}
            searchQuery={searchRules}
            onSearchChange={setSearchRules}
            filterMode={filterRules}
            onFilterChange={setFilterRules}
            hasHskSelected={false}
          >
            {filteredRules.length === 0 ? (
              <Text style={styles.emptyText}>No grammar rules match the filter.</Text>
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
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== SAVE BUTTON ===== */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Lucide name={isEditing ? 'check-circle' : 'plus-circle'} size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update HSK Level' : 'Create HSK Level'}
              {totalSelectedCount > 0 ? ` (${totalSelectedCount} linked items)` : ''}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default AddHSK;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 10,
    gap: 12,
  },
  headerSaveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 50,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4f46e5',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
    paddingVertical: 8,
    gap: 10,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

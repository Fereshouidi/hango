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
  getAllTexts,
  getAllSentences,
  getAllWords,
  getAllCharacters,
  linkRuleRelations,
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
} from '@/types';
import {
  CharacterCard,
  ItemCard,
  SliderSection,
} from '@/components/add-lesson';
import { SuccessBanner } from '@/components/banners';

const AddRule = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const preselectedHskId = params.hskId ? Number(params.hskId) : null;
  const preselectedLessonId = params.lessonId ? Number(params.lessonId) : null;
  const preselectedTextId = params.textId ? Number(params.textId) : null;
  const preselectedSentenceId = params.sentenceId ? Number(params.sentenceId) : null;
  const preselectedWordId = params.wordId ? Number(params.wordId) : null;
  const preselectedCharacterId =
    params.characterId || params.caracterid
      ? Number(params.characterId || params.caracterid)
      : null;

  // Rule Form fields
  const [content, setContent] = useState('');

  // All entities from DB
  const [hsks, setHsks] = useState<HSKType[]>([]);
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [texts, setTexts] = useState<TextType[]>([]);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [words, setWords] = useState<WordType[]>([]);
  const [characters, setCharacters] = useState<CharacterType[]>([]);

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
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(
    preselectedWordId ? new Set([preselectedWordId]) : new Set()
  );
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<number>>(
    preselectedCharacterId ? new Set([preselectedCharacterId]) : new Set()
  );

  // Search queries per section
  const [searchHsks, setSearchHsks] = useState('');
  const [searchLessons, setSearchLessons] = useState('');
  const [searchTexts, setSearchTexts] = useState('');
  const [searchSentences, setSearchSentences] = useState('');
  const [searchWords, setSearchWords] = useState('');
  const [searchCharacters, setSearchCharacters] = useState('');

  // Filter modes per section
  const [filterHsks, setFilterHsks] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterLessons, setFilterLessons] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterTexts, setFilterTexts] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterSentences, setFilterSentences] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterWords, setFilterWords] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [filterCharacters, setFilterCharacters] = useState<'all' | 'unassigned' | 'hsk'>('all');

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hsks: false,
    lessons: true,
    texts: false,
    sentences: false,
    words: true,
    characters: false,
  });

  const [createdBannerInfo, setCreatedBannerInfo] = useState<{
    visible: boolean;
    ruleContent: string;
    itemCount: number;
    details: string;
  }>({
    visible: false,
    ruleContent: '',
    itemCount: 0,
    details: '',
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Load DB items on focus
  useFocusEffect(
    useCallback(() => {
      try {
        const hskData = getAllHSKs() as unknown as HSKType[];
        setHsks(hskData || []);
        const lessonData = getAllLessons() as unknown as LessonType[];
        setLessons(lessonData || []);
        const textData = getAllTexts() as unknown as TextType[];
        setTexts(textData || []);
        const sentenceData = getAllSentences() as unknown as SentenceType[];
        setSentences(sentenceData || []);
        const wordData = getAllWords() as unknown as WordType[];
        setWords(wordData || []);
        const charData = getAllCharacters() as unknown as CharacterType[];
        setCharacters(charData || []);
      } catch (e) {
        console.error('Failed to load DB items for addRule:', e);
      }
    }, [])
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

  const filteredTexts = useMemo(() => {
    return texts.filter((t) => {
      const q = searchTexts.toLowerCase().trim();
      const matches =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.meaning.toLowerCase().includes(q);
      if (!matches) return false;
      if (filterTexts === 'unassigned' && t.lessonId) return false;
      if (filterTexts === 'hsk' && selectedHskIds.size > 0 && t.hskId && !selectedHskIds.has(t.hskId)) return false;
      return true;
    });
  }, [texts, searchTexts, filterTexts, selectedHskIds]);

  const filteredSentences = useMemo(() => {
    return sentences.filter((s) => {
      const q = searchSentences.toLowerCase().trim();
      const matches =
        !q ||
        s.content.toLowerCase().includes(q) ||
        s.pinyin.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q);
      if (!matches) return false;
      if (filterSentences === 'unassigned' && s.lessonId) return false;
      if (filterSentences === 'hsk' && selectedHskIds.size > 0 && s.hskId && !selectedHskIds.has(s.hskId)) return false;
      return true;
    });
  }, [sentences, searchSentences, filterSentences, selectedHskIds]);

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const q = searchWords.toLowerCase().trim();
      const matches =
        !q ||
        w.content.toLowerCase().includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q);
      if (!matches) return false;
      if (filterWords === 'hsk' && selectedHskIds.size > 0 && w.hskId && !selectedHskIds.has(w.hskId)) return false;
      return true;
    });
  }, [words, searchWords, filterWords, selectedHskIds]);

  const filteredCharacters = useMemo(() => {
    return characters.filter((c) => {
      const q = searchCharacters.toLowerCase().trim();
      const matches =
        !q ||
        c.content.toLowerCase().includes(q) ||
        c.pinyin.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q);
      if (!matches) return false;
      if (filterCharacters === 'hsk' && selectedHskIds.size > 0 && c.hskId && !selectedHskIds.has(c.hskId)) return false;
      return true;
    });
  }, [characters, searchCharacters, filterCharacters, selectedHskIds]);

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

  const totalSelectedCount =
    selectedHskIds.size +
    selectedLessonIds.size +
    selectedTextIds.size +
    selectedSentenceIds.size +
    selectedWordIds.size +
    selectedCharacterIds.size;

  // Save Rule handler
  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please enter grammar rule explanation.');
      return;
    }

    try {
      const ruleText = content.trim();
      const primaryHskId = selectedHskIds.size > 0 ? Array.from(selectedHskIds)[0] : null;
      const primaryLessonId = selectedLessonIds.size > 0 ? Array.from(selectedLessonIds)[0] : null;
      const primaryTextId = selectedTextIds.size > 0 ? Array.from(selectedTextIds)[0] : null;
      const primarySentenceId = selectedSentenceIds.size > 0 ? Array.from(selectedSentenceIds)[0] : null;
      const primaryWordId = selectedWordIds.size > 0 ? Array.from(selectedWordIds)[0] : null;

      // 1. Insert new Rule record
      const result = db.runSync(
        `INSERT INTO rules (content, hskId, lessonId, textId, sentenceId, wordId) VALUES (?, ?, ?, ?, ?, ?)`,
        ruleText,
        primaryHskId,
        primaryLessonId,
        primaryTextId,
        primarySentenceId,
        primaryWordId
      );

      const ruleId = result.lastInsertRowId;

      // 2. Link all Many-to-Many relations via junction tables
      linkRuleRelations(ruleId, {
        hskIds: Array.from(selectedHskIds),
        lessonIds: Array.from(selectedLessonIds),
        textIds: Array.from(selectedTextIds),
        sentenceIds: Array.from(selectedSentenceIds),
        wordIds: Array.from(selectedWordIds),
        characterIds: Array.from(selectedCharacterIds),
      });

      const details = `Linked ${selectedHskIds.size} HSKs, ${selectedLessonIds.size} lessons, ${selectedTextIds.size} texts, ${selectedSentenceIds.size} sentences, ${selectedWordIds.size} words, ${selectedCharacterIds.size} characters`;

      setCreatedBannerInfo({
        visible: true,
        ruleContent: ruleText.length > 35 ? ruleText.substring(0, 35) + '...' : ruleText,
        itemCount: totalSelectedCount,
        details,
      });

      // Clear form inputs
      setContent('');
      setSelectedHskIds(new Set());
      setSelectedLessonIds(new Set());
      setSelectedTextIds(new Set());
      setSelectedSentenceIds(new Set());
      setSelectedWordIds(new Set());
      setSelectedCharacterIds(new Set());
    } catch (e) {
      console.error('Failed to save rule:', e);
      Alert.alert('Database Error', 'Could not save the new grammar rule.');
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label="Create Rule"
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
            title="Grammar Rule Created!"
            lessonTitle={createdBannerInfo.ruleContent}
            details={createdBannerInfo.details}
            onClose={() =>
              setCreatedBannerInfo((prev) => ({ ...prev, visible: false }))
            }
          />

          {/* ===== RULE DETAILS CARD ===== */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Lucide name="book-open-check" size={20} color="#d97706" />
              <Text style={styles.cardTitle}>Grammar Rule Explanation</Text>
            </View>

            {/* Content Input (Required) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Rule Explanation / Pattern <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="e.g., Subject + 是 + Noun (indicates identity or equivalence)"
                placeholderTextColor="#94a3b8"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={3}
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
            totalCount={texts.length}
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
            searchQuery={searchTexts}
            onSearchChange={setSearchTexts}
            filterMode={filterTexts}
            onFilterChange={setFilterTexts}
            hasHskSelected={selectedHskIds.size > 0}
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
            searchQuery={searchSentences}
            onSearchChange={setSearchSentences}
            filterMode={filterSentences}
            onFilterChange={setFilterSentences}
            hasHskSelected={selectedHskIds.size > 0}
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
            title="Words"
            icon="languages"
            color="#059669"
            totalCount={words.length}
            selectedCount={selectedWordIds.size}
            expanded={expandedSections.words}
            onToggle={() => toggleSection('words')}
            onAddNew={() =>
              router.push(
                selectedHskIds.size > 0
                  ? `/pages/addWord?hskId=${Array.from(selectedHskIds)[0]}`
                  : '/pages/addWord'
              )
            }
            addNewLabel="+ Word"
            onSelectAll={handleSelectAllWords}
            onClearAll={() => setSelectedWordIds(new Set())}
            searchQuery={searchWords}
            onSearchChange={setSearchWords}
            filterMode={filterWords}
            onFilterChange={setFilterWords}
            hasHskSelected={selectedHskIds.size > 0}
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
            searchQuery={searchCharacters}
            onSearchChange={setSearchCharacters}
            filterMode={filterCharacters}
            onFilterChange={setFilterCharacters}
            hasHskSelected={selectedHskIds.size > 0}
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

          {/* ===== SAVE BUTTON ===== */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Lucide name="plus-circle" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              Create Grammar Rule
              {totalSelectedCount > 0 ? ` (${totalSelectedCount} linked items)` : ''}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default AddRule;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 10,
    gap: 12,
  },
  headerSaveButton: {
    backgroundColor: '#d97706',
    borderRadius: 50,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#b45309',
    shadowColor: '#d97706',
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
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
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
    backgroundColor: '#d97706',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#d97706',
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

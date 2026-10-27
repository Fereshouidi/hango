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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import {
  getAllHSKs,
  getAllLessons,
  getAllTexts,
  getWordsPaged,
  getWordsCount,
  getCharactersPaged,
  getCharactersCountPaged,
  getRulesPaged,
  getRulesCount,
  getSentenceById,
  getWordsBySentenceId,
  getCharactersBySentenceId,
  getRulesBySentenceId,
  updateSentence,
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
  WordType,
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
import { PinyinInputField } from '@/components/common/PinyinInputField';
import { ScanOCRButton } from '@/components/common/ScanOCRButton';
import { AutoTranslateButton } from '@/components/common/AutoTranslateButton';
import { ScannedResult } from '@/services/ocrService';
import { toPinyin } from '@/utils/pinyin';

import { CollapsibleLinkingSection } from '@/components/common/CollapsibleLinkingSection';

const SLIDER_PAGE_SIZE = 10;

const AddSentence = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawEditId = params.sentenceId || (params.id && !params.hskId && !params.lessonId && !params.textId ? params.id : undefined);
  const editSentenceId = rawEditId && !isNaN(Number(rawEditId)) ? Number(rawEditId) : null;
  const isEditing = Boolean(editSentenceId);

  const preselectedHskId = params.hskId ? Number(params.hskId) : null;
  const preselectedLessonId = params.lessonId ? Number(params.lessonId) : null;
  const preselectedTextId = params.textId ? Number(params.textId) : null;

  // Sentence Form fields
  const [content, setContent] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [meaning, setMeaning] = useState('');
  const [isPinyinManual, setIsPinyinManual] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);

  const handleContentChange = (text: string) => {
    setContent(text);
    if (!isPinyinManual) {
      setPinyin(toPinyin(text));
    }
  };

  const handlePinyinChange = (text: string) => {
    setPinyin(text);
    setIsPinyinManual(true);
  };

  const handleApplyOcr = (result: ScannedResult) => {
    setContent(result.text);
    if (result.pinyin) {
      setPinyin(result.pinyin);
      setIsPinyinManual(true);
    }
    if (result.meaning) {
      setMeaning(result.meaning);
    }
  };

  const [hsks, setHsks] = useState<HSKType[]>([]);
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [texts, setTexts] = useState<TextType[]>([]);

  const [selectedHskId, setSelectedHskId] = useState<number | null>(preselectedHskId);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(preselectedLessonId);
  const [selectedTextId, setSelectedTextId] = useState<number | null>(preselectedTextId);

  const [showHskPicker, setShowHskPicker] = useState(false);
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);


  const [createdBannerInfo, setCreatedBannerInfo] = useState<{
    visible: boolean;
    sentenceContent: string;
    itemCount: number;
    details: string;
  }>({
    visible: false,
    sentenceContent: '',
    itemCount: 0,
    details: '',
  });

  // Selected item IDs
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(new Set());
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<number>>(new Set());
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<number>>(new Set());

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    words: false,
    characters: false,
    rules: false,
  });
  const [showOptionalLinks, setShowOptionalLinks] = useState(false);

  // Paginated sections (DB-level, 10 at a time)
  const wordsPage = usePagedSection<WordType>(getWordsPaged, getWordsCount);
  const charactersPage = usePagedSection<CharacterType>(getCharactersPaged, getCharactersCountPaged);
  const rulesPage = usePagedSection<RuleType>(getRulesPaged, getRulesCount);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Load HSKs, Lessons, Texts, and selectable items from DB
  useFocusEffect(
    useCallback(() => {
      try {
        const hskData = getAllHSKs() as unknown as HSKType[];
        setHsks(hskData || []);
        const lessonData = getAllLessons() as unknown as LessonType[];
        setLessons(lessonData || []);
        const textData = getAllTexts() as unknown as TextType[];
        setTexts(textData || []);

        // If editing, pre-fill form with existing sentence data
        if (editSentenceId) {
          const existing = getSentenceById(editSentenceId);
          if (existing) {
            setContent(existing.content || '');
            setPinyin(existing.pinyin || '');
            setIsPinyinManual(Boolean(existing.pinyin));
            setMeaning(existing.meaning || '');
            setSelectedHskId(existing.hskId || null);
            setSelectedLessonId(existing.lessonId || null);
            setSelectedTextId(existing.textId || null);
          }
          const linkedWords = (getWordsBySentenceId(editSentenceId) as any[]) || [];
          const linkedChars = (getCharactersBySentenceId(editSentenceId) as any[]) || [];
          const linkedRules = (getRulesBySentenceId(editSentenceId) as any[]) || [];
          setSelectedWordIds(new Set(linkedWords.map((w: any) => w.id)));
          setSelectedCharacterIds(new Set(linkedChars.map((c: any) => c.id)));
          setSelectedRuleIds(new Set(linkedRules.map((r: any) => r.id)));
        }
      } catch (e) {
        console.error('Failed to load DB items for addSentence:', e);
      }
      wordsPage.initialize();
      charactersPage.initialize();
      rulesPage.initialize();
    }, [editSentenceId])
  );

  const selectedHskObj = useMemo(
    () => hsks.find((h) => h.id === selectedHskId),
    [hsks, selectedHskId]
  );

  const selectedLessonObj = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId),
    [lessons, selectedLessonId]
  );

  const selectedTextObj = useMemo(
    () => texts.find((t) => t.id === selectedTextId),
    [texts, selectedTextId]
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

  // Filtering helpers
  // Select all handlers
  const handleSelectAllWords = () => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      wordsPage.items.forEach((w) => next.add(w.id));
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
    selectedWordIds.size +
    selectedCharacterIds.size +
    selectedRuleIds.size;

  // Save Sentence handler
  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please enter Chinese sentence content.');
      return;
    }

    try {
      const sentenceText = content.trim();
      const finalPinyin = pinyin.trim() || toPinyin(sentenceText);

      if (isEditing && editSentenceId) {
        updateSentence(editSentenceId, {
          content: sentenceText,
          pinyin: finalPinyin,
          meaning: meaning.trim(),
          hskId: selectedHskId ?? undefined,
          lessonId: selectedLessonId ?? undefined,
          textId: selectedTextId ?? undefined,
        });

        // Update word, char, rule associations
        for (const id of selectedWordIds) {
          db.runSync(
            `UPDATE words SET sentenceId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
            editSentenceId,
            selectedHskId,
            id
          );
        }
        for (const id of selectedCharacterIds) {
          db.runSync(
            `UPDATE characters SET sentenceId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
            editSentenceId,
            selectedHskId,
            id
          );
        }
        for (const id of selectedRuleIds) {
          db.runSync(
            `UPDATE rules SET sentenceId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
            editSentenceId,
            selectedHskId,
            id
          );
        }

        Alert.alert('Success', 'Sentence updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      // 1. Insert new Sentence record into DB
      const result = db.runSync(
        `INSERT INTO sentences (content, pinyin, meaning, hskId, lessonId, textId) VALUES (?, ?, ?, ?, ?, ?)`,
        sentenceText,
        finalPinyin,
        meaning.trim(),
        selectedHskId,
        selectedLessonId,
        selectedTextId
      );

      const sentenceId = result.lastInsertRowId;

      // 2. Associate selected words
      for (const id of selectedWordIds) {
        db.runSync(
          `UPDATE words SET sentenceId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
          sentenceId,
          selectedHskId,
          id
        );
      }

      // 3. Associate selected characters
      for (const id of selectedCharacterIds) {
        db.runSync(
          `UPDATE characters SET sentenceId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
          sentenceId,
          selectedHskId,
          id
        );
      }

      // 4. Associate selected rules
      for (const id of selectedRuleIds) {
        db.runSync(
          `UPDATE rules SET sentenceId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
          sentenceId,
          selectedHskId,
          id
        );
      }

      const details = `Linked ${selectedWordIds.size} words, ${selectedCharacterIds.size} characters, ${selectedRuleIds.size} rules`;

      setCreatedBannerInfo({
        visible: true,
        sentenceContent: sentenceText,
        itemCount: totalSelectedCount,
        details,
      });

      // Clear form inputs
      setContent('');
      setPinyin('');
      setIsPinyinManual(false);
      setMeaning('');
      setSelectedWordIds(new Set());
      setSelectedCharacterIds(new Set());
      setSelectedRuleIds(new Set());
    } catch (e) {
      console.error('Failed to save sentence:', e);
      Alert.alert('Database Error', 'Could not save the new sentence.');
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label={isEditing ? 'Edit Sentence' : 'Create Sentence'}
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
        title="Sentence Created!"
        lessonTitle={createdBannerInfo.sentenceContent}
        details={createdBannerInfo.details}
        actionText="Done"
        onAction={() => {
          setCreatedBannerInfo((prev) => ({ ...prev, visible: false }));
          router.back();
        }}
        onClose={() => {
          setCreatedBannerInfo((prev) => ({ ...prev, visible: false }));
          router.back();
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ===== SENTENCE DETAILS CARD ===== */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Lucide name="message-square-text" size={20} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Sentence Details</Text>
            </View>

            {/* Content Input (Required) */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>
                  Chinese Content <Text style={styles.requiredStar}>*</Text>
                </Text>
                <ScanOCRButton
                  mode="sentence"
                  onScanResult={handleApplyOcr}
                  themeColor="#8b5cf6"
                  label="Scan with Camera"
                />
              </View>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter Chinese sentence content..."
                placeholderTextColor="#94a3b8"
                value={content}
                onChangeText={handleContentChange}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Pinyin Input with Auto-generation */}
            <PinyinInputField
              value={pinyin}
              onChangeText={handlePinyinChange}
              chineseText={content}
              placeholder="Enter Pinyin transcription..."
              multiline
              numberOfLines={2}
              themeColor="#8b5cf6"
            />

            {/* Meaning Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>Meaning / English Translation</Text>
                <AutoTranslateButton
                  chineseText={content}
                  onTranslated={setMeaning}
                  themeColor="#8b5cf6"
                />
              </View>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter English translation..."
                placeholderTextColor="#94a3b8"
                value={meaning}
                onChangeText={setMeaning}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Pickers Row (HSK, Lesson, Text) */}
            <View style={styles.pickersColGroup}>
              {/* HSK Picker */}
              <View style={styles.pickerCol}>
                <Text style={styles.inputLabel}>HSK Level (optional)</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowHskPicker(!showHskPicker)}
                  activeOpacity={0.7}
                >
                  <Lucide name="layers" size={16} color="#8b5cf6" />
                  <Text style={styles.pickerBtnText}>
                    {selectedHskObj ? selectedHskObj.name : 'Select HSK'}
                  </Text>
                  <Lucide name="chevron-down" size={16} color="#64748b" />
                </TouchableOpacity>

                {showHskPicker && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView
                      nestedScrollEnabled={true}
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}
                    >
                      <TouchableOpacity
                        style={styles.dropdownOption}
                        onPress={() => {
                          setSelectedHskId(null);
                          setShowHskPicker(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>None</Text>
                      </TouchableOpacity>
                      {hsks.map((hsk) => (
                        <TouchableOpacity
                          key={hsk.id}
                          style={[
                            styles.dropdownOption,
                            selectedHskId === hsk.id && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setSelectedHskId(hsk.id);
                            setShowHskPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              selectedHskId === hsk.id && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {hsk.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Lesson Picker */}
              <View style={styles.pickerCol}>
                <Text style={styles.inputLabel}>Associated Lesson (optional)</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowLessonPicker(!showLessonPicker)}
                  activeOpacity={0.7}
                >
                  <Lucide name="book-open" size={16} color="#8b5cf6" />
                  <Text style={styles.pickerBtnText} numberOfLines={1}>
                    {selectedLessonObj ? `Lesson ${selectedLessonObj.num}` : 'Select Lesson'}
                  </Text>
                  <Lucide name="chevron-down" size={16} color="#64748b" />
                </TouchableOpacity>

                {showLessonPicker && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView
                      nestedScrollEnabled={true}
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}
                    >
                      <TouchableOpacity
                        style={styles.dropdownOption}
                        onPress={() => {
                          setSelectedLessonId(null);
                          setShowLessonPicker(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>None</Text>
                      </TouchableOpacity>
                      {lessons.map((les) => (
                        <TouchableOpacity
                          key={les.id}
                          style={[
                            styles.dropdownOption,
                            selectedLessonId === les.id && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setSelectedLessonId(les.id);
                            setShowLessonPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              selectedLessonId === les.id && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            L{les.num}: {les.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Text Passage Picker */}
              <View style={styles.pickerCol}>
                <Text style={styles.inputLabel}>Associated Reading Text (optional)</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowTextPicker(!showTextPicker)}
                  activeOpacity={0.7}
                >
                  <Lucide name="file-text" size={16} color="#8b5cf6" />
                  <Text style={styles.pickerBtnText} numberOfLines={1}>
                    {selectedTextObj ? selectedTextObj.title : 'Select Reading Text'}
                  </Text>
                  <Lucide name="chevron-down" size={16} color="#64748b" />
                </TouchableOpacity>

                {showTextPicker && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView
                      nestedScrollEnabled={true}
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={true}
                    >
                      <TouchableOpacity
                        style={styles.dropdownOption}
                        onPress={() => {
                          setSelectedTextId(null);
                          setShowTextPicker(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>None</Text>
                      </TouchableOpacity>
                      {texts.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.dropdownOption,
                            selectedTextId === t.id && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setSelectedTextId(t.id);
                            setShowTextPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              selectedTextId === t.id && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {t.title || t.content.substring(0, 18)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ===== OPTIONAL LINKING SECTIONS ===== */}
          <CollapsibleLinkingSection
            title="Link to Words, Characters, etc. (Optional)"
            subtitle="Connect to vocabulary words, characters, or grammar rules"
            icon="link-2"
            accentColor="#8b5cf6"
            selectedCount={totalSelectedCount}
            isOpen={showOptionalLinks}
            onToggle={() => setShowOptionalLinks((prev) => !prev)}
            tip="Connecting items is completely optional! You can create this sentence now without selecting any items, or link what's relevant to you."
          >
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
              if (editSentenceId) queryParts.push(`sentenceId=${editSentenceId}`);
              if (selectedTextId) queryParts.push(`textId=${selectedTextId}`);
              if (selectedLessonId) queryParts.push(`lessonId=${selectedLessonId}`);
              if (selectedHskId) queryParts.push(`hskId=${selectedHskId}`);
              const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
              router.push(`/pages/addWord${qs}` as any);
            }}
            addNewLabel="+ Word"
            onSelectAll={handleSelectAllWords}
            onClearAll={() => setSelectedWordIds(new Set())}
            searchQuery={wordsPage.search}
            onSearchChange={wordsPage.setSearch}
            filterMode={wordsPage.filter}
            onFilterChange={(f) => wordsPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={!!selectedHskId}
            hint="📖 New words — link only the words you just learned or found important in this sentence. Just a few is perfectly fine!"
          >
            {wordsPage.items.length === 0 ? (
              <Text style={styles.emptyText}>No words match the filter.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    wordsPage.loadMore();
                  }
                }}
                scrollEventThrottle={16}
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
                  />
                ))}
                {wordsPage.hasMore && (
                  <SliderLoadMoreCard
                    currentCount={wordsPage.items.length}
                    totalCount={wordsPage.total}
                    pageSize={SLIDER_PAGE_SIZE}
                    color="#059669"
                    onLoadMore={wordsPage.loadMore}
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
            onSelectAll={handleSelectAllCharacters}
            onClearAll={() => setSelectedCharacterIds(new Set())}
            searchQuery={charactersPage.search}
            onSearchChange={charactersPage.setSearch}
            filterMode={charactersPage.filter}
            onFilterChange={(f) => charactersPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={!!selectedHskId}
            hint="🔡 New characters — pick only the characters you want to study from this sentence. There's no need to add them all!"
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
            onSelectAll={handleSelectAllRules}
            onClearAll={() => setSelectedRuleIds(new Set())}
            searchQuery={rulesPage.search}
            onSearchChange={rulesPage.setSearch}
            filterMode={rulesPage.filter}
            onFilterChange={(f) => rulesPage.setFilter(f as 'all' | 'unassigned')}
            hasHskSelected={!!selectedHskId}
            hint="📐 Grammar rules — link any grammar pattern this sentence uses. It's optional and totally up to you!"
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
          </CollapsibleLinkingSection>

          {/* ===== SAVE BUTTON ===== */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Lucide name="plus-circle" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              Create Sentence
              {totalSelectedCount > 0 ? ` (${totalSelectedCount} linked items)` : ''}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

    </ThemedView>
  );
};

export default AddSentence;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 5,
    gap: 5,
  },
  headerSaveButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 50,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7c3aed',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  card: {
    backgroundColor: '#ffffffea',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8b5cf640',
    backgroundColor: '#8b5cf612',
  },
  scanBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    minHeight: 65,
    textAlignVertical: 'top',
  },
  pickersColGroup: {
    gap: 10,
  },
  pickerCol: {
    gap: 6,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  pickerBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 2000,
    overflow: 'hidden',
  },
  dropdownScrollView: {
    maxHeight: 180,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownOptionSelected: {
    backgroundColor: '#f3e8ff',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  dropdownOptionTextSelected: {
    color: '#7c3aed',
    fontWeight: '700',
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
    backgroundColor: '#8b5cf6',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    gap: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

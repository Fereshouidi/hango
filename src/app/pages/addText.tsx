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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import {
  getAllHSKs,
  getAllLessons,
  getWordsPaged,
  getWordsCount,
  getCharactersPaged,
  getCharactersCountPaged,
  getRulesPaged,
  getRulesCount,
  getTextById,
  updateText,
  getWordsByTextId,
  getCharactersByTextId,
  getRulesByTextId,
  db,
} from '@/db/utils';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  HSKType,
  LessonType,
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
import { TextToSentencesConstructions } from '@/components/sub/textToSentencesConstructions';
import { PinyinInputField } from '@/components/common/PinyinInputField';
import { ScanOCRButton } from '@/components/common/ScanOCRButton';
import { AutoTranslateButton } from '@/components/common/AutoTranslateButton';
import { ScannedResult } from '@/services/ocrService';
import { toPinyin } from '@/utils/pinyin';

import { CollapsibleLinkingSection } from '@/components/common/CollapsibleLinkingSection';

const SLIDER_PAGE_SIZE = 10;

type ExtractedSentence = {
  id: number;
  content: string;
  pinyin: string;
  meaning: string;
};

const AddText = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawEditId = params.textId || (params.id && !params.hskId && !params.lessonId ? params.id : undefined);
  const editTextId = rawEditId && !isNaN(Number(rawEditId)) ? Number(rawEditId) : null;
  const isEditing = Boolean(editTextId);

  const preselectedHskId = params.hskId ? Number(params.hskId) : null;
  const preselectedLessonId = params.lessonId ? Number(params.lessonId) : null;
  const loadedEditTextIdRef = useRef<number | null>(null);

  // Text Form fields
  const [title, setTitle] = useState('');
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
    if (!title.trim()) {
      setTitle(result.text.substring(0, 15) + (result.text.length > 15 ? '...' : ''));
    }
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
  const [selectedHskId, setSelectedHskId] = useState<number | null>(preselectedHskId);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(preselectedLessonId);

  const [showHskPicker, setShowHskPicker] = useState(false);
  const [showLessonPicker, setShowLessonPicker] = useState(false);


  // Extracted Sentences from the text typed by the user
  const [extractedSentences, setExtractedSentences] = useState<ExtractedSentence[]>([]);
  const [selectedSentenceIndices, setSelectedSentenceIndices] = useState<Set<number>>(new Set());

  const [createdBannerInfo, setCreatedBannerInfo] = useState<{
    visible: boolean;
    textTitle: string;
    itemCount: number;
    details: string;
  }>({
    visible: false,
    textTitle: '',
    itemCount: 0,
    details: '',
  });

  // Selected item IDs for words, characters, rules
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(new Set());
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<number>>(new Set());
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<number>>(new Set());

  // Search and pagination for extracted sentences
  const [searchSentences, setSearchSentences] = useState('');
  const [filterSentences, setFilterSentences] = useState<'all' | 'unassigned' | 'hsk'>('all');
  const [sentencesVisibleCount, setSentencesVisibleCount] = useState(SLIDER_PAGE_SIZE);

  useEffect(() => {
    setSentencesVisibleCount(SLIDER_PAGE_SIZE);
  }, [searchSentences, filterSentences]);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sentences: false,
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

  // Load HSKs, Lessons, and initialize paged sections
  useFocusEffect(
    useCallback(() => {
      try {
        const hskData = getAllHSKs() as unknown as HSKType[];
        setHsks(hskData || []);
        const lessonData = getAllLessons() as unknown as LessonType[];
        setLessons(lessonData || []);

        if (editTextId && loadedEditTextIdRef.current !== editTextId) {
          const existing = getTextById(editTextId);
          if (existing) {
            setTitle(existing.title || '');
            setContent(existing.content || '');
            setPinyin(existing.pinyin || '');
            setIsPinyinManual(Boolean(existing.pinyin));
            setMeaning(existing.meaning || '');
            setSelectedHskId(existing.hskId || null);
            setSelectedLessonId(existing.lessonId || null);
          }
          const linkedWords = (getWordsByTextId(editTextId) as any[]) || [];
          const linkedChars = (getCharactersByTextId(editTextId) as any[]) || [];
          const linkedRules = (getRulesByTextId(editTextId) as any[]) || [];
          setSelectedWordIds(new Set(linkedWords.map((w: any) => w.id)));
          setSelectedCharacterIds(new Set(linkedChars.map((c: any) => c.id)));
          setSelectedRuleIds(new Set(linkedRules.map((r: any) => r.id)));
          loadedEditTextIdRef.current = editTextId;
        }
      } catch (e) {
        console.error('Failed to load DB items for addText:', e);
      }
      wordsPage.initialize();
      charactersPage.initialize();
      rulesPage.initialize();
    }, [editTextId])
  );

  // Extract sentences, pinyins, and meanings dynamically by sentence points (。 ! ? ！ ？ . \n)
  useEffect(() => {
    if (!content.trim()) {
      setExtractedSentences([]);
      setSelectedSentenceIndices(new Set());
      return;
    }

    // Split passage content by points
    const contentMatches = content.match(/[^。！？!?.\n]+[。！？!?.\n]?/g);
    const rawSentences = contentMatches
      ? contentMatches.map((s) => s.trim()).filter((s) => s.length > 0)
      : [];

    // Split pinyin by points
    const pinyinMatches = pinyin ? pinyin.match(/[^。！？!?.\n]+[。！？!?.\n]?/g) : null;
    const rawPinyins = pinyinMatches
      ? pinyinMatches.map((s) => s.trim()).filter((s) => s.length > 0)
      : [];

    // Split meaning by points
    const meaningMatches = meaning ? meaning.match(/[^。！？!?.\n]+[。！？!?.\n]?/g) : null;
    const rawMeanings = meaningMatches
      ? meaningMatches.map((s) => s.trim()).filter((s) => s.length > 0)
      : [];

    const list: ExtractedSentence[] = rawSentences.map((sentenceText, idx) => ({
      id: idx,
      content: sentenceText,
      pinyin: rawPinyins[idx] || toPinyin(sentenceText),
      meaning: rawMeanings[idx] || '',
    }));

    setExtractedSentences(list);
    // Do not select all by default; preserve any sentences the user explicitly selected
    setSelectedSentenceIndices((prev) => {
      if (prev.size === 0) return prev;
      const validIds = new Set(list.map((s) => s.id));
      const next = new Set<number>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [content, pinyin, meaning]);

  const selectedHskObj = useMemo(
    () => hsks.find((h) => h.id === selectedHskId),
    [hsks, selectedHskId]
  );

  const selectedLessonObj = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId),
    [lessons, selectedLessonId]
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

  // Filter extracted sentences by search query
  const filteredExtractedSentences = useMemo(() => {
    return extractedSentences.filter((s) => {
      const q = searchSentences.toLowerCase().trim();
      return !q || s.content.toLowerCase().includes(q);
    });
  }, [extractedSentences, searchSentences]);

  const displayedExtractedSentences = useMemo(() => {
    const selected = filteredExtractedSentences.filter((s) => selectedSentenceIndices.has(s.id));
    const unselected = filteredExtractedSentences.filter((s) => !selectedSentenceIndices.has(s.id));
    return [...selected, ...unselected].slice(0, sentencesVisibleCount);
  }, [filteredExtractedSentences, selectedSentenceIndices, sentencesVisibleCount]);

  // Select all handlers
  const handleSelectAllSentences = () => {
    setSelectedSentenceIndices(new Set(filteredExtractedSentences.map((s) => s.id)));
  };

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
    selectedSentenceIndices.size +
    selectedWordIds.size +
    selectedCharacterIds.size +
    selectedRuleIds.size;

  // Save Text handler
  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please enter Chinese text passage content.');
      return;
    }

    try {
      const textTitle = title.trim() || content.trim().substring(0, 15) + '...';
      const finalPinyin = pinyin.trim() || toPinyin(content.trim());

      if (isEditing && editTextId) {
        updateText(editTextId, {
          title: textTitle,
          content: content.trim(),
          pinyin: finalPinyin,
          meaning: meaning.trim(),
          hskId: selectedHskId ?? undefined,
          lessonId: selectedLessonId ?? undefined,
        });

        // Associate selected words
        for (const id of selectedWordIds) {
          db.runSync(
            `UPDATE words SET textId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
            editTextId,
            selectedHskId,
            id
          );
        }

        // Associate selected characters
        for (const id of selectedCharacterIds) {
          db.runSync(
            `UPDATE characters SET textId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
            editTextId,
            selectedHskId,
            id
          );
        }

        // Associate selected rules
        for (const id of selectedRuleIds) {
          db.runSync(
            `UPDATE rules SET textId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
            editTextId,
            selectedHskId,
            id
          );
        }

        Alert.alert('Success', 'Text updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      // 1. Insert new Text record into DB
      const result = db.runSync(
        `INSERT INTO texts (title, content, pinyin, meaning, hskId, lessonId) VALUES (?, ?, ?, ?, ?, ?)`,
        textTitle,
        content.trim(),
        finalPinyin,
        meaning.trim(),
        selectedHskId,
        selectedLessonId
      );

      const textId = result.lastInsertRowId;

      // 2. Insert SELECTED sentences generated from the user's text into DB
      let createdSentCount = 0;
      for (const item of extractedSentences) {
        if (selectedSentenceIndices.has(item.id) && item.content.trim()) {
          const sentPinyin = item.pinyin.trim() || toPinyin(item.content.trim());
          db.runSync(
            `INSERT INTO sentences (content, pinyin, meaning, textId, lessonId, hskId) VALUES (?, ?, ?, ?, ?, ?)`,
            item.content.trim(),
            sentPinyin,
            item.meaning.trim(),
            textId,
            selectedLessonId,
            selectedHskId
          );
          createdSentCount++;
        }
      }

      // 3. Associate selected words
      for (const id of selectedWordIds) {
        db.runSync(
          `UPDATE words SET textId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
          textId,
          selectedHskId,
          id
        );
      }

      // 4. Associate selected characters
      for (const id of selectedCharacterIds) {
        db.runSync(
          `UPDATE characters SET textId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
          textId,
          selectedHskId,
          id
        );
      }

      // 5. Associate selected rules
      for (const id of selectedRuleIds) {
        db.runSync(
          `UPDATE rules SET textId = ?, hskId = COALESCE(hskId, ?) WHERE id = ?`,
          textId,
          selectedHskId,
          id
        );
      }

      const details = `Created ${createdSentCount} sentences, linked ${selectedWordIds.size} words, ${selectedCharacterIds.size} characters, ${selectedRuleIds.size} rules`;

      setCreatedBannerInfo({
        visible: true,
        textTitle: textTitle,
        itemCount: totalSelectedCount,
        details,
      });

      // Clear form inputs
      setTitle('');
      setContent('');
      setPinyin('');
      setIsPinyinManual(false);
      setMeaning('');
      setExtractedSentences([]);
      setSelectedSentenceIndices(new Set());
      setSelectedWordIds(new Set());
      setSelectedCharacterIds(new Set());
      setSelectedRuleIds(new Set());
    } catch (e) {
      console.error('Failed to save text:', e);
      Alert.alert('Database Error', 'Could not save the new text passage.');
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label={isEditing ? 'Edit Text' : 'Create Text'}
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
        title="Text Created!"
        lessonTitle={createdBannerInfo.textTitle}
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

          {/* ===== TEXT DETAILS CARD ===== */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Lucide name="file-text" size={20} color="#0284c7" />
              <Text style={styles.cardTitle}>Reading Text Details</Text>
            </View>

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 在咖啡馆 / At the Coffee Shop"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Content Input (Required) */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>
                  Chinese Content <Text style={styles.requiredStar}>*</Text>
                </Text>
                <ScanOCRButton
                  mode="text"
                  onScanResult={handleApplyOcr}
                  themeColor="#0284c7"
                  label="Scan with Camera"
                />
              </View>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter Chinese passage content... (Sentences will be generated in the slider below)"
                placeholderTextColor="#94a3b8"
                value={content}
                onChangeText={handleContentChange}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Pinyin Input with Auto-generation */}
            <PinyinInputField
              value={pinyin}
              onChangeText={handlePinyinChange}
              chineseText={content}
              placeholder="Enter Pinyin transcription..."
              multiline
              numberOfLines={3}
              themeColor="#8b5cf6"
            />

            {/* Meaning Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>Meaning / English Translation</Text>
                <AutoTranslateButton
                  chineseText={content}
                  onTranslated={setMeaning}
                  themeColor="#0284c7"
                />
              </View>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter English translation..."
                placeholderTextColor="#94a3b8"
                value={meaning}
                onChangeText={setMeaning}
                multiline
                numberOfLines={3}
              />
            </View>

            <TextToSentencesConstructions/>

            {/* Pickers Row (HSK & Lesson) */}
            <View style={styles.pickersRow}>
              {/* HSK Picker */}
              <View style={styles.pickerCol}>
                <Text style={styles.inputLabel}>HSK Level (optional)</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setShowHskPicker(!showHskPicker)}
                  activeOpacity={0.7}
                >
                  <Lucide name="layers" size={16} color="#0284c7" />
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
                  <Lucide name="book-open" size={16} color="#0284c7" />
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
            </View>
          </View>

          {/* ===== OPTIONAL LINKING SECTIONS ===== */}
          <CollapsibleLinkingSection
            title="Link to Sentences, Words, etc. (Optional)"
            subtitle="Connect to sentences, vocabulary words, characters, or grammar rules"
            icon="link-2"
            accentColor="#0284c7"
            selectedCount={totalSelectedCount}
            isOpen={showOptionalLinks}
            onToggle={() => setShowOptionalLinks((prev) => !prev)}
            tip="Connecting items is completely optional! You can create this reading text now without selecting any items, or link what's relevant to you."
          >
          {/* ===== SENTENCES SLIDER SECTION (Generated from User's Text) ===== */}
          <SliderSection
            title="Sentences"
            icon="message-square-text"
            color="#8b5cf6"
            totalCount={extractedSentences.length}
            selectedCount={selectedSentenceIndices.size}
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
            onClearAll={() => setSelectedSentenceIndices(new Set())}
            searchQuery={searchSentences}
            onSearchChange={setSearchSentences}
            filterMode={filterSentences}
            onFilterChange={setFilterSentences}
            hasHskSelected={!!selectedHskId}
            hint="✨ Key sentences from this text — tap the ones that stood out or that you want to remember. No need to pick them all!"
          >
            {filteredExtractedSentences.length === 0 ? (
              <Text style={styles.emptyText}>
                {content.trim()
                  ? 'No sentences match the search query.'
                  : 'Type Chinese text content above to generate sentence cards here.'}
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    if (sentencesVisibleCount < filteredExtractedSentences.length) {
                      setSentencesVisibleCount((prev) => prev + SLIDER_PAGE_SIZE);
                    }
                  }
                }}
                scrollEventThrottle={16}
              >
                {displayedExtractedSentences.map((s, index) => (
                  <ItemCard
                    key={s.id}
                    title={s.content}
                    subtitle={s.pinyin || `Sentence #${index + 1}`}
                    detail={s.meaning || undefined}
                    selected={selectedSentenceIndices.has(s.id)}
                    onToggle={() =>
                      setSelectedSentenceIndices((prev) => toggleId(prev, s.id))
                    }
                    color="#8b5cf6"
                    width={220}
                  />
                ))}
                {sentencesVisibleCount < filteredExtractedSentences.length && (
                  <SliderLoadMoreCard
                    currentCount={displayedExtractedSentences.length}
                    totalCount={filteredExtractedSentences.length}
                    pageSize={SLIDER_PAGE_SIZE}
                    color="#8b5cf6"
                    onLoadMore={() => setSentencesVisibleCount((prev) => prev + SLIDER_PAGE_SIZE)}
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
              if (editTextId) queryParts.push(`textId=${editTextId}`);
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
            hint="📖 New words — link only the words you just learned or found important in this text. You don't need to add every single word!"
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
            hint="🔡 New characters — pick only the characters you're actively learning from this text. A few key ones is perfectly fine!"
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
            hint="📐 Grammar rules — link any grammar pattern this text demonstrates. Only add what's relevant to you!"
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
              Create Reading Text
              {totalSelectedCount > 0 ? ` (${totalSelectedCount} items)` : ''}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

    </ThemedView>
  );
};

export default AddText;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 5,
    gap: 5,
  },
  headerSaveButton: {
    backgroundColor: '#0284c7',
    borderRadius: 50,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0369a1',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: '#ffffffe7',
    borderRadius: 10,
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
    borderColor: '#0284c740',
    backgroundColor: '#0284c712',
  },
  scanBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputLabel: {
    fontSize: 12,
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
  pickersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerCol: {
    flex: 1,
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
    elevation: 5,
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
    backgroundColor: '#e0f2fe',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  dropdownOptionTextSelected: {
    color: '#0369a1',
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
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 5,
    shadowColor: '#0284c7',
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

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
  getAllSentences,
  getAllWords,
  getAllRules,
  getCharacterById,
  getHSKsByCharacterId,
  getLessonsByCharacterId,
  getTextsByCharacterId,
  getSentencesByCharacterId,
  getWordsByCharacterId,
  getRulesByCharacterId,
  updateCharacter,
  updateCharacterRelations,
  db,
  linkCharacterRelations,
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
  RuleType,
} from '@/types';
import {
  ItemCard,
  SliderSection,
} from '@/components/add-lesson';
import { SuccessBanner } from '@/components/banners';

import { MultiPicker } from '@/components/common/MultiPicker';

const toneOptions = [
  { id: '1', label: '1st (ˉ)', color: '#b548ece8' },
  { id: '2', label: '2nd (ˊ)', color: '#f59e0b' },
  { id: '3', label: '3rd (ˇ)', color: '#10b981' },
  { id: '4', label: '4th (ˋ)', color: '#3b82f6' },
  { id: '5', label: 'Neutral', color: '#6b7280' },
];

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────
const AddCharacter = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawEditId = params.characterId || params.id;
  const editCharacterId = rawEditId && !isNaN(Number(rawEditId)) ? Number(rawEditId) : null;
  const isEditing = Boolean(editCharacterId);

  const preselectedHskId = params.hskId ? Number(params.hskId) : null;
  const preselectedLessonId = params.lessonId ? Number(params.lessonId) : null;
  const preselectedTextId = params.textId ? Number(params.textId) : null;
  const preselectedSentenceId = params.sentenceId ? Number(params.sentenceId) : null;
  const preselectedWordId = params.wordId ? Number(params.wordId) : null;

  // Character form fields
  const [content, setContent] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [tone, setTone] = useState<string>('1');
  const [meaning, setMeaning] = useState('');

  // DB data
  const [hsks, setHsks] = useState<HSKType[]>([]);
  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [texts, setTexts] = useState<TextType[]>([]);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [words, setWords] = useState<WordType[]>([]);
  const [allRules, setAllRules] = useState<RuleType[]>([]);

  // Multi-select IDs (using Set for O(1) lookup)
  const [selectedHskIds, setSelectedHskIds] = useState<Set<number>>(
    new Set(preselectedHskId ? [preselectedHskId] : [])
  );
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<number>>(
    new Set(preselectedLessonId ? [preselectedLessonId] : [])
  );
  const [selectedTextIds, setSelectedTextIds] = useState<Set<number>>(
    new Set(preselectedTextId ? [preselectedTextId] : [])
  );
  const [selectedSentenceIds, setSelectedSentenceIds] = useState<Set<number>>(
    new Set(preselectedSentenceId ? [preselectedSentenceId] : [])
  );
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(
    new Set(preselectedWordId ? [preselectedWordId] : [])
  );
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<number>>(new Set());

  // Picker open state
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const togglePicker = (name: string) =>
    setOpenPicker((prev) => (prev === name ? null : name));

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rules: true,
  });
  const toggleSection = (section: string) =>
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  // Search / filter for rules
  const [searchRules, setSearchRules] = useState('');
  const [filterRules, setFilterRules] = useState<'all' | 'unassigned' | 'hsk'>('all');

  // Banner
  const [createdBannerInfo, setCreatedBannerInfo] = useState<{
    visible: boolean;
    charContent: string;
    itemCount: number;
    details: string;
  }>({ visible: false, charContent: '', itemCount: 0, details: '' });

  // Load DB items and prefill if editing
  useFocusEffect(
    useCallback(() => {
      try {
        setHsks((getAllHSKs() as unknown as HSKType[]) || []);
        setLessons((getAllLessons() as unknown as LessonType[]) || []);
        setTexts((getAllTexts() as unknown as TextType[]) || []);
        setSentences((getAllSentences() as unknown as SentenceType[]) || []);
        setWords((getAllWords() as unknown as WordType[]) || []);
        setAllRules((getAllRules() as unknown as RuleType[]) || []);

        if (editCharacterId) {
          const charData = getCharacterById(editCharacterId);
          if (charData) {
            setContent(charData.content || '');
            setPinyin(charData.pinyin || '');
            setTone(charData.tone || '1');
            setMeaning(charData.meaning || '');

            const charHsks = (getHSKsByCharacterId(editCharacterId) as unknown as HSKType[]) || [];
            const charLessons = (getLessonsByCharacterId(editCharacterId) as unknown as LessonType[]) || [];
            const charTexts = (getTextsByCharacterId(editCharacterId) as unknown as TextType[]) || [];
            const charSentences = (getSentencesByCharacterId(editCharacterId) as unknown as SentenceType[]) || [];
            const charWords = (getWordsByCharacterId(editCharacterId) as unknown as WordType[]) || [];
            const charRules = (getRulesByCharacterId(editCharacterId) as unknown as RuleType[]) || [];

            const hskSet = new Set(charHsks.map((h) => h.id));
            if (charData.hskId) hskSet.add(charData.hskId);
            setSelectedHskIds(hskSet);

            const lessonSet = new Set(charLessons.map((l) => l.id));
            if (charData.lessonId) lessonSet.add(charData.lessonId);
            setSelectedLessonIds(lessonSet);

            const textSet = new Set(charTexts.map((t) => t.id));
            if (charData.textId) textSet.add(charData.textId);
            setSelectedTextIds(textSet);

            const sentenceSet = new Set(charSentences.map((s) => s.id));
            if (charData.sentenceId) sentenceSet.add(charData.sentenceId);
            setSelectedSentenceIds(sentenceSet);

            const wordSet = new Set(charWords.map((w) => w.id));
            if (charData.wordId) wordSet.add(charData.wordId);
            setSelectedWordIds(wordSet);

            setSelectedRuleIds(new Set(charRules.map((r) => r.id)));
          }
        }
      } catch (e) {
        console.error('Failed to load DB items for addCharacter:', e);
      }
    }, [editCharacterId])
  );

  // Helper: toggle id in a Set
  const toggleId = (set: Set<number>, id: number): Set<number> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  // Filtered rules
  const filteredRules = useMemo(() => {
    return allRules.filter((r) => {
      const q = searchRules.toLowerCase().trim();
      const matchesSearch = !q || r.content.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (filterRules === 'unassigned') return !r.wordId;
      if (filterRules === 'hsk' && selectedHskIds.size > 0)
        return selectedHskIds.has(r.hskId!);
      return true;
    });
  }, [allRules, searchRules, filterRules, selectedHskIds]);

  const handleSelectAllRules = () => {
    setSelectedRuleIds((prev) => {
      const next = new Set(prev);
      filteredRules.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const totalSelectedCount =
    selectedHskIds.size +
    selectedLessonIds.size +
    selectedTextIds.size +
    selectedSentenceIds.size +
    selectedWordIds.size +
    selectedRuleIds.size;

  // ──────────────────────────────────────────
  // Save handler
  // ──────────────────────────────────────────
  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please enter a Chinese character.');
      return;
    }

    try {
      const charText = content.trim();

      // Insert core character record (keep first selected ids as denormalised fallback)
      const firstHskId = selectedHskIds.size > 0 ? [...selectedHskIds][0] : null;
      const firstLessonId = selectedLessonIds.size > 0 ? [...selectedLessonIds][0] : null;
      const firstTextId = selectedTextIds.size > 0 ? [...selectedTextIds][0] : null;
      const firstSentenceId = selectedSentenceIds.size > 0 ? [...selectedSentenceIds][0] : null;
      const firstWordId = selectedWordIds.size > 0 ? [...selectedWordIds][0] : null;

      if (isEditing && editCharacterId) {
        updateCharacter(editCharacterId, {
          content: charText,
          pinyin: pinyin.trim(),
          tone,
          meaning: meaning.trim(),
          hskId: firstHskId ?? undefined,
          lessonId: firstLessonId ?? undefined,
          textId: firstTextId ?? undefined,
          sentenceId: firstSentenceId ?? undefined,
          wordId: firstWordId ?? undefined,
        });

        updateCharacterRelations(editCharacterId, {
          hskIds: [...selectedHskIds],
          lessonIds: [...selectedLessonIds],
          textIds: [...selectedTextIds],
          sentenceIds: [...selectedSentenceIds],
          wordIds: [...selectedWordIds],
        });

        Alert.alert('Success', 'Character updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      const result = db.runSync(
        `INSERT INTO characters (content, pinyin, tone, meaning, hskId, lessonId, textId, sentenceId, wordId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        charText,
        pinyin.trim(),
        tone,
        meaning.trim(),
        firstHskId,
        firstLessonId,
        firstTextId,
        firstSentenceId,
        firstWordId
      );

      const characterId = result.lastInsertRowId;

      // Link all many-to-many relations
      linkCharacterRelations(characterId, {
        hskIds: [...selectedHskIds],
        lessonIds: [...selectedLessonIds],
        textIds: [...selectedTextIds],
        sentenceIds: [...selectedSentenceIds],
        wordIds: [...selectedWordIds],
        ruleIds: [...selectedRuleIds],
      });

      const linkedCount =
        selectedHskIds.size +
        selectedLessonIds.size +
        selectedTextIds.size +
        selectedSentenceIds.size +
        selectedWordIds.size +
        selectedRuleIds.size;

      setCreatedBannerInfo({
        visible: true,
        charContent: charText,
        itemCount: linkedCount,
        details: `Character saved. Linked ${selectedHskIds.size} HSK(s), ${selectedLessonIds.size} lesson(s), ${selectedTextIds.size} text(s), ${selectedSentenceIds.size} sentence(s), ${selectedWordIds.size} word(s), ${selectedRuleIds.size} rule(s).`,
      });

      // Reset form
      setContent('');
      setPinyin('');
      setMeaning('');
      setTone('1');
      setSelectedHskIds(new Set());
      setSelectedLessonIds(new Set());
      setSelectedTextIds(new Set());
      setSelectedSentenceIds(new Set());
      setSelectedWordIds(new Set());
      setSelectedRuleIds(new Set());
    } catch (e) {
      console.error('Failed to save character:', e);
      Alert.alert('Database Error', 'Could not save the character.');
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Bg1 />

      <Header
        useBackArrow={true}
        label={isEditing ? 'Edit Character' : 'Create Character'}
        subtitle={isEditing ? `Editing "${content || ''}"` : undefined}
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
        title="Character Created!"
        lessonTitle={createdBannerInfo.charContent}
        details={createdBannerInfo.details}
        onClose={() =>
          setCreatedBannerInfo((prev) => ({ ...prev, visible: false }))
        }
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

          {/* ───── CHARACTER DETAILS CARD ───── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Lucide name="spell-check" size={20} color="#ec489a" />
              <Text style={styles.cardTitle}>Chinese Character Details</Text>
            </View>

            {/* Content (Required) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Chinese Character <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.charInput]}
                placeholder="e.g. 爱"
                placeholderTextColor="#94a3b8"
                value={content}
                onChangeText={setContent}
                maxLength={4}
              />
            </View>

            {/* Tone Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pinyin Tone</Text>
              <View style={styles.tonePillsRow}>
                {toneOptions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.tonePill,
                      tone === item.id && { backgroundColor: item.color, borderColor: item.color },
                    ]}
                    onPress={() => setTone(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tonePillText,
                        tone === item.id && styles.tonePillTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pinyin Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pinyin (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., ài"
                placeholderTextColor="#94a3b8"
                value={pinyin}
                onChangeText={setPinyin}
              />
            </View>

            {/* Meaning Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Meaning / Definition</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., to love, affection"
                placeholderTextColor="#94a3b8"
                value={meaning}
                onChangeText={setMeaning}
              />
            </View>
          </View>

          {/* ───── ASSOCIATIONS CARD ───── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Lucide name="link" size={20} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Associations</Text>
              <Text style={styles.cardSubtitle}>Select multiple per category</Text>
            </View>

            {/* HSK Multi-Picker */}
            <MultiPicker
              label="HSK Levels"
              icon="layers"
              iconColor="#ec489a"
              items={hsks}
              selectedIds={selectedHskIds}
              onToggle={(id) => setSelectedHskIds((prev) => toggleId(prev, id))}
              getLabel={(h) => h.name}
              placeholder="Select HSK levels…"
              open={openPicker === 'hsk'}
              onToggleOpen={() => togglePicker('hsk')}
            />

            {/* Lesson Multi-Picker */}
            <MultiPicker
              label="Lessons"
              icon="book-open"
              iconColor="#ec489a"
              items={lessons}
              selectedIds={selectedLessonIds}
              onToggle={(id) => setSelectedLessonIds((prev) => toggleId(prev, id))}
              getLabel={(l) => `L${l.num}: ${l.title}`}
              placeholder="Select lessons…"
              open={openPicker === 'lesson'}
              onToggleOpen={() => togglePicker('lesson')}
            />

            {/* Text Multi-Picker */}
            <MultiPicker
              label="Reading Texts"
              icon="file-text"
              iconColor="#ec489a"
              items={texts}
              selectedIds={selectedTextIds}
              onToggle={(id) => setSelectedTextIds((prev) => toggleId(prev, id))}
              getLabel={(t) => t.title || t.content.substring(0, 24)}
              placeholder="Select reading texts…"
              open={openPicker === 'text'}
              onToggleOpen={() => togglePicker('text')}
            />

            {/* Sentence Multi-Picker */}
            <MultiPicker
              label="Sentences"
              icon="message-square-text"
              iconColor="#ec489a"
              items={sentences}
              selectedIds={selectedSentenceIds}
              onToggle={(id) => setSelectedSentenceIds((prev) => toggleId(prev, id))}
              getLabel={(s) => s.content.substring(0, 30)}
              placeholder="Select sentences…"
              open={openPicker === 'sentence'}
              onToggleOpen={() => togglePicker('sentence')}
            />

            {/* Word Multi-Picker */}
            <MultiPicker
              label="Vocabulary Words"
              icon="languages"
              iconColor="#ec489a"
              items={words}
              selectedIds={selectedWordIds}
              onToggle={(id) => setSelectedWordIds((prev) => toggleId(prev, id))}
              getLabel={(w) => `${w.content} — ${w.meaning}`}
              placeholder="Select vocabulary words…"
              open={openPicker === 'word'}
              onToggleOpen={() => togglePicker('word')}
            />
          </View>

          {/* ───── GRAMMAR RULES SECTION ───── */}
          <SliderSection
            title="Grammar Rules"
            icon="book-open-check"
            color="#d97706"
            totalCount={allRules.length}
            selectedCount={selectedRuleIds.size}
            expanded={expandedSections.rules}
            onToggle={() => toggleSection('rules')}
            onAddNew={() => {
              const hskParam = selectedHskIds.size > 0 ? `?hskId=${Array.from(selectedHskIds)[0]}` : '';
              router.push(`/pages/addRule${hskParam}` as any);
            }}
            addNewLabel="+ Rule"
            onSelectAll={handleSelectAllRules}
            onClearAll={() => setSelectedRuleIds(new Set())}
            searchQuery={searchRules}
            onSearchChange={setSearchRules}
            filterMode={filterRules}
            onFilterChange={setFilterRules}
            hasHskSelected={selectedHskIds.size > 0}
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

          {/* ───── SAVE BUTTON ───── */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Lucide name="plus-circle" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              Create Character
              {totalSelectedCount > 0 ? ` (${totalSelectedCount} linked items)` : ''}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default AddCharacter;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 5,
    gap: 5,
  },
  headerSaveButton: {
    backgroundColor: '#ec489a',
    borderRadius: 50,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#db2777',
    shadowColor: '#ec489a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: '#ffffffd8',
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
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
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
    height: 45,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  charInput: {
    height: 55,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  tonePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  tonePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  tonePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tonePillTextActive: {
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 16,
  },
  slider: {
    gap: 10,
    paddingBottom: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    gap: 8,
    backgroundColor: '#ec489a',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#ec489a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});

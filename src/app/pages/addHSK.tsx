import {
    CharacterCard,
    ItemCard,
    SliderSection,
    SliderLoadMoreCard,
} from '@/components/add-lesson';
import { SuccessBanner } from '@/components/banners';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import { ThemedView } from '@/components/themed-view';
import {
    createHSK,
    getLessonsPaged,
    getLessonsCount,
    getTextsPaged,
    getTextsCount,
    getSentencesPaged,
    getSentencesCount,
    getWordsPaged,
    getWordsCount,
    getCharactersPaged,
    getCharactersCountPaged,
    getRulesPaged,
    getRulesCount,
    getCharactersByHSKId,
    getHSKById,
    getLessonsByHSKId,
    getRulesByHSKId,
    getSentencesByHSKId,
    getTextsByHSKId,
    getWordsByHSKId,
    linkHSKRelations,
    updateHSK,
    updateHSKRelations,
} from '@/db/utils';
import { usePagedSection } from '@/hooks/usePagedSection';
import {
    CharacterType,
    LessonType,
    RuleType,
    SentenceType,
    TextType,
    WordType,
} from '@/types';
import Lucide from '@react-native-vector-icons/lucide';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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

const AddHSK = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const rawEditId = params.hskId || params.id;
    const editHskId = rawEditId && !isNaN(Number(rawEditId)) ? Number(rawEditId) : null;
    const isEditing = Boolean(editHskId);

    // HSK Form fields
    const [name, setName] = useState('');

    // Selected multi-entity IDs
    const [selectedLessonIds, setSelectedLessonIds] = useState<Set<number>>(new Set());
    const [selectedTextIds, setSelectedTextIds] = useState<Set<number>>(new Set());
    const [selectedSentenceIds, setSelectedSentenceIds] = useState<Set<number>>(new Set());
    const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(new Set());
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<number>>(new Set());
    const [selectedRuleIds, setSelectedRuleIds] = useState<Set<number>>(new Set());

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

    // ── Paginated sections (DB-level, 10 at a time) ─────────────────────────
    const lessonsPage = usePagedSection<LessonType>(getLessonsPaged, getLessonsCount);
    const textsPage   = usePagedSection<TextType>(getTextsPaged, getTextsCount);
    const sentencesPage = usePagedSection<SentenceType>(getSentencesPaged, getSentencesCount);
    const wordsPage   = usePagedSection<WordType>(getWordsPaged, getWordsCount);
    const charactersPage = usePagedSection<CharacterType>(getCharactersPaged, getCharactersCountPaged);
    const rulesPage   = usePagedSection<RuleType>(getRulesPaged, getRulesCount);

    useFocusEffect(
        useCallback(() => {
            try {
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

            // Initialize paginated sections
            lessonsPage.initialize();
            textsPage.initialize();
            sentencesPage.initialize();
            wordsPage.initialize();
            charactersPage.initialize();
            rulesPage.initialize();
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

            {/* Success Banner — outside ScrollView so it truly overlays the screen */}
            <SuccessBanner
                visible={createdBannerInfo.visible}
                title="HSK Level Created!"
                lessonTitle={createdBannerInfo.hskName}
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
                        totalCount={lessonsPage.total}
                        selectedCount={selectedLessonIds.size}
                        expanded={expandedSections.lessons}
                        onToggle={() => toggleSection('lessons')}
                        onAddNew={() => router.push('/pages/addLesson')}
                        addNewLabel="+ Lesson"
                        onSelectAll={() =>
                            setSelectedLessonIds((prev) => {
                                const next = new Set(prev);
                                lessonsPage.items.forEach((l) => next.add(l.id));
                                return next;
                            })
                        }
                        onClearAll={() => setSelectedLessonIds(new Set())}
                        searchQuery={lessonsPage.search}
                        onSearchChange={lessonsPage.setSearch}
                        filterMode={lessonsPage.filter}
                        onFilterChange={(f) => lessonsPage.setFilter(f as 'all' | 'unassigned')}
                        hasHskSelected={false}
                    >
                        {lessonsPage.items.length === 0 ? (
                            <Text style={styles.emptyText}>No lessons match the filter.</Text>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.slider}
                                onScroll={({ nativeEvent }) => {
                                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                                    if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                                        lessonsPage.loadMore();
                                    }
                                }}
                                scrollEventThrottle={200}
                            >
                                {lessonsPage.items.map((l) => (
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
                                {lessonsPage.hasMore && (
                                    <SliderLoadMoreCard
                                        remaining={lessonsPage.total - lessonsPage.items.length}
                                        onPress={() => lessonsPage.loadMore()}
                                        color="#2563eb"
                                    />
                                )}
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
                        onAddNew={() => router.push('/pages/addText')}
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
                        hasHskSelected={false}
                    >
                        {textsPage.items.length === 0 ? (
                            <Text style={styles.emptyText}>No reading texts match the filter.</Text>
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
                                        remaining={textsPage.total - textsPage.items.length}
                                        onPress={() => textsPage.loadMore()}
                                        color="#0284c7"
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
                        onAddNew={() => router.push('/pages/addSentence')}
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
                        hasHskSelected={false}
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
                                        onToggle={() => setSelectedSentenceIds((prev) => toggleId(prev, s.id))}
                                        color="#8b5cf6"
                                        width={200}
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
                        title="Vocabulary Words"
                        icon="languages"
                        color="#059669"
                        totalCount={wordsPage.total}
                        selectedCount={selectedWordIds.size}
                        expanded={expandedSections.words}
                        onToggle={() => toggleSection('words')}
                        onAddNew={() => router.push('/pages/addWord')}
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
                        hasHskSelected={false}
                    >
                        {wordsPage.items.length === 0 ? (
                            <Text style={styles.emptyText}>No vocabulary words match the filter.</Text>
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
                                        onToggle={() => setSelectedWordIds((prev) => toggleId(prev, w.id))}
                                        color="#059669"
                                        width={150}
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
                        onAddNew={() => router.push('/pages/addCharacter')}
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
                        hasHskSelected={false}
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
                        icon="book-open-check"
                        color="#d97706"
                        totalCount={rulesPage.total}
                        selectedCount={selectedRuleIds.size}
                        expanded={expandedSections.rules}
                        onToggle={() => toggleSection('rules')}
                        onAddNew={() => router.push('/pages/addRule')}
                        addNewLabel="+ Rule"
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
                        hasHskSelected={false}
                    >
                        {rulesPage.items.length === 0 ? (
                            <Text style={styles.emptyText}>No grammar rules match the filter.</Text>
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
                                        remaining={rulesPage.total - rulesPage.items.length}
                                        onPress={() => rulesPage.loadMore()}
                                        color="#d97706"
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
        padding: 5,
        gap: 5,
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
        backgroundColor: '#ffffffe5',
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

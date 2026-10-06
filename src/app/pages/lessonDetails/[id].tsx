import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import Header from '@/components/main/header';
import { Bg1 } from '@/components/sub/bg1';
import Lucide from '@react-native-vector-icons/lucide';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CharacterType,
  HSKType,
  LessonType,
  RuleType,
  SentenceType,
  TextType,
  WordType,
} from '@/types';
import {
  getCharactersByLessonId,
  getHSKById,
  getLessonById,
  getRulesByLessonId,
  getSentencesByLessonId,
  getTextsByLessonId,
  getWordsByLessonId,
} from '@/db/utils';
import { speakChineseText, speakEnglishText } from '@/utils/tts';
import { TextCard } from '@/components/cards/TextCard';
import { SentenceCard } from '@/components/cards/SentenceCard';
import { WordCard } from '@/components/cards/WordCard';
import { CharacterCard } from '@/components/cards/CharacterCard';
import { RuleCard } from '@/components/cards/RuleCard';
import { SearchBar } from '@/components/common/SearchBar';
import { CategoryTabs, CategoryTabType } from '@/components/common/CategoryTabs';
import { LessonHeroCard } from '@/components/details/LessonHeroCard';

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
    } catch (error) {
      console.error('Error loading lesson details:', error);
    }
  }, [lessonId]);

  useEffect(() => {
    loadLessonData();
  }, [loadLessonData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLessonData();
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, [loadLessonData]);

  // Search filtering
  const q = searchQuery.toLowerCase().trim();

  const filteredTexts = texts.filter(
    (t) =>
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q) ||
      t.meaning.toLowerCase().includes(q)
  );

  const filteredSentences = sentences.filter(
    (s) =>
      !q ||
      s.content.toLowerCase().includes(q) ||
      s.pinyin.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q)
  );

  const filteredWords = words.filter(
    (w) =>
      !q ||
      w.content.toLowerCase().includes(q) ||
      w.pinyin.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q)
  );

  const filteredCharacters = characters.filter(
    (c) =>
      !q ||
      c.content.toLowerCase().includes(q) ||
      c.pinyin.toLowerCase().includes(q) ||
      c.meaning.toLowerCase().includes(q)
  );

  const filteredRules = rules.filter(
    (r) => !q || r.content.toLowerCase().includes(q)
  );

  const totalItemCount =
    texts.length + sentences.length + words.length + characters.length + rules.length;

  return (
    <ThemedView style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label={lesson ? `Lesson ${lesson.num}` : 'Lesson Details'}
        items={[
          <TouchableOpacity
            key="pinyin-toggle"
            onPress={() => setShowPinyin((prev) => !prev)}
            activeOpacity={0.7}
            style={[styles.headerIconBtn, showPinyin && styles.headerIconBtnActive]}
          >
            <Lucide
              name="type"
              size={18}
              color={showPinyin ? '#2563eb' : '#64748b'}
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
              color={showMeaning ? '#2563eb' : '#64748b'}
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
        />

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search within this lesson..."
          />
        </View>

        {/* TAB SWITCHER */}
        <CategoryTabs
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={{
            texts: texts.length,
            sentences: sentences.length,
            words: words.length,
            characters: characters.length,
            rules: rules.length,
          }}
        />

        {/* SECTION: TEXTS */}
        {(activeTab === 'all' || activeTab === 'texts') && filteredTexts.length > 0 && (
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
              onPress={() => {router.push(`/pages/addText`)}}
                style={{
                  backgroundColor: "#3b82f6",
                  borderRadius: 50,
                  padding: 4,
                  paddingHorizontal: 5,
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 1
                }}
              >
                <Lucide name="plus" size={12} color="#ffffff" />
                <Text style={{fontSize: 12, color: "#fff"}}>add text</Text>
              </TouchableOpacity>

            </View>

            {filteredTexts.map((text, idx) => (
              <TextCard
                key={text.id || idx}
                textObj={text}
                index={idx}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                isPlaying={playingItemId === `text-${text.id}`}
                onPlayAudio={(id, content) => playItemAudio(id, content, `text-${id}`)}
              />
            ))}
          </View>
        )}

        {/* SECTION: SENTENCES */}
        {(activeTab === 'all' || activeTab === 'sentences') && filteredSentences.length > 0 && (
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

            {filteredSentences.map((sentence, idx) => (
              <SentenceCard
                key={sentence.id || idx}
                sentence={sentence}
                index={idx}
                showPinyin={showPinyin}
                showMeaning={showMeaning}
                isPlaying={playingItemId === `sentence-${sentence.id}`}
                onPlayAudio={(id, content) => playItemAudio(id, content, `sentence-${id}`)}
              />
            ))}
          </View>
        )}

        {/* SECTION: WORDS */}
        {(activeTab === 'all' || activeTab === 'words') && filteredWords.length > 0 && (
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

            <View style={styles.wordsGrid}>
              {filteredWords.map((word, idx) => (
                <View key={word.id || idx} style={{ width: '48%' }}>
                  <WordCard
                    word={word}
                    showPinyin={showPinyin}
                    showMeaning={showMeaning}
                    isPlaying={playingItemId === `word-${word.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `word-${id}`)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SECTION: CHARACTERS */}
        {(activeTab === 'all' || activeTab === 'characters') && filteredCharacters.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#ec489a' }]}>
                <Lucide name="spell-check" size={15} color="#ffffff" />
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

            <View style={styles.charsGrid}>
              {filteredCharacters.map((char, idx) => (
                <View key={char.id || idx} style={{ width: '48%' }}>
                  <CharacterCard
                    char={char}
                    showPinyin={showPinyin}
                    showMeaning={showMeaning}
                    isPlaying={playingItemId === `char-${char.id}`}
                    onPlayAudio={(id, content) => playItemAudio(id, content, `char-${id}`)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SECTION: GRAMMAR RULES */}
        {(activeTab === 'all' || activeTab === 'rules') && filteredRules.length > 0 && (
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

            {filteredRules.map((rule, idx) => (
              <RuleCard
                key={rule.id || idx}
                rule={rule}
                index={idx}
                isPlaying={playingItemId === `rule-${rule.id}`}
                onPlayAudio={(id, content) => playItemAudio(id, content, `rule-${id}`, true)}
              />
            ))}
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
    </ThemedView>
  );
};

export default LessonDetails;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 10,
    gap: 5,
    paddingBottom: 0,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8e8e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#414040ff',
  },
  headerIconBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  searchContainer: {
    marginTop: 10,
    flexDirection: 'row',
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
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  charsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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

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
  getAllHSKsCount,
  getAllLessons,
  getAllLessonsCount,
  getLessonsPaged,
  getAllTexts,
  getAllTextsCount,
  getTextsPaged,
  getAllSentences,
  getAllSentencesCount,
  getSentencesPaged,
  getAllWords,
  getAllWordsCount,
  getWordsPaged,
  getAllCharacters,
  getAllCharactersCount,
  getCharactersPaged,
  getRuleById,
  getHSKsByRuleId,
  getLessonsByRuleId,
  getTextsByRuleId,
  getSentencesByRuleId,
  getWordsByRuleId,
  getCharactersByRuleId,
  linkRuleRelations,
  updateRule,
  updateRuleRelations,
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
  const rawEditId = params.ruleId || (params.id && !params.hskId && !params.lessonId ? params.id : undefined);
  const editRuleId = rawEditId && !isNaN(Number(rawEditId)) ? Number(rawEditId) : null;
  const isEditing = Boolean(editRuleId);

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

  // All entities from DB with 10 by 10 pagination states
  const [hsks, setHsks] = useState<HSKType[]>([]);
  const [hskOffset, setHskOffset] = useState(10);
  const [totalHskCount, setTotalHskCount] = useState(0);
  const [loadingMoreHsks, setLoadingMoreHsks] = useState(false);
  const [hasMoreHsks, setHasMoreHsks] = useState(true);

  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [lessonOffset, setLessonOffset] = useState(10);
  const [totalLessonCount, setTotalLessonCount] = useState(0);
  const [loadingMoreLessons, setLoadingMoreLessons] = useState(false);
  const [hasMoreLessons, setHasMoreLessons] = useState(true);

  const [texts, setTexts] = useState<TextType[]>([]);
  const [textOffset, setTextOffset] = useState(10);
  const [totalTextCount, setTotalTextCount] = useState(0);
  const [loadingMoreTexts, setLoadingMoreTexts] = useState(false);
  const [hasMoreTexts, setHasMoreTexts] = useState(true);

  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [sentenceOffset, setSentenceOffset] = useState(10);
  const [totalSentenceCount, setTotalSentenceCount] = useState(0);
  const [loadingMoreSentences, setLoadingMoreSentences] = useState(false);
  const [hasMoreSentences, setHasMoreSentences] = useState(true);

  const [words, setWords] = useState<WordType[]>([]);
  const [wordOffset, setWordOffset] = useState(10);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [loadingMoreWords, setLoadingMoreWords] = useState(false);
  const [hasMoreWords, setHasMoreWords] = useState(true);

  const [characters, setCharacters] = useState<CharacterType[]>([]);
  const [charOffset, setCharOffset] = useState(10);
  const [totalCharCount, setTotalCharCount] = useState(0);
  const [loadingMoreChars, setLoadingMoreChars] = useState(false);
  const [hasMoreChars, setHasMoreChars] = useState(true);

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
    hsks: true,
    lessons: true,
    texts: false,
    sentences: false,
    words: false,
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

  // Load DB items on focus (10 by 10 for each section)
  useFocusEffect(
    useCallback(() => {
      try {
        // HSKs 10 by 10
        const initialHsks = (getAllHSKs(10, 0) as unknown as HSKType[]) || [];
        const hskCount = getAllHSKsCount();
        setTotalHskCount(hskCount);
        setHskOffset(10);
        setHasMoreHsks(initialHsks.length < hskCount);

        // Lessons 10 by 10
        const initialLessons = (getAllLessons(10, 0) as unknown as LessonType[]) || [];
        const lessonCount = getAllLessonsCount();
        setTotalLessonCount(lessonCount);
        setLessonOffset(10);
        setHasMoreLessons(initialLessons.length < lessonCount);

        // Texts 10 by 10
        const initialTexts = (getAllTexts(10, 0) as unknown as TextType[]) || [];
        const textCount = getAllTextsCount();
        setTotalTextCount(textCount);
        setTextOffset(10);
        setHasMoreTexts(initialTexts.length < textCount);

        // Sentences 10 by 10
        const initialSentences = (getAllSentences(10, 0) as unknown as SentenceType[]) || [];
        const sentenceCount = getAllSentencesCount();
        setTotalSentenceCount(sentenceCount);
        setSentenceOffset(10);
        setHasMoreSentences(initialSentences.length < sentenceCount);

        // Words 10 by 10
        const initialWords = (getAllWords(10, 0) as unknown as WordType[]) || [];
        const wordCount = getAllWordsCount();
        setTotalWordCount(wordCount);
        setWordOffset(10);
        setHasMoreWords(initialWords.length < wordCount);

        // Characters 10 by 10
        const initialChars = (getAllCharacters(10, 0) as unknown as CharacterType[]) || [];
        const charCount = getAllCharactersCount();
        setTotalCharCount(charCount);
        setCharOffset(10);
        setHasMoreChars(initialChars.length < charCount);

        // If editing, pre-fill form with existing rule data
        if (editRuleId) {
          const existingRule = getRuleById(editRuleId);
          if (existingRule) {
            setContent(existingRule.content || '');
          }
          const existingHsks = (getHSKsByRuleId(editRuleId) as any[]) || [];
          const existingLessons = (getLessonsByRuleId(editRuleId) as any[]) || [];
          const existingTexts = (getTextsByRuleId(editRuleId) as any[]) || [];
          const existingSentences = (getSentencesByRuleId(editRuleId) as any[]) || [];
          const existingWords = (getWordsByRuleId(editRuleId) as any[]) || [];
          const existingChars = (getCharactersByRuleId(editRuleId) as any[]) || [];
          setSelectedHskIds(new Set(existingHsks.map((h: any) => h.id)));
          setSelectedLessonIds(new Set(existingLessons.map((l: any) => l.id)));
          setSelectedTextIds(new Set(existingTexts.map((t: any) => t.id)));
          setSelectedSentenceIds(new Set(existingSentences.map((s: any) => s.id)));
          setSelectedWordIds(new Set(existingWords.map((w: any) => w.id)));
          setSelectedCharacterIds(new Set(existingChars.map((c: any) => c.id)));

          // Merge existing linked items into arrays so they don't disappear
          const hskIds = new Set(initialHsks.map((h) => h.id));
          setHsks([...initialHsks, ...existingHsks.filter((h: any) => !hskIds.has(h.id))]);

          const lessonIds = new Set(initialLessons.map((l) => l.id));
          setLessons([...initialLessons, ...existingLessons.filter((l: any) => !lessonIds.has(l.id))]);

          const textIds = new Set(initialTexts.map((t) => t.id));
          setTexts([...initialTexts, ...existingTexts.filter((t: any) => !textIds.has(t.id))]);

          const sentenceIds = new Set(initialSentences.map((s) => s.id));
          setSentences([...initialSentences, ...existingSentences.filter((s: any) => !sentenceIds.has(s.id))]);

          const wordIds = new Set(initialWords.map((w) => w.id));
          setWords([...initialWords, ...existingWords.filter((w: any) => !wordIds.has(w.id))]);

          const charIds = new Set(initialChars.map((c) => c.id));
          setCharacters([...initialChars, ...existingChars.filter((c: any) => !charIds.has(c.id))]);
        } else {
          setHsks(initialHsks);
          setLessons(initialLessons);
          setTexts(initialTexts);
          setSentences(initialSentences);
          setWords(initialWords);
          setCharacters(initialChars);
        }
      } catch (e) {
        console.error('Failed to load DB items for addRule:', e);
      }
    }, [editRuleId])
  );

  // Pagination Load More handlers for each section
  const loadMoreHsks = () => {
    if (loadingMoreHsks || !hasMoreHsks) return;
    setLoadingMoreHsks(true);
    try {
      const nextBatch = (getAllHSKs(10, hskOffset) as unknown as HSKType[]) || [];
      if (nextBatch.length === 0) {
        setHasMoreHsks(false);
      } else {
        setHsks((prev) => {
          const existingIds = new Set(prev.map((h) => h.id));
          const newItems = nextBatch.filter((h) => !existingIds.has(h.id));
          return [...prev, ...newItems];
        });
        setHskOffset((prev) => prev + nextBatch.length);
        if (nextBatch.length < 10 || hskOffset + nextBatch.length >= totalHskCount) {
          setHasMoreHsks(false);
        }
      }
    } catch (e) {
      console.error('Failed to load more HSKs:', e);
    } finally {
      setLoadingMoreHsks(false);
    }
  };

  const loadMoreLessons = () => {
    if (loadingMoreLessons || !hasMoreLessons) return;
    setLoadingMoreLessons(true);
    try {
      const nextBatch = (getAllLessons(10, lessonOffset) as unknown as LessonType[]) || [];
      if (nextBatch.length === 0) {
        setHasMoreLessons(false);
      } else {
        setLessons((prev) => {
          const existingIds = new Set(prev.map((l) => l.id));
          const newItems = nextBatch.filter((l) => !existingIds.has(l.id));
          return [...prev, ...newItems];
        });
        setLessonOffset((prev) => prev + nextBatch.length);
        if (nextBatch.length < 10 || lessonOffset + nextBatch.length >= totalLessonCount) {
          setHasMoreLessons(false);
        }
      }
    } catch (e) {
      console.error('Failed to load more lessons:', e);
    } finally {
      setLoadingMoreLessons(false);
    }
  };

  const loadMoreTexts = () => {
    if (loadingMoreTexts || !hasMoreTexts) return;
    setLoadingMoreTexts(true);
    try {
      const nextBatch = (getAllTexts(10, textOffset) as unknown as TextType[]) || [];
      if (nextBatch.length === 0) {
        setHasMoreTexts(false);
      } else {
        setTexts((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newItems = nextBatch.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newItems];
        });
        setTextOffset((prev) => prev + nextBatch.length);
        if (nextBatch.length < 10 || textOffset + nextBatch.length >= totalTextCount) {
          setHasMoreTexts(false);
        }
      }
    } catch (e) {
      console.error('Failed to load more texts:', e);
    } finally {
      setLoadingMoreTexts(false);
    }
  };

  const loadMoreSentences = () => {
    if (loadingMoreSentences || !hasMoreSentences) return;
    setLoadingMoreSentences(true);
    try {
      const nextBatch = (getAllSentences(10, sentenceOffset) as unknown as SentenceType[]) || [];
      if (nextBatch.length === 0) {
        setHasMoreSentences(false);
      } else {
        setSentences((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newItems = nextBatch.filter((s) => !existingIds.has(s.id));
          return [...prev, ...newItems];
        });
        setSentenceOffset((prev) => prev + nextBatch.length);
        if (nextBatch.length < 10 || sentenceOffset + nextBatch.length >= totalSentenceCount) {
          setHasMoreSentences(false);
        }
      }
    } catch (e) {
      console.error('Failed to load more sentences:', e);
    } finally {
      setLoadingMoreSentences(false);
    }
  };

  const loadMoreWords = () => {
    if (loadingMoreWords || !hasMoreWords) return;
    setLoadingMoreWords(true);
    try {
      const nextBatch = (getAllWords(10, wordOffset) as unknown as WordType[]) || [];
      if (nextBatch.length === 0) {
        setHasMoreWords(false);
      } else {
        setWords((prev) => {
          const existingIds = new Set(prev.map((w) => w.id));
          const newItems = nextBatch.filter((w) => !existingIds.has(w.id));
          return [...prev, ...newItems];
        });
        setWordOffset((prev) => prev + nextBatch.length);
        if (nextBatch.length < 10 || wordOffset + nextBatch.length >= totalWordCount) {
          setHasMoreWords(false);
        }
      }
    } catch (e) {
      console.error('Failed to load more words:', e);
    } finally {
      setLoadingMoreWords(false);
    }
  };

  const loadMoreCharacters = () => {
    if (loadingMoreChars || !hasMoreChars) return;
    setLoadingMoreChars(true);
    try {
      const nextBatch = (getAllCharacters(10, charOffset) as unknown as CharacterType[]) || [];
      if (nextBatch.length === 0) {
        setHasMoreChars(false);
      } else {
        setCharacters((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newItems = nextBatch.filter((c) => !existingIds.has(c.id));
          return [...prev, ...newItems];
        });
        setCharOffset((prev) => prev + nextBatch.length);
        if (nextBatch.length < 10 || charOffset + nextBatch.length >= totalCharCount) {
          setHasMoreChars(false);
        }
      }
    } catch (e) {
      console.error('Failed to load more characters:', e);
    } finally {
      setLoadingMoreChars(false);
    }
  };

  // Search input change handlers with 10-item DB lookup
  const handleSearchLessonsChange = (text: string) => {
    setSearchLessons(text);
    if (!text.trim()) {
      const initial = (getAllLessons(10, 0) as unknown as LessonType[]) || [];
      setLessonOffset(10);
      setHasMoreLessons(initial.length < totalLessonCount);
      setLessons((prev) => {
        const initIds = new Set(initial.map((l) => l.id));
        const selectedKept = prev.filter((l) => selectedLessonIds.has(l.id) && !initIds.has(l.id));
        return [...initial, ...selectedKept];
      });
    } else {
      try {
        const results = (getLessonsPaged(text.trim(), 'all', 10, 0) as unknown as LessonType[]) || [];
        setLessons((prev) => {
          const resIds = new Set(results.map((l) => l.id));
          const selectedKept = prev.filter((l) => selectedLessonIds.has(l.id) && !resIds.has(l.id));
          return [...results, ...selectedKept];
        });
      } catch (e) {
        console.error('Failed to search lessons:', e);
      }
    }
  };

  const handleSearchTextsChange = (text: string) => {
    setSearchTexts(text);
    if (!text.trim()) {
      const initial = (getAllTexts(10, 0) as unknown as TextType[]) || [];
      setTextOffset(10);
      setHasMoreTexts(initial.length < totalTextCount);
      setTexts((prev) => {
        const initIds = new Set(initial.map((t) => t.id));
        const selectedKept = prev.filter((t) => selectedTextIds.has(t.id) && !initIds.has(t.id));
        return [...initial, ...selectedKept];
      });
    } else {
      try {
        const results = (getTextsPaged(text.trim(), 'all', 10, 0) as unknown as TextType[]) || [];
        setTexts((prev) => {
          const resIds = new Set(results.map((t) => t.id));
          const selectedKept = prev.filter((t) => selectedTextIds.has(t.id) && !resIds.has(t.id));
          return [...results, ...selectedKept];
        });
      } catch (e) {
        console.error('Failed to search texts:', e);
      }
    }
  };

  const handleSearchSentencesChange = (text: string) => {
    setSearchSentences(text);
    if (!text.trim()) {
      const initial = (getAllSentences(10, 0) as unknown as SentenceType[]) || [];
      setSentenceOffset(10);
      setHasMoreSentences(initial.length < totalSentenceCount);
      setSentences((prev) => {
        const initIds = new Set(initial.map((s) => s.id));
        const selectedKept = prev.filter((s) => selectedSentenceIds.has(s.id) && !initIds.has(s.id));
        return [...initial, ...selectedKept];
      });
    } else {
      try {
        const results = (getSentencesPaged(text.trim(), 'all', 10, 0) as unknown as SentenceType[]) || [];
        setSentences((prev) => {
          const resIds = new Set(results.map((s) => s.id));
          const selectedKept = prev.filter((s) => selectedSentenceIds.has(s.id) && !resIds.has(s.id));
          return [...results, ...selectedKept];
        });
      } catch (e) {
        console.error('Failed to search sentences:', e);
      }
    }
  };

  const handleSearchWordsChange = (text: string) => {
    setSearchWords(text);
    if (!text.trim()) {
      const initial = (getAllWords(10, 0) as unknown as WordType[]) || [];
      setWordOffset(10);
      setHasMoreWords(initial.length < totalWordCount);
      setWords((prev) => {
        const initIds = new Set(initial.map((w) => w.id));
        const selectedKept = prev.filter((w) => selectedWordIds.has(w.id) && !initIds.has(w.id));
        return [...initial, ...selectedKept];
      });
    } else {
      try {
        const results = (getWordsPaged(text.trim(), 'all', 10, 0) as unknown as WordType[]) || [];
        setWords((prev) => {
          const resIds = new Set(results.map((w) => w.id));
          const selectedKept = prev.filter((w) => selectedWordIds.has(w.id) && !resIds.has(w.id));
          return [...results, ...selectedKept];
        });
      } catch (e) {
        console.error('Failed to search words:', e);
      }
    }
  };

  const handleSearchCharactersChange = (text: string) => {
    setSearchCharacters(text);
    if (!text.trim()) {
      const initialChars = (getAllCharacters(10, 0) as unknown as CharacterType[]) || [];
      setCharOffset(10);
      setHasMoreChars(initialChars.length < totalCharCount);
      setCharacters((prev) => {
        const initialIds = new Set(initialChars.map((c) => c.id));
        const selectedKept = prev.filter((c) => selectedCharacterIds.has(c.id) && !initialIds.has(c.id));
        return [...initialChars, ...selectedKept];
      });
    } else {
      try {
        const results = (getCharactersPaged(text.trim(), 'all', 10, 0) as unknown as CharacterType[]) || [];
        setCharacters((prev) => {
          const resultIds = new Set(results.map((c) => c.id));
          const selectedKept = prev.filter((c) => selectedCharacterIds.has(c.id) && !resultIds.has(c.id));
          return [...results, ...selectedKept];
        });
      } catch (e) {
        console.error('Failed to search characters:', e);
      }
    }
  };

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

      if (isEditing && editRuleId) {
        // UPDATE existing rule
        updateRule(editRuleId, ruleText);
        updateRuleRelations(editRuleId, {
          hskIds: Array.from(selectedHskIds),
          lessonIds: Array.from(selectedLessonIds),
          textIds: Array.from(selectedTextIds),
          sentenceIds: Array.from(selectedSentenceIds),
          wordIds: Array.from(selectedWordIds),
          characterIds: Array.from(selectedCharacterIds),
        });
        Alert.alert('Success', 'Grammar rule updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

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
      Alert.alert('Database Error', 'Could not save the grammar rule.');
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Bg1 />

      {/* Header */}
      <Header
        useBackArrow={true}
        label={isEditing ? 'Edit Rule' : 'Create Rule'}
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
        title="Grammar Rule Created!"
        lessonTitle={createdBannerInfo.ruleContent}
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
            totalCount={totalHskCount || hsks.length}
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
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    loadMoreHsks();
                  }
                }}
                scrollEventThrottle={150}
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
                {hasMoreHsks && (
                  <TouchableOpacity
                    style={[
                      styles.loadMoreCard,
                      { width: 140, minHeight: 90, borderColor: '#6366f1', backgroundColor: '#eef2ff' },
                    ]}
                    onPress={loadMoreHsks}
                    activeOpacity={0.7}
                  >
                    <Lucide
                      name={loadingMoreHsks ? 'loader' : 'plus'}
                      size={20}
                      color="#6366f1"
                    />
                    <Text style={[styles.loadMoreCardText, { color: '#6366f1' }]}>
                      {loadingMoreHsks ? 'Loading…' : '+10 More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== LESSONS SECTION ===== */}
          <SliderSection
            title="Lessons"
            icon="book-open"
            color="#2563eb"
            totalCount={totalLessonCount || lessons.length}
            selectedCount={selectedLessonIds.size}
            expanded={expandedSections.lessons}
            onToggle={() => toggleSection('lessons')}
            onSelectAll={handleSelectAllLessons}
            onClearAll={() => setSelectedLessonIds(new Set())}
            searchQuery={searchLessons}
            onSearchChange={handleSearchLessonsChange}
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
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    loadMoreLessons();
                  }
                }}
                scrollEventThrottle={150}
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
                {hasMoreLessons && (
                  <TouchableOpacity
                    style={[
                      styles.loadMoreCard,
                      { width: 160, minHeight: 90, borderColor: '#2563eb', backgroundColor: '#eff6ff' },
                    ]}
                    onPress={loadMoreLessons}
                    activeOpacity={0.7}
                  >
                    <Lucide
                      name={loadingMoreLessons ? 'loader' : 'plus'}
                      size={20}
                      color="#2563eb"
                    />
                    <Text style={[styles.loadMoreCardText, { color: '#2563eb' }]}>
                      {loadingMoreLessons ? 'Loading…' : '+10 More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== READING TEXTS SECTION ===== */}
          <SliderSection
            title="Reading Texts"
            icon="file-text"
            color="#0284c7"
            totalCount={totalTextCount || texts.length}
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
            onSearchChange={handleSearchTextsChange}
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
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    loadMoreTexts();
                  }
                }}
                scrollEventThrottle={150}
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
                {hasMoreTexts && (
                  <TouchableOpacity
                    style={[
                      styles.loadMoreCard,
                      { width: 200, minHeight: 100, borderColor: '#0284c7', backgroundColor: '#f0f9ff' },
                    ]}
                    onPress={loadMoreTexts}
                    activeOpacity={0.7}
                  >
                    <Lucide
                      name={loadingMoreTexts ? 'loader' : 'plus'}
                      size={20}
                      color="#0284c7"
                    />
                    <Text style={[styles.loadMoreCardText, { color: '#0284c7' }]}>
                      {loadingMoreTexts ? 'Loading…' : '+10 More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== SENTENCES SECTION ===== */}
          <SliderSection
            title="Sentences"
            icon="message-square-text"
            color="#8b5cf6"
            totalCount={totalSentenceCount || sentences.length}
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
            onSearchChange={handleSearchSentencesChange}
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
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    loadMoreSentences();
                  }
                }}
                scrollEventThrottle={150}
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
                {hasMoreSentences && (
                  <TouchableOpacity
                    style={[
                      styles.loadMoreCard,
                      { width: 200, minHeight: 100, borderColor: '#8b5cf6', backgroundColor: '#f5f3ff' },
                    ]}
                    onPress={loadMoreSentences}
                    activeOpacity={0.7}
                  >
                    <Lucide
                      name={loadingMoreSentences ? 'loader' : 'plus'}
                      size={20}
                      color="#8b5cf6"
                    />
                    <Text style={[styles.loadMoreCardText, { color: '#8b5cf6' }]}>
                      {loadingMoreSentences ? 'Loading…' : '+10 More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== WORDS SECTION ===== */}
          <SliderSection
            title="Words"
            icon="languages"
            color="#059669"
            totalCount={totalWordCount || words.length}
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
            onSearchChange={handleSearchWordsChange}
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
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    loadMoreWords();
                  }
                }}
                scrollEventThrottle={150}
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
                {hasMoreWords && (
                  <TouchableOpacity
                    style={[
                      styles.loadMoreCard,
                      { width: 150, minHeight: 90, borderColor: '#059669', backgroundColor: '#ecfdf5' },
                    ]}
                    onPress={loadMoreWords}
                    activeOpacity={0.7}
                  >
                    <Lucide
                      name={loadingMoreWords ? 'loader' : 'plus'}
                      size={20}
                      color="#059669"
                    />
                    <Text style={[styles.loadMoreCardText, { color: '#059669' }]}>
                      {loadingMoreWords ? 'Loading…' : '+10 More'}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </SliderSection>

          {/* ===== CHARACTERS SECTION ===== */}
          <SliderSection
            title="Characters"
            icon="spell-check"
            color="#ec489a"
            totalCount={totalCharCount || characters.length}
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
            onSearchChange={handleSearchCharactersChange}
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
                onScroll={(e) => {
                  const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
                  if (layoutMeasurement.width + contentOffset.x >= contentSize.width - 60) {
                    loadMoreCharacters();
                  }
                }}
                scrollEventThrottle={150}
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
                {hasMoreChars && (
                  <TouchableOpacity
                    style={styles.loadMoreCard}
                    onPress={loadMoreCharacters}
                    activeOpacity={0.7}
                  >
                    <Lucide
                      name={loadingMoreChars ? 'loader' : 'plus'}
                      size={20}
                      color="#ec489a"
                    />
                    <Text style={styles.loadMoreCardText}>
                      {loadingMoreChars ? 'Loading…' : '+10 More'}
                    </Text>
                  </TouchableOpacity>
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
    padding: 5,
    gap: 5,
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
    backgroundColor: '#ffffffe7',
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
    marginTop: 5,
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
  loadMoreCard: {
    width: 95,
    height: 115,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#ec489a',
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginRight: 4,
  },
  loadMoreCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ec489a',
  },
});

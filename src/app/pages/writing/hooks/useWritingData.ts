import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllCharacters,
  getAllCharactersCount,
  getAllHSKs,
  getAllLessons,
  getCharactersByHSKId,
  getCharactersByLessonId,
  getCharactersCountByHSKId,
  getCharactersCountByLessonId,
  getLessonsByHSKId,
} from '@/db/utils';
import { CharacterType, HSKType, LessonType } from '@/types';
import { PAGE_SIZE } from '../constants';
import { FilterScope } from '../types';

export function useWritingData() {
  const [filterScope, setFilterScope] = useState<FilterScope>('hsk');
  const [selectedHskId, setSelectedHskId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  const [allHsks, setAllHsks] = useState<HSKType[]>([]);
  const [allLessons, setAllLessons] = useState<LessonType[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<LessonType[]>([]);

  // Precomputed character counts
  const [totalCharactersCount, setTotalCharactersCount] = useState<number>(0);
  const [hskCounts, setHskCounts] = useState<Record<number, number>>({});
  const [lessonCounts, setLessonCounts] = useState<Record<number, number>>({});

  // Global lookup for ruby pinyin / search / candidates / dictation
  const [lookupChars, setLookupChars] = useState<CharacterType[]>([]);

  // Keyboard characters (10 at a time)
  const [keyboardChars, setKeyboardChars] = useState<CharacterType[]>([]);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [keyboardTotal, setKeyboardTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search input query
  const [searchQuery, setSearchQuery] = useState('');

  // ÔöÇÔöÇ Fetch paginated characters ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const fetchKeyboardPage = useCallback(
    (offset: number, hskId: number | null, lessonId: number | null, reset: boolean) => {
      if (isLoadingMore && !reset) return;
      setIsLoadingMore(true);
      try {
        let rows: CharacterType[];
        let total: number;

        if (hskId !== null) {
          rows = (getCharactersByHSKId(hskId, PAGE_SIZE, offset) as CharacterType[]) || [];
          total = getCharactersCountByHSKId(hskId);
        } else if (lessonId !== null) {
          rows = (getCharactersByLessonId(lessonId, PAGE_SIZE, offset) as CharacterType[]) || [];
          total = getCharactersCountByLessonId(lessonId);
        } else {
          rows = (getAllCharacters(PAGE_SIZE, offset) as CharacterType[]) || [];
          total = getAllCharactersCount();
        }

        setKeyboardTotal(total);
        if (reset) {
          setKeyboardChars(rows);
          setKeyboardOffset(rows.length);
        } else {
          setKeyboardChars((prev) => [...prev, ...rows]);
          setKeyboardOffset((prev) => prev + rows.length);
        }
      } catch (e) {
        console.error('fetchKeyboardPage error:', e);
      } finally {
        setIsLoadingMore(false);
      }
    },
    [isLoadingMore]
  );

  const loadMoreChars = useCallback(() => {
    if (keyboardOffset >= keyboardTotal || isLoadingMore) return;
    fetchKeyboardPage(keyboardOffset, selectedHskId, selectedLessonId, false);
  }, [keyboardOffset, keyboardTotal, isLoadingMore, selectedHskId, selectedLessonId, fetchKeyboardPage]);

  // ÔöÇÔöÇ Initial load ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const reloadMetadata = useCallback(() => {
    try {
      const hsks = (getAllHSKs() as HSKType[]) || [];
      const lessons = (getAllLessons() as LessonType[]) || [];
      setAllHsks(hsks);
      setAllLessons(lessons);
      setFilteredLessons(lessons);

      const all = (getAllCharacters() as CharacterType[]) || [];
      setLookupChars(all);

      // Precompute counts so the user immediately knows how many characters exist
      const totalAll = getAllCharactersCount();
      setTotalCharactersCount(totalAll);

      const countsH: Record<number, number> = {};
      hsks.forEach((h) => {
        countsH[h.id] = getCharactersCountByHSKId(h.id);
      });
      setHskCounts(countsH);

      const countsL: Record<number, number> = {};
      lessons.forEach((l) => {
        countsL[l.id] = getCharactersCountByLessonId(l.id);
      });
      setLessonCounts(countsL);
    } catch (e) {
      console.error('reloadMetadata error:', e);
    }
    fetchKeyboardPage(0, null, null, true);
  }, [fetchKeyboardPage]);

  useEffect(() => {
    reloadMetadata();
  }, [reloadMetadata]);

  // ÔöÇÔöÇ Filter changes ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  useEffect(() => {
    if (filterScope !== 'hsk') return;
    setSelectedLessonId(null);
    if (selectedHskId !== null) {
      const sub = (getLessonsByHSKId(selectedHskId) as LessonType[]) || [];
      setFilteredLessons(sub);
    } else {
      setFilteredLessons(allLessons);
    }
    fetchKeyboardPage(0, selectedHskId, null, true);
  }, [selectedHskId, filterScope, allLessons, fetchKeyboardPage]);

  useEffect(() => {
    if (filterScope !== 'lesson') return;
    fetchKeyboardPage(0, null, selectedLessonId, true);
  }, [selectedLessonId, filterScope, fetchKeyboardPage]);

  const handleScopeChange = (scope: FilterScope) => {
    setFilterScope(scope);
    if (scope === 'hsk') {
      setSelectedLessonId(null);
      fetchKeyboardPage(0, selectedHskId, null, true);
    } else {
      setSelectedHskId(null);
      fetchKeyboardPage(0, null, selectedLessonId, true);
    }
  };

  // ÔöÇÔöÇ Lookup map ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const charLookupMap = useMemo(() => {
    const map = new Map<string, CharacterType>();
    lookupChars.forEach((c) => {
      if (c.content && !map.has(c.content)) {
        map.set(c.content, c);
      }
    });
    return map;
  }, [lookupChars]);

  // ÔöÇÔöÇ Search & Filtered characters ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return null;
    return lookupChars
      .filter((c) => {
        const pn = (c.pinyin || '').toLowerCase().replace(/[^a-z]/g, '');
        const pr = (c.pinyin || '').toLowerCase();
        const mn = (c.meaning || '').toLowerCase();
        return pn.startsWith(q) || pr.includes(q) || c.content.includes(q) || mn.includes(q);
      })
      .slice(0, 30);
  }, [lookupChars, searchQuery]);

  const displayedChars = searchResults ?? keyboardChars;
  const hasMore = !searchResults && keyboardOffset < keyboardTotal;

  return {
    filterScope,
    setFilterScope: handleScopeChange,
    selectedHskId,
    setSelectedHskId,
    selectedLessonId,
    setSelectedLessonId,
    allHsks,
    allLessons,
    filteredLessons,
    totalCharactersCount,
    hskCounts,
    lessonCounts,
    lookupChars,
    charLookupMap,
    keyboardChars,
    displayedChars,
    keyboardOffset,
    keyboardTotal,
    isLoadingMore,
    hasMore,
    loadMoreChars,
    searchQuery,
    setSearchQuery,
    reloadMetadata,
  };
}

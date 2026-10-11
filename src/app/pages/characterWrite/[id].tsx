import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  LayoutChangeEvent,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';

// ─── Live stroke overlay rendered independently to avoid full re-renders ─────
interface LiveStrokeLayerProps {
  size: number;
  pathRef: React.MutableRefObject<string>;
  color: string;
  width: number;
  tickRef: React.MutableRefObject<number>;
}
const LiveStrokeLayer = React.memo(
  ({ size, pathRef, color, width, tickRef }: LiveStrokeLayerProps) => {
    const [, forceUpdate] = useState(0);
    // Store forceUpdate so the parent can trigger re-renders of only this layer
    tickRef.current = forceUpdate as unknown as number;
    return (
      <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
        {pathRef.current ? (
          <Path
            d={pathRef.current}
            fill="none"
            stroke={color}
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
    );
  },
  // Only re-render when color / width / size props change; internal ticking is handled by forceUpdate
  (prev, next) =>
    prev.color === next.color && prev.width === next.width && prev.size === next.size
);
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Lucide from '@react-native-vector-icons/lucide';
import { ThemedView } from '@/components/themed-view';
import { Bg1 } from '@/components/sub/bg1';
import Header from '@/components/main/header';
import {
  getAllCharacters,
  getAllCharactersCount,
  getAllHSKs,
  getCharacterById,
  getCharactersByHSKId,
  getCharactersByLessonId,
  getCharactersCountByHSKId,
  getCharactersCountByLessonId,
  getHSKById,
  getLessonById,
} from '@/db/utils';
import { CharacterType, HSKType, LessonType } from '@/types';
import { speakChineseText } from '@/utils/tts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(Math.floor(SCREEN_WIDTH - 32), 340);
const PAGE_SIZE = 10;

const toneColors: Record<string, string> = {
  '1': '#ef4444',
  '2': '#f59e0b',
  '3': '#10b981',
  '4': '#3b82f6',
  '5': '#6b7280',
};

const toneLabels: Record<string, string> = {
  '1': '1st Tone (Flat / ˉ)',
  '2': '2nd Tone (Rising / ˊ)',
  '3': '3rd Tone (Falling-Rising / ˇ)',
  '4': '4th Tone (Falling / ˋ)',
  '5': 'Neutral Tone',
};

// 7 Fundamental stroke order principles of Chinese writing
const STROKE_RULES = [
  { rule: '从上到下', en: 'Top to bottom', example: '三, 言, 早' },
  { rule: '从左到右', en: 'Left to right', example: '川, 你, 他' },
  { rule: '先横后竖', en: 'Horizontal before vertical', example: '十, 木, 土' },
  { rule: '先撇后捺', en: 'Left slash before right slash', example: '人, 八, 入' },
  { rule: '从外到内', en: 'Outside before inside', example: '月, 同, 问' },
  { rule: '先进后关', en: 'Inside before closing', example: '日, 国, 四' },
  { rule: '先中间后两边', en: 'Center before sides', example: '小, 水, 永' },
];

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

const BRUSH_SIZES = [
  { label: 'Fine', width: 5 },
  { label: 'Medium', width: 10 },
  { label: 'Thick', width: 16 },
];

const OPACITY_LEVELS = [
  { label: 'Off', value: 0 },
  { label: 'Light', value: 0.15 },
  { label: 'Guide', value: 0.35 },
  { label: 'Bold', value: 0.65 },
];

export default function CharacterWriteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    characterId?: string;
    hskId?: string;
    lessonId?: string;
  }>();

  const rawId = params.characterId || params.id;
  const currentId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : 1;

  const [character, setCharacter] = useState<CharacterType | null>(null);
  const [characterList, setCharacterList] = useState<CharacterType[]>([]);
  const [totalCharCount, setTotalCharCount] = useState<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [allHsks, setAllHsks] = useState<HSKType[]>([]);
  const [hsk, setHsk] = useState<HSKType | null>(null);
  const [lesson, setLesson] = useState<LessonType | null>(null);
  const userExplicitlySelectedAll = useRef<boolean>(false);
  const [selectedHskId, setSelectedHskId] = useState<number | null>(() => {
    if (params.hskId && !isNaN(Number(params.hskId)) && Number(params.hskId) > 0) {
      return Number(params.hskId);
    }
    return null;
  });

  // Drawing state
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  // currentStroke is tracked via refs only — no state — to avoid re-rendering the whole page
  const livePathRef = useRef<string>('');
  const liveTickRef = useRef<number>(0);
  const [selectedColor, setSelectedColor] = useState<string>('#1e293b');
  const [selectedWidth, setSelectedWidth] = useState<number>(10);
  const [gridStyle, setGridStyle] = useState<'mige' | 'tiange' | 'blank'>('mige');
  const [guideOpacity, setGuideOpacity] = useState<number>(0.35);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Layout ref for accurate touch tracking
  const canvasLayoutRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  });

  // Current stroke ref to avoid state lag inside PanResponder
  const strokePointsRef = useRef<Point[]>([]);
  const strokeColorRef = useRef<string>(selectedColor);
  const strokeWidthRef = useRef<number>(selectedWidth);

  useEffect(() => {
    strokeColorRef.current = selectedColor;
  }, [selectedColor]);

  useEffect(() => {
    strokeWidthRef.current = selectedWidth;
  }, [selectedWidth]);

  // Helper to fetch total count based on active filter
  const fetchTotalCount = useCallback(
    (hskId: number | null): number => {
      try {
        if (hskId !== null && hskId > 0) {
          return getCharactersCountByHSKId(hskId);
        } else if (params.lessonId && !isNaN(Number(params.lessonId))) {
          return getCharactersCountByLessonId(Number(params.lessonId));
        } else {
          return getAllCharactersCount();
        }
      } catch {
        return 0;
      }
    },
    [params.lessonId]
  );

  // Helper to fetch a 10-item batch based on active filter
  const fetchCharactersBatch = useCallback(
    (hskId: number | null, limit: number, offset: number): CharacterType[] => {
      try {
        if (hskId !== null && hskId > 0) {
          return (getCharactersByHSKId(hskId, limit, offset) as CharacterType[]) || [];
        } else if (params.lessonId && !isNaN(Number(params.lessonId))) {
          return (getCharactersByLessonId(Number(params.lessonId), limit, offset) as CharacterType[]) || [];
        } else {
          return (getAllCharacters(limit, offset) as CharacterType[]) || [];
        }
      } catch (err) {
        console.error('Error fetching characters batch:', err);
        return [];
      }
    },
    [params.lessonId]
  );

  // Load character data (fetching first 10 items)
  const loadData = useCallback(() => {
    try {
      // 1. Fetch available HSK levels
      const hsks = (getAllHSKs() as HSKType[]) || [];
      setAllHsks(hsks);

      // 2. Fetch current character
      const char = getCharacterById(currentId);
      setCharacter(char);

      if (char?.hskId) {
        setHsk(getHSKById(char.hskId));
      } else {
        setHsk(null);
      }

      if (char?.lessonId) {
        setLesson(getLessonById(char.lessonId));
      } else {
        setLesson(null);
      }

      // 3. Determine active HSK filter
      let activeHsk = selectedHskId;
      if (activeHsk === null && !userExplicitlySelectedAll.current) {
        if (params.hskId && !isNaN(Number(params.hskId)) && Number(params.hskId) > 0) {
          activeHsk = Number(params.hskId);
          setSelectedHskId(activeHsk);
        } else if (char?.hskId) {
          activeHsk = char.hskId;
          setSelectedHskId(activeHsk);
        }
      }

      // 4. Fetch total count & initial 10 characters
      const total = fetchTotalCount(activeHsk);
      setTotalCharCount(total);

      const batch = fetchCharactersBatch(activeHsk, PAGE_SIZE, 0);

      // Ensure the currently displayed character is in characterList
      let list = batch;
      if (char && !batch.some((c) => c.id === char.id)) {
        const matchesFilter =
          activeHsk === null ||
          char.hskId === activeHsk;
        if (matchesFilter) {
          list = [char, ...batch];
        }
      }

      setCharacterList(list);
    } catch (err) {
      console.error('Error loading write character data:', err);
    }
  }, [currentId, params.hskId, selectedHskId, fetchTotalCount, fetchCharactersBatch]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset strokes when character changes
  useEffect(() => {
    livePathRef.current = '';
    strokePointsRef.current = [];
    setStrokes([]);
  }, [currentId]);

  // Pronunciation
  const handlePlayAudio = () => {
    if (!character?.content) return;
    setIsPlayingAudio(true);
    speakChineseText(
      character.content,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  // Next / Prev navigation
  const currentIndex = characterList.findIndex((c) => c.id === currentId);
  const prevChar = currentIndex > 0 ? characterList[currentIndex - 1] : null;
  const nextChar =
    currentIndex >= 0 && currentIndex < characterList.length - 1
      ? characterList[currentIndex + 1]
      : null;
  const canGoNext = Boolean(nextChar || characterList.length < totalCharCount);

  const navigateToChar = (charId: number, overrideHskId?: number | null) => {
    const targetHsk = overrideHskId !== undefined ? overrideHskId : selectedHskId;
    router.replace({
      pathname: '/pages/characterWrite/[id]',
      params: {
        id: String(charId),
        hskId: targetHsk ? String(targetHsk) : '',
        lessonId: params.lessonId || '',
      },
    });
  };

  // Load next batch of 10 characters
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || characterList.length >= totalCharCount) return;
    setIsLoadingMore(true);

    try {
      const nextBatch = fetchCharactersBatch(
        selectedHskId,
        PAGE_SIZE,
        characterList.length
      );

      if (nextBatch.length > 0) {
        const existingIds = new Set(characterList.map((c) => c.id));
        const newUnique = nextBatch.filter((c) => !existingIds.has(c.id));
        setCharacterList((prev) => [...prev, ...newUnique]);
      }
    } catch (err) {
      console.error('Error loading more characters:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, characterList, totalCharCount, selectedHskId, fetchCharactersBatch]);

  // Next button click handler: navigate to nextChar or fetch next 10 and advance
  const handleNext = () => {
    if (nextChar) {
      navigateToChar(nextChar.id);
    } else if (characterList.length < totalCharCount) {
      setIsLoadingMore(true);
      try {
        const nextBatch = fetchCharactersBatch(
          selectedHskId,
          PAGE_SIZE,
          characterList.length
        );
        if (nextBatch.length > 0) {
          const existingIds = new Set(characterList.map((c) => c.id));
          const newUnique = nextBatch.filter((c) => !existingIds.has(c.id));
          setCharacterList((prev) => [...prev, ...newUnique]);
          navigateToChar(nextBatch[0].id);
        }
      } catch (err) {
        console.error('Error loading next batch:', err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const handleSelectHsk = (hskId: number | null) => {
    if (hskId === null) {
      userExplicitlySelectedAll.current = true;
    } else {
      userExplicitlySelectedAll.current = false;
    }
    setSelectedHskId(hskId);

    try {
      const total = fetchTotalCount(hskId);
      setTotalCharCount(total);

      const batch = fetchCharactersBatch(hskId, PAGE_SIZE, 0);
      setCharacterList(batch);

      const exists = batch.some((c) => c.id === currentId);
      if (!exists && batch.length > 0) {
        // Automatically switch to the first character of the selected HSK
        navigateToChar(batch[0].id, hskId);
      } else if (batch.length === 0) {
        setCharacter(null);
        setHsk(null);
        setLesson(null);
        handleClear();
      } else {
        router.setParams({
          hskId: hskId ? String(hskId) : '',
        });
      }
    } catch (err) {
      console.error('Error selecting HSK:', err);
    }
  };

  const selectedHskName = useMemo(() => {
    if (selectedHskId === null) return 'All Levels';
    const found = allHsks.find((h) => h.id === selectedHskId);
    return found ? found.name : `HSK ${selectedHskId}`;
  }, [selectedHskId, allHsks]);

  // Canvas drawing via PanResponder
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const p = {
            x: Math.max(0, Math.min(CANVAS_SIZE, locationX)),
            y: Math.max(0, Math.min(CANVAS_SIZE, locationY)),
          };
          strokePointsRef.current = [p];
          // Start live path and notify the isolated layer
          livePathRef.current = `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
          (liveTickRef.current as any)((n: number) => n + 1);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const nx = Math.max(0, Math.min(CANVAS_SIZE, locationX));
          const ny = Math.max(0, Math.min(CANVAS_SIZE, locationY));
          const pts = strokePointsRef.current;
          // Decimation: skip points closer than 3 px to reduce SVG complexity
          const last = pts[pts.length - 1];
          const dx = nx - last.x;
          const dy = ny - last.y;
          if (dx * dx + dy * dy < 9) return;
          const p = { x: nx, y: ny };
          pts.push(p);
          // Incrementally extend the quadratic bezier path without recomputing all points
          const prev = pts[pts.length - 2];
          const midX = ((prev.x + p.x) / 2).toFixed(1);
          const midY = ((prev.y + p.y) / 2).toFixed(1);
          livePathRef.current += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)}, ${midX} ${midY}`;
          // Tick the isolated layer only (no parent re-render)
          (liveTickRef.current as any)((n: number) => n + 1);
        },
        onPanResponderRelease: () => {
          const pts = strokePointsRef.current;
          if (pts.length > 0) {
            const completed: Stroke = {
              points: [...pts],
              color: strokeColorRef.current,
              width: strokeWidthRef.current,
            };
            // Clear live path FIRST so it disappears from the live layer,
            // then commit to strokes — both happen in the same React batch,
            // so the committed stroke SVG and the empty live layer render together.
            livePathRef.current = '';
            setStrokes((prev) => [...prev, completed]);
          }
          strokePointsRef.current = [];
        },
        onPanResponderTerminate: () => {
          const pts = strokePointsRef.current;
          if (pts.length > 0) {
            const completed: Stroke = {
              points: [...pts],
              color: strokeColorRef.current,
              width: strokeWidthRef.current,
            };
            livePathRef.current = '';
            setStrokes((prev) => [...prev, completed]);
          }
          strokePointsRef.current = [];
        },
      }),
    []
  );

  // Convert points to smooth SVG path
  const pointsToSvgPath = (points: Point[]): string => {
    if (!points || points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.5} ${points[0].y + 0.5}`;
    }
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      d += ` Q ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
    return d;
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClear = () => {
    livePathRef.current = '';
    strokePointsRef.current = [];
    setStrokes([]);
  };

  const cycleGrid = () => {
    setGridStyle((prev) => {
      if (prev === 'mige') return 'tiange';
      if (prev === 'tiange') return 'blank';
      return 'mige';
    });
  };

  const cycleOpacity = () => {
    setGuideOpacity((prev) => {
      if (prev === 0) return 0.15;
      if (prev === 0.15) return 0.35;
      if (prev === 0.35) return 0.65;
      return 0;
    });
  };

  const toneColor = toneColors[character?.tone || '5'] || '#ec4899';
  const toneLabel = toneLabels[character?.tone || '5'] || 'Neutral Tone';

  const colorPalette = [
    { name: 'Ink', color: '#1e293b' },
    { name: 'Vermilion', color: '#dc2626' },
    { name: 'Tone', color: toneColor },
    { name: 'Jade', color: '#059669' },
    { name: 'Indigo', color: '#4f46e5' },
  ];

  return (
    <ThemedView style={styles.container}>
      <Bg1 />

      <Header
        useBackArrow={true}
        label={character ? `Write: ${character.content}` : 'Write Character'}
        subtitle={character?.pinyin || selectedHskName}
        items={[
          <TouchableOpacity
            key="audio"
            onPress={handlePlayAudio}
            activeOpacity={0.7}
            style={[styles.headerIconBtn, isPlayingAudio && { backgroundColor: toneColor + '20' }]}
          >
            <Lucide
              name={isPlayingAudio ? 'volume-2' : 'volume-1'}
              size={18}
              color={isPlayingAudio ? toneColor : '#475569'}
            />
          </TouchableOpacity>,
          <TouchableOpacity
            key="details"
            onPress={() => currentId && router.push(`/pages/characterDetails/${currentId}` as any)}
            activeOpacity={0.7}
            style={styles.headerIconBtn}
          >
            <Lucide name="external-link" size={17} color="#475569" />
          </TouchableOpacity>,
        ]}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HSK LEVEL SELECTOR BAR ── */}
        <View style={styles.hskSelectorContainer}>
          <View style={styles.hskSelectorHeader}>
            <View style={styles.hskSelectorTitleRow}>
              <View style={styles.hskIconBadge}>
                <Lucide name="layers" size={14} color="#8b5cf6" />
              </View>
              <Text style={styles.hskSelectorTitle}>HSK Level</Text>
            </View>
            <View style={styles.hskCountBadge}>
              <Text style={styles.hskCountText}>
                {totalCharCount > characterList.length
                  ? `Showing ${characterList.length} of ${totalCharCount}`
                  : `${totalCharCount} ${totalCharCount === 1 ? 'character' : 'characters'}`}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hskChipsScroll}
          >
            {/* All Levels Chip */}
            <TouchableOpacity
              style={[
                styles.hskChip,
                selectedHskId === null && styles.hskChipActive,
              ]}
              onPress={() => handleSelectHsk(null)}
              activeOpacity={0.7}
            >
              {selectedHskId === null && (
                <Lucide name="check" size={12} color="#ffffff" style={{ marginRight: 4 }} />
              )}
              <Text
                style={[
                  styles.hskChipText,
                  selectedHskId === null && styles.hskChipTextActive,
                ]}
              >
                All Levels
              </Text>
            </TouchableOpacity>

            {/* Individual HSK Level Chips */}
            {allHsks.map((item) => {
              const isSelected = selectedHskId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.hskChip,
                    isSelected && styles.hskChipActive,
                  ]}
                  onPress={() => handleSelectHsk(item.id)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <Lucide name="check" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                  )}
                  <Text
                    style={[
                      styles.hskChipText,
                      isSelected && styles.hskChipTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {characterList.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Lucide name="book-open" size={28} color="#8b5cf6" />
            </View>
            <Text style={styles.emptyTitle}>No characters in this level</Text>
            <Text style={styles.emptySubtitle}>
              There are no characters assigned to {selectedHskName} yet.
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => handleSelectHsk(null)}
              activeOpacity={0.7}
            >
              <Lucide name="rotate-ccw" size={14} color="#ffffff" />
              <Text style={styles.emptyResetText}>Show All Characters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── TOP NAV BAR: PREV / CURRENT / NEXT ── */}
        <View style={styles.topCharBar}>
          <TouchableOpacity
            style={[styles.navStepBtn, !prevChar && styles.navStepDisabled]}
            disabled={!prevChar}
            onPress={() => prevChar && navigateToChar(prevChar.id)}
            activeOpacity={0.7}
          >
            <Lucide name="chevron-left" size={18} color={prevChar ? '#1e293b' : '#cbd5e1'} />
            <Text style={[styles.navStepText, !prevChar && styles.navStepTextDisabled]}>
              {prevChar ? prevChar.content : 'Prev'}
            </Text>
          </TouchableOpacity>

          <View style={styles.charHeaderBadge}>
            <View style={[styles.miniToneBadge, { backgroundColor: toneColor }]}>
              <Text style={styles.miniToneText}>T{character?.tone || '5'}</Text>
            </View>
            <Text style={styles.charHeaderPinyin}>{character?.pinyin || ''}</Text>
            <Text style={styles.charHeaderMeaning} numberOfLines={1}>
              {character?.meaning?.split(',')[0] || ''}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.navStepBtn, !canGoNext && styles.navStepDisabled]}
            disabled={!canGoNext || isLoadingMore}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={[styles.navStepText, !canGoNext && styles.navStepTextDisabled]}>
              {isLoadingMore ? 'Loading...' : nextChar ? nextChar.content : 'Next'}
            </Text>
            {isLoadingMore ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : (
              <Lucide name="chevron-right" size={18} color={canGoNext ? '#1e293b' : '#cbd5e1'} />
            )}
          </TouchableOpacity>
        </View>

        {/* ── CANVAS CARD ── */}
        <View style={styles.canvasCard}>
          {/* Card Top Utility Bar */}
          <View style={styles.canvasToolbar}>
            {/* Grid selector */}
            <TouchableOpacity
              style={[styles.toolChip, gridStyle !== 'blank' && styles.toolChipActive]}
              onPress={cycleGrid}
              activeOpacity={0.7}
            >
              <Lucide name="grid" size={14} color={gridStyle !== 'blank' ? '#3b82f6' : '#64748b'} />
              <Text
                style={[
                  styles.toolChipText,
                  gridStyle !== 'blank' && { color: '#3b82f6', fontWeight: '700' },
                ]}
              >
                {gridStyle === 'mige' ? '米字格' : gridStyle === 'tiange' ? '田字格' : 'No Grid'}
              </Text>
            </TouchableOpacity>

            {/* Guide opacity toggle */}
            <TouchableOpacity
              style={[styles.toolChip, guideOpacity > 0 && styles.toolChipActive]}
              onPress={cycleOpacity}
              activeOpacity={0.7}
            >
              <Lucide
                name={guideOpacity > 0 ? 'eye' : 'eye-off'}
                size={14}
                color={guideOpacity > 0 ? '#10b981' : '#64748b'}
              />
              <Text
                style={[
                  styles.toolChipText,
                  guideOpacity > 0 && { color: '#10b981', fontWeight: '700' },
                ]}
              >
                Guide: {guideOpacity === 0 ? 'Off' : `${Math.round(guideOpacity * 100)}%`}
              </Text>
            </TouchableOpacity>

            {/* Stroke counter */}
            <View style={styles.strokeCountBadge}>
              <Lucide name="pencil" size={12} color="#64748b" />
              <Text style={styles.strokeCountText}>{strokes.length} strokes</Text>
            </View>
          </View>

          {/* ── THE CALLIGRAPHY WRITING CANVAS ── */}
          <View
            style={[
              styles.canvasWrapper,
              { width: CANVAS_SIZE, height: CANVAS_SIZE },
            ]}
            onLayout={(e: LayoutChangeEvent) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              canvasLayoutRef.current = { x, y, width, height };
            }}
            {...panResponder.panHandlers}
          >
            {/* Background SVG Grid: Mi-zi-ge or Tian-zi-ge */}
            <Svg
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={StyleSheet.absoluteFill}
            >
              <Rect
                x={1}
                y={1}
                width={CANVAS_SIZE - 2}
                height={CANVAS_SIZE - 2}
                fill="#fffdfa"
                stroke="#fca5a5"
                strokeWidth={2}
                rx={12}
              />

              {gridStyle !== 'blank' && (
                <>
                  {/* Outer crosshairs */}
                  <Line
                    x1={0}
                    y1={CANVAS_SIZE / 2}
                    x2={CANVAS_SIZE}
                    y2={CANVAS_SIZE / 2}
                    stroke="#fca5a5"
                    strokeWidth={1.5}
                    strokeDasharray="5,4"
                  />
                  <Line
                    x1={CANVAS_SIZE / 2}
                    y1={0}
                    x2={CANVAS_SIZE / 2}
                    y2={CANVAS_SIZE}
                    stroke="#fca5a5"
                    strokeWidth={1.5}
                    strokeDasharray="5,4"
                  />

                  {/* Mi-zi-ge diagonals */}
                  {gridStyle === 'mige' && (
                    <>
                      <Line
                        x1={0}
                        y1={0}
                        x2={CANVAS_SIZE}
                        y2={CANVAS_SIZE}
                        stroke="#fecaca"
                        strokeWidth={1}
                        strokeDasharray="4,5"
                      />
                      <Line
                        x1={CANVAS_SIZE}
                        y1={0}
                        x2={0}
                        y2={CANVAS_SIZE}
                        stroke="#fecaca"
                        strokeWidth={1}
                        strokeDasharray="4,5"
                      />
                    </>
                  )}
                </>
              )}
            </Svg>

            {/* Faint watermark character to trace over */}
            {guideOpacity > 0 && character?.content && (
              <View
                style={[styles.watermarkContainer, { opacity: guideOpacity }]}
                pointerEvents="none"
              >
                <Text
                  style={[
                    styles.watermarkText,
                    {
                      fontSize: CANVAS_SIZE * 0.72,
                      lineHeight: CANVAS_SIZE * 0.88,
                      color: '#0f172a',
                    },
                  ]}
                >
                  {character.content}
                </Text>
              </View>
            )}

            {/* Committed strokes SVG — only re-renders when strokes[] changes */}
            <Svg
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              {strokes.map((s, idx) => (
                <Path
                  key={`stroke-${idx}`}
                  d={pointsToSvgPath(s.points)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </Svg>

            {/* Live stroke layer — isolated component, no parent re-renders during drawing */}
            <LiveStrokeLayer
              size={CANVAS_SIZE}
              pathRef={livePathRef}
              color={selectedColor}
              width={selectedWidth}
              tickRef={liveTickRef}
            />
          </View>

          {/* ── DRAWING CONTROLS BAR: Undo, Clear, Brush, Colors ── */}
          <View style={styles.controlsSection}>
            {/* Action buttons: Undo & Clear */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.canvasActionBtn,
                  strokes.length === 0 && styles.canvasActionBtnDisabled,
                ]}
                disabled={strokes.length === 0}
                onPress={handleUndo}
                activeOpacity={0.7}
              >
                <Lucide
                  name="undo-2"
                  size={16}
                  color={strokes.length === 0 ? '#94a3b8' : '#334155'}
                />
                <Text
                  style={[
                    styles.canvasActionText,
                    strokes.length === 0 && styles.canvasActionTextDisabled,
                  ]}
                >
                  Undo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.canvasActionBtn,
                  strokes.length === 0 && styles.canvasActionBtnDisabled,
                  { borderColor: '#fee2e2' },
                ]}
                disabled={strokes.length === 0}
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <Lucide
                  name="trash-2"
                  size={16}
                  color={strokes.length === 0 ? '#94a3b8' : '#ef4444'}
                />
                <Text
                  style={[
                    styles.canvasActionText,
                    { color: strokes.length === 0 ? '#94a3b8' : '#ef4444' },
                  ]}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            </View>

            {/* Brush sizes */}
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Size:</Text>
              <View style={styles.brushSizesWrapper}>
                {BRUSH_SIZES.map((b) => (
                  <TouchableOpacity
                    key={b.label}
                    style={[
                      styles.brushSizeBtn,
                      selectedWidth === b.width && styles.brushSizeBtnActive,
                    ]}
                    onPress={() => setSelectedWidth(b.width)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.brushDot,
                        {
                          width: b.width + 2,
                          height: b.width + 2,
                          backgroundColor:
                            selectedWidth === b.width ? '#0f172a' : '#94a3b8',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.brushSizeText,
                        selectedWidth === b.width && styles.brushSizeTextActive,
                      ]}
                    >
                      {b.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color swatches */}
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Color:</Text>
              <View style={styles.colorsWrapper}>
                {colorPalette.map((item) => {
                  const isSelected = selectedColor.toLowerCase() === item.color.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: item.color },
                        isSelected && styles.colorSwatchActive,
                      ]}
                      onPress={() => setSelectedColor(item.color)}
                      activeOpacity={0.8}
                    >
                      {isSelected && (
                        <Lucide name="check" size={14} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* ── CHARACTER INFO SUMMARY CARD ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View style={styles.infoCardLeft}>
              <View style={[styles.infoTonePill, { backgroundColor: toneColor }]}>
                <Text style={styles.infoToneText}>Tone {character?.tone || '5'}</Text>
              </View>
              <Text style={[styles.infoPinyin, { color: toneColor }]}>
                {character?.pinyin || ''}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.soundBtn, { borderColor: toneColor }]}
              onPress={handlePlayAudio}
              activeOpacity={0.7}
            >
              <Lucide name="volume-2" size={16} color={toneColor} />
              <Text style={[styles.soundBtnText, { color: toneColor }]}>Pronounce</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.meaningRow}>
            <Lucide name="book-open" size={15} color="#64748b" />
            <Text style={styles.infoMeaning}>{character?.meaning || 'No definition'}</Text>
          </View>

          <View style={styles.tagRow}>
            <View style={[styles.toneDetailPill, { backgroundColor: toneColor + '15' }]}>
              <Lucide name="music" size={12} color={toneColor} />
              <Text style={[styles.toneDetailText, { color: toneColor }]}>{toneLabel}</Text>
            </View>

            {hsk && (
              <TouchableOpacity
                style={[
                  styles.metaPill,
                  selectedHskId === hsk.id && { backgroundColor: '#f3e8ff', borderColor: '#d8b4fe' },
                ]}
                onPress={() => handleSelectHsk(hsk.id)}
                activeOpacity={0.7}
              >
                <Lucide name="layers" size={12} color="#8b5cf6" />
                <Text style={[styles.metaPillText, { color: '#8b5cf6' }]}>{hsk.name}</Text>
              </TouchableOpacity>
            )}

            {lesson && (
              <View style={styles.metaPill}>
                <Lucide name="book-open" size={12} color="#0284c7" />
                <Text style={[styles.metaPillText, { color: '#0284c7' }]}>
                  Lesson {lesson.num}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── CHINESE STROKE ORDER RULES (COLLAPSIBLE) ── */}
        <View style={styles.rulesCard}>
          <TouchableOpacity
            style={styles.rulesHeader}
            onPress={() => setShowRules((prev) => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.rulesHeaderLeft}>
              <Lucide name="award" size={18} color="#d97706" />
              <Text style={styles.rulesTitle}>Stroke Order Principles (笔顺规则)</Text>
            </View>
            <Lucide
              name={showRules ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#64748b"
            />
          </TouchableOpacity>

          {showRules && (
            <View style={styles.rulesContent}>
              <Text style={styles.rulesIntro}>
                Writing Chinese characters in the correct stroke sequence creates balanced,
                fluid Hanzi calligraphy:
              </Text>

              {STROKE_RULES.map((item, idx) => (
                <View key={idx} style={styles.ruleItem}>
                  <View style={styles.ruleNumBadge}>
                    <Text style={styles.ruleNumText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleChinese}>{item.rule}</Text>
                    <Text style={styles.ruleEnglish}>{item.en}</Text>
                  </View>
                  <View style={styles.examplePill}>
                    <Text style={styles.exampleText}>{item.example}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── QUICK CHARACTER SELECTOR HORIZONTAL CAROUSEL ── */}
        {(characterList.length > 1 || totalCharCount > 1) && (
          <View style={styles.quickSelectorSection}>
            <View style={styles.quickSelectorHeader}>
              <Text style={styles.quickSelectorTitle}>
                Practice Other Characters ({characterList.length}
                {totalCharCount > characterList.length ? ` / ${totalCharCount}` : ''})
              </Text>
              {characterList.length < totalCharCount && (
                <TouchableOpacity
                  onPress={handleLoadMore}
                  disabled={isLoadingMore}
                  style={styles.quickLoadMoreLink}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickLoadMoreLinkText}>
                    {isLoadingMore ? 'Loading...' : '+10 More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickListContent}
            >
              {characterList.map((c) => {
                const isSelected = c.id === currentId;
                const cTone = toneColors[c.tone || '5'] || '#ec4899';
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.quickCharCard,
                      isSelected && [styles.quickCharCardActive, { borderColor: cTone }],
                    ]}
                    onPress={() => navigateToChar(c.id)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.quickCharSymbol,
                        isSelected && { color: cTone, fontWeight: '800' },
                      ]}
                    >
                      {c.content}
                    </Text>
                    <Text style={styles.quickCharPinyin} numberOfLines={1}>
                      {c.pinyin}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {characterList.length < totalCharCount && (
                <TouchableOpacity
                  style={styles.loadMoreCard}
                  onPress={handleLoadMore}
                  disabled={isLoadingMore}
                  activeOpacity={0.75}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color="#8b5cf6" />
                  ) : (
                    <>
                      <View style={styles.loadMoreIconCircle}>
                        <Lucide name="plus" size={16} color="#8b5cf6" />
                      </View>
                      <Text style={styles.loadMoreCardTitle}>+10 More</Text>
                      <Text style={styles.loadMoreCardSubtitle}>
                        {totalCharCount - characterList.length} left
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 5,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 5,
    alignItems: 'center',
  },
  /* Top character nav */
  topCharBar: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.83)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  navStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.83)',
  },
  navStepDisabled: {
    opacity: 0.4,
  },
  navStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  navStepTextDisabled: {
    color: '#94a3b8',
  },
  charHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniToneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniToneText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  charHeaderPinyin: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  charHeaderMeaning: {
    fontSize: 12,
    color: '#64748b',
    maxWidth: 90,
  },

  /* Canvas Card */
  canvasCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffffd4',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    // elevation: 4,
    gap: 12,
  },
  canvasToolbar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toolChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  toolChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  strokeCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#f9f8fcff',
  },
  strokeCountText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
  },

  /* The actual square canvas container */
  canvasWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fffafad1',
    borderWidth: 1,
    borderColor: '#fca5a5',
    elevation: 1,
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkText: {
    fontWeight: '400',
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  /* Drawing controls */
  controlsSection: {
    width: '100%',
    gap: 12,
    paddingTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  canvasActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  canvasActionBtnDisabled: {
    opacity: 0.4,
  },
  canvasActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  canvasActionTextDisabled: {
    color: '#94a3b8',
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
    width: 44,
  },
  brushSizesWrapper: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  brushSizeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  brushSizeBtnActive: {
    backgroundColor: '#f1f5f9',
    borderColor: '#0f172a',
  },
  brushDot: {
    borderRadius: 20,
  },
  brushSizeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  brushSizeTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },

  colorsWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorSwatchActive: {
    borderColor: '#ffffff',
    transform: [{ scale: 1.15 }],
  },

  /* Info Card */
  infoCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffffd7',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTonePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  infoToneText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  infoPinyin: {
    fontSize: 18,
    fontWeight: '800',
  },
  soundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  soundBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  meaningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoMeaning: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  toneDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  toneDetailText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Stroke order rules */
  rulesCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fffbebd8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fde68ac8',
    overflow: 'hidden',
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  rulesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rulesTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#92400e',
  },
  rulesContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#fef3c7',
    paddingTop: 10,
  },
  rulesIntro: {
    fontSize: 12.5,
    color: '#78350f',
    lineHeight: 18,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 8,
    borderRadius: 12,
  },
  ruleNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  ruleChinese: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  ruleEnglish: {
    fontSize: 11,
    color: '#64748b',
  },
  examplePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
  },
  exampleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
  },

  /* Quick selector */
  quickSelectorSection: {
    width: '100%',
    maxWidth: 420,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.83)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#dbdbdbff"
  },
  quickSelectorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    paddingHorizontal: 4,
  },
  quickSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  quickLoadMoreLink: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  quickLoadMoreLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  loadMoreCard: {
    width: 66,
    height: 66,
    borderRadius: 14,
    backgroundColor: '#faf5ff',
    borderWidth: 1.5,
    borderColor: '#d8b4fe',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    gap: 2,
  },
  loadMoreIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreCardTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  loadMoreCardSubtitle: {
    fontSize: 9,
    color: '#a855f7',
  },
  quickListContent: {
    gap: 8,
    paddingVertical: 2,
  },
  quickCharCard: {
    width: 58,
    height: 66,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  quickCharCardActive: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  quickCharSymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  quickCharPinyin: {
    fontSize: 10,
    color: '#64748b',
  },

  /* HSK Level Selector */
  hskSelectorContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffffdd',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    // elevation: 2,
    gap: 10,
  },
  hskSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  hskSelectorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hskIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hskSelectorTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  hskCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hskCountText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
  },
  hskChipsScroll: {
    gap: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  hskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hskChipActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  hskChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  hskChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  /* Empty State */
  emptyCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 6,
  },
  emptyResetText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

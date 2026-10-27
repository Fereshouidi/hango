import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { speakChineseWithRate, stopSpeaking } from '@/utils/tts';
import { LoopInterval, LoopItem, LoopMode, LoopRepeatCount, LoopSpeed } from '../types';

const STORAGE_KEY = 'loop_settings_v1';

interface PersistedSettings {
  loopMode: LoopMode;
  repeatCount: LoopRepeatCount;
  pauseInterval: LoopInterval;
  speed: LoopSpeed;
  showPinyin: boolean;
  showMeaning: boolean;
}

const DEFAULTS: PersistedSettings = {
  loopMode: 'repeat-all',
  repeatCount: 2,
  pauseInterval: 2,
  speed: 0.85,
  showPinyin: true,
  showMeaning: true,
};

export function useListeningLoop(initialPlaylist: LoopItem[] = []) {
  const [playlist, setPlaylist] = useState<LoopItem[]>(initialPlaylist);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenCharIndex, setSpokenCharIndex] = useState<number>(-1);
  const [isWaitingInterval, setIsWaitingInterval] = useState(false);
  const [intervalCountdown, setIntervalCountdown] = useState(0);
  const [repeatCounter, setRepeatCounter] = useState(1);

  // Loop settings — initialized from defaults; rehydrated from AsyncStorage on mount
  const [loopMode, setLoopModeState] = useState<LoopMode>(DEFAULTS.loopMode);
  const [repeatCount, setRepeatCountState] = useState<LoopRepeatCount>(DEFAULTS.repeatCount);
  const [pauseInterval, setPauseIntervalState] = useState<LoopInterval>(DEFAULTS.pauseInterval);
  const [speed, setSpeedState] = useState<LoopSpeed>(DEFAULTS.speed);

  // Visibility toggles
  const [showPinyin, setShowPinyinState] = useState(DEFAULTS.showPinyin);
  const [showMeaning, setShowMeaningState] = useState(DEFAULTS.showMeaning);

  // ── Load persisted settings on mount ──────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved: Partial<PersistedSettings> = JSON.parse(raw);
        if (saved.loopMode) setLoopModeState(saved.loopMode);
        if (saved.repeatCount !== undefined) setRepeatCountState(saved.repeatCount as LoopRepeatCount);
        if (saved.pauseInterval !== undefined) setPauseIntervalState(saved.pauseInterval as LoopInterval);
        if (saved.speed !== undefined) setSpeedState(saved.speed as LoopSpeed);
        if (saved.showPinyin !== undefined) setShowPinyinState(saved.showPinyin);
        if (saved.showMeaning !== undefined) setShowMeaningState(saved.showMeaning);
      } catch {
        // corrupted storage, ignore
      }
    });
  }, []);

  // ── Persist helper ─────────────────────────────────────────────────────────
  const persist = useCallback((patch: Partial<PersistedSettings>) => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      const current: PersistedSettings = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
    });
  }, []);

  // ── Setting setters that also persist ─────────────────────────────────────
  const setLoopMode = useCallback((v: LoopMode) => {
    setLoopModeState(v);
    persist({ loopMode: v });
  }, [persist]);

  const setRepeatCount = useCallback((v: LoopRepeatCount) => {
    setRepeatCountState(v);
    persist({ repeatCount: v });
  }, [persist]);

  const setPauseInterval = useCallback((v: LoopInterval) => {
    setPauseIntervalState(v);
    persist({ pauseInterval: v });
  }, [persist]);

  const setSpeed = useCallback((v: LoopSpeed) => {
    setSpeedState(v);
    persist({ speed: v });
  }, [persist]);

  const setShowPinyin = useCallback((v: boolean) => {
    setShowPinyinState(v);
    persist({ showPinyin: v });
  }, [persist]);

  const setShowMeaning = useCallback((v: boolean) => {
    setShowMeaningState(v);
    persist({ showMeaning: v });
  }, [persist]);

  // Refs for async callbacks
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const repeatCounterRef = useRef(repeatCounter);
  repeatCounterRef.current = repeatCounter;

  const repeatCountRef = useRef(repeatCount);
  repeatCountRef.current = repeatCount;

  const loopModeRef = useRef(loopMode);
  loopModeRef.current = loopMode;

  const intervalRef = useRef(pauseInterval);
  intervalRef.current = pauseInterval;

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timers
  const clearTimers = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      globalThis.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (speechTickerRef.current) {
      globalThis.clearInterval(speechTickerRef.current);
      speechTickerRef.current = null;
    }
    setSpokenCharIndex(-1);
    setIsWaitingInterval(false);
    setIntervalCountdown(0);
  }, []);

  // Update playlist
  const updatePlaylist = useCallback(
    (newItems: LoopItem[], resetIndex = true) => {
      setPlaylist(newItems);
      if (resetIndex) {
        clearTimers();
        stopSpeaking();
        setIsPlaying(false);
        setIsSpeaking(false);
        setSpokenCharIndex(-1);
        setCurrentIndex(0);
        setRepeatCounter(1);
      }
    },
    [clearTimers]
  );

  // Append items to playlist without stopping current playback
  const appendPlaylist = useCallback((moreItems: LoopItem[]) => {
    setPlaylist((prev) => [...prev, ...moreItems]);
  }, []);

  // Advance to next index
  const getNextIndex = useCallback(
    (direction: 'next' | 'prev' = 'next') => {
      const total = playlistRef.current.length;
      if (total <= 1) return 0;

      if (loopModeRef.current === 'shuffle') {
        let rand = Math.floor(Math.random() * total);
        if (rand === currentIndexRef.current) {
          rand = (rand + 1) % total;
        }
        return rand;
      }

      if (direction === 'prev') {
        return (currentIndexRef.current - 1 + total) % total;
      }
      return (currentIndexRef.current + 1) % total;
    },
    []
  );

  // Core speak function
  const speakCurrentItem = useCallback(() => {
    const list = playlistRef.current;
    const idx = currentIndexRef.current;
    if (!list.length || idx < 0 || idx >= list.length) {
      setIsPlaying(false);
      return;
    }

    const item = list[idx];
    clearTimers();

    speakChineseWithRate(
      item.content,
      speedRef.current,
      () => {
        setIsSpeaking(true);
        setSpokenCharIndex(0);
        if (speechTickerRef.current) {
          globalThis.clearInterval(speechTickerRef.current);
        }
        const textLen = item.content.length;
        const tickMs = Math.max(120, Math.round(280 / (speedRef.current || 0.85)));
        speechTickerRef.current = globalThis.setInterval(() => {
          setSpokenCharIndex((prev) => {
            if (prev < 0) return 0;
            if (prev >= textLen - 1) return prev;
            return prev + 1;
          });
        }, tickMs);
      },
      () => {
        if (speechTickerRef.current) {
          globalThis.clearInterval(speechTickerRef.current);
          speechTickerRef.current = null;
        }
        setIsSpeaking(false);
        setSpokenCharIndex(-1);
        if (!isPlayingRef.current) return;

        handleItemFinished();
      },
      (charIndex: number) => {
        setSpokenCharIndex(charIndex);
      }
    );
  }, [clearTimers]);

  // Handle sentence completion
  const handleItemFinished = useCallback(() => {
    const targetRepeats = repeatCountRef.current;
    const currentRep = repeatCounterRef.current;

    // Check if we need to repeat current item
    const shouldRepeatCurrent =
      targetRepeats === 0 || // infinite repeats
      (targetRepeats > 1 && currentRep < targetRepeats);

    if (shouldRepeatCurrent) {
      const nextRep = targetRepeats === 0 ? currentRep + 1 : currentRep + 1;
      setRepeatCounter(nextRep);
      repeatCounterRef.current = nextRep;
      scheduleNextPlayback(false);
    } else {
      // Move to next item in playlist
      setRepeatCounter(1);
      repeatCounterRef.current = 1;

      if (loopModeRef.current === 'repeat-one') {
        scheduleNextPlayback(false);
      } else {
        const nextIdx = getNextIndex('next');
        setCurrentIndex(nextIdx);
        currentIndexRef.current = nextIdx;
        scheduleNextPlayback(true);
      }
    }
  }, [getNextIndex]);

  // Schedule next playback with interval pause
  const scheduleNextPlayback = useCallback(
    (isNewItem: boolean) => {
      const pauseDuration = intervalRef.current;

      if (pauseDuration <= 0) {
        speakCurrentItem();
        return;
      }

      setIsWaitingInterval(true);
      setIntervalCountdown(pauseDuration);

      let remaining = pauseDuration;
      countdownIntervalRef.current = globalThis.setInterval(() => {
        remaining -= 1;
        setIntervalCountdown(remaining);
        if (remaining <= 0 && countdownIntervalRef.current) {
          globalThis.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }, 1000);

      timeoutTimerRef.current = setTimeout(() => {
        setIsWaitingInterval(false);
        setIntervalCountdown(0);
        if (isPlayingRef.current) {
          speakCurrentItem();
        }
      }, pauseDuration * 1000);
    },
    [speakCurrentItem]
  );

  // Play controls
  const play = useCallback(() => {
    if (!playlistRef.current.length) return;
    clearTimers();
    setIsPlaying(true);
    isPlayingRef.current = true;
    speakCurrentItem();
  }, [clearTimers, speakCurrentItem]);

  const pause = useCallback(() => {
    clearTimers();
    setIsPlaying(false);
    isPlayingRef.current = false;
    setIsSpeaking(false);
    stopSpeaking();
  }, [clearTimers]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const next = useCallback(() => {
    clearTimers();
    stopSpeaking();
    setRepeatCounter(1);
    repeatCounterRef.current = 1;
    const nextIdx = getNextIndex('next');
    setCurrentIndex(nextIdx);
    currentIndexRef.current = nextIdx;

    if (isPlayingRef.current) {
      speakCurrentItem();
    }
  }, [clearTimers, getNextIndex, speakCurrentItem]);

  const prev = useCallback(() => {
    clearTimers();
    stopSpeaking();
    setRepeatCounter(1);
    repeatCounterRef.current = 1;
    const prevIdx = getNextIndex('prev');
    setCurrentIndex(prevIdx);
    currentIndexRef.current = prevIdx;

    if (isPlayingRef.current) {
      speakCurrentItem();
    }
  }, [clearTimers, getNextIndex, speakCurrentItem]);

  const jumpToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= playlistRef.current.length) return;
      clearTimers();
      stopSpeaking();
      setRepeatCounter(1);
      repeatCounterRef.current = 1;
      setCurrentIndex(index);
      currentIndexRef.current = index;

      if (isPlayingRef.current) {
        speakCurrentItem();
      }
    },
    [clearTimers, speakCurrentItem]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      stopSpeaking();
    };
  }, [clearTimers]);

  return {
    playlist,
    updatePlaylist,
    appendPlaylist,
    currentIndex,
    currentItem: playlist[currentIndex] ?? null,
    isPlaying,
    isSpeaking,
    spokenCharIndex,
    isWaitingInterval,
    intervalCountdown,
    repeatCounter,
    loopMode,
    setLoopMode,
    repeatCount,
    setRepeatCount,
    interval: pauseInterval,
    setInterval: setPauseInterval,
    speed,
    setSpeed,
    showPinyin,
    setShowPinyin,
    showMeaning,
    setShowMeaning,
    play,
    pause,
    togglePlayPause,
    next,
    prev,
    jumpToIndex,
  };
}

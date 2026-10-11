import { useCallback, useEffect, useRef, useState } from 'react';
import { speakChineseWithRate, stopSpeaking } from '@/utils/tts';
import { LoopInterval, LoopItem, LoopMode, LoopRepeatCount, LoopSpeed } from '../types';

export function useListeningLoop(initialPlaylist: LoopItem[] = []) {
  const [playlist, setPlaylist] = useState<LoopItem[]>(initialPlaylist);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWaitingInterval, setIsWaitingInterval] = useState(false);
  const [intervalCountdown, setIntervalCountdown] = useState(0);
  const [repeatCounter, setRepeatCounter] = useState(1);

  // Loop settings
  const [loopMode, setLoopMode] = useState<LoopMode>('repeat-all');
  const [repeatCount, setRepeatCount] = useState<LoopRepeatCount>(2); // Default: repeat each 2x
  const [pauseInterval, setPauseInterval] = useState<LoopInterval>(2); // Default: 2s pause for shadowing
  const [speed, setSpeed] = useState<LoopSpeed>(0.85); // Default: 0.85x learner friendly

  // Visibility toggles
  const [showPinyin, setShowPinyin] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);

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
      },
      () => {
        setIsSpeaking(false);
        if (!isPlayingRef.current) return;

        handleItemFinished();
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

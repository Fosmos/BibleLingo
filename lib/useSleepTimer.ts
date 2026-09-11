"use client";

import { useEffect, useRef, useState } from "react";
import type { VerseSegment } from "@/types";
import { speakSleepTimerVerse } from "@/lib/speechSynthesis";

export interface SleepTimerState {
  isPlaying: boolean;
  currentVerse: VerseSegment | undefined;
  remainingSeconds: number;
  start: () => void;
  stop: () => void;
}

// How long before the timer ends the volume starts fading — 3 minutes, same as the feature's
// original spec. A duration shorter than this fades across its own ENTIRE length instead (see
// fadeVolume below), rather than staying at full volume the whole way through and just
// stopping — a 1-minute sleep timer should still wind down gently, not cut off mid-word.
const FADE_DURATION_S = 180;

// A LOGARITHMIC fade, not a linear one: human hearing perceives loudness on a roughly
// logarithmic scale, so a linear ramp from 1 down to 0 actually SOUNDS like it stays loud for
// most of the fade window and then drops off abruptly right at the very end — the opposite of
// "smooth." log10(1 + 9x) instead rises smoothly across the whole 0-1 input range
// (log10(1)=0 at x=0, log10(1+9)=log10(10)=1 at x=1), so the perceived volume decreases at a
// roughly constant RATE the whole way through instead of barely-then-suddenly.
function fadeVolume(remainingSeconds: number, totalSeconds: number): number {
  const fadeWindowSeconds = Math.min(FADE_DURATION_S, totalSeconds);
  if (remainingSeconds >= fadeWindowSeconds) return 1;
  const progress = Math.max(remainingSeconds, 0) / fadeWindowSeconds;
  return Math.log10(1 + 9 * progress);
}

// Drives SleepTimerView.tsx: cycles through `verses` (looping back to the start for as long
// as the timer still has time left — a genuinely dynamic, never-ending playlist rather than a
// fixed-length one that might run out early) via the Web Speech API, one verse-per-utterance
// (see lib/speechSynthesis.ts's speakSleepTimerVerse — the API has no way to change an
// utterance's OWN volume once it's already speaking, so the fade is recomputed fresh at every
// verse boundary instead of continuously). `endAtRef` — a real wall-clock deadline, not a
// counter decremented once a second — is what the fade and the final stop are actually judged
// against, so a slow verse or a background tab throttling timers never lets playback run past
// its own requested duration.
export function useSleepTimer(verses: VerseSegment[], durationMinutes: number): SleepTimerState {
  const totalSeconds = durationMinutes * 60;
  const [isPlaying, setIsPlaying] = useState(false);
  const [verseIndex, setVerseIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const cancelRef = useRef<() => void>(() => {});
  const endAtRef = useRef(0);
  // Guards a narrow race stop() alone can't: if a verse finishes naturally (firing its own
  // onEnd, which calls playVerse again) in the same tick stop() cancels the CURRENT
  // utterance, that recursive call would still queue up a brand-new one right after —
  // cancelRef would then point at that new, un-stopped utterance instead of doing nothing.
  // playVerse checks this before ever starting a new utterance, so a stop() that lands in
  // that exact window still wins.
  const stoppedRef = useRef(true);

  function stop() {
    stoppedRef.current = true;
    cancelRef.current();
    setIsPlaying(false);
  }

  function playVerse(index: number) {
    if (stoppedRef.current) return;
    const verse = verses[index % verses.length];
    const remaining = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
    if (!verse || remaining <= 0) {
      stop();
      return;
    }
    setVerseIndex(index % verses.length);
    cancelRef.current = speakSleepTimerVerse(verse.text, fadeVolume(remaining, totalSeconds), () => playVerse(index + 1));
  }

  function start() {
    if (verses.length === 0) return;
    stoppedRef.current = false;
    endAtRef.current = Date.now() + totalSeconds * 1000;
    setRemainingSeconds(totalSeconds);
    setIsPlaying(true);
    playVerse(0);
  }

  // The visible countdown — purely cosmetic (playVerse/stop above judge everything off
  // endAtRef directly), ticking once a second only while actually playing.
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Cancels any in-flight narration on unmount (navigating away mid-session) — otherwise the
  // engine keeps talking over whatever screen comes next.
  useEffect(() => () => cancelRef.current(), []);

  return { isPlaying, currentVerse: verses[verseIndex], remainingSeconds, start, stop };
}

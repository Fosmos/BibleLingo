"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isSpeechSynthesisSupported, speakWithWordBoundaries } from "@/lib/speechSynthesis";
import { tokenizeWithOffsets, wordIndexForCharIndex, type WordOffset } from "@/lib/verseWordOffsets";

export interface KineticTextSync {
  words: WordOffset[];
  // -1 before playback has ever started this stage; holds its last value once playback ends
  // (see play() below) rather than resetting, so the final word stays visibly highlighted.
  activeWordIndex: number;
  isPlaying: boolean;
  // False wherever the Web Speech API isn't available at all (see
  // lib/speechSynthesis.ts's isSpeechSynthesisSupported) — the caller falls back to a plain
  // "read it yourself" state with no Play button.
  isSupported: boolean;
  play: () => void;
  stop: () => void;
}

// Drives KineticTextRep's word-by-word highlight off the SAME SpeechSynthesisUtterance that's
// actually narrating `text` (see lib/speechSynthesis.ts's speakWithWordBoundaries) — real
// audio-driven sync, not a timer standing in for one. `text` is tokenized once with its own
// character offsets (lib/verseWordOffsets.ts), and every `onboundary` event during playback is
// mapped back to whichever word that offset falls inside. Not graded and never auto-advances —
// same "self-checked" precedent as DrawFirstLetterRep/VerseOrientationSummaryRep — so this
// hook only tracks playback state; the reader always presses their own Continue when ready.
export function useKineticTextSync(text: string): KineticTextSync {
  const words = useMemo(() => tokenizeWithOffsets(text), [text]);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const cancelRef = useRef<() => void>(() => {});
  const isSupported = isSpeechSynthesisSupported();

  function play() {
    if (!isSupported || words.length === 0) return;
    setActiveWordIndex(-1);
    setIsPlaying(true);
    cancelRef.current = speakWithWordBoundaries(
      text,
      (charIndex) => setActiveWordIndex(wordIndexForCharIndex(words, charIndex)),
      () => {
        setIsPlaying(false);
        setActiveWordIndex(words.length - 1);
      },
    );
  }

  function stop() {
    cancelRef.current();
    setIsPlaying(false);
  }

  // Cancels any in-flight narration if the reader navigates away mid-playback — otherwise the
  // engine keeps talking over whatever stage comes next.
  useEffect(() => () => cancelRef.current(), []);

  return { words, activeWordIndex, isPlaying, isSupported, play, stop };
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { tokenizeVerseWords } from "@/lib/verseWords";
import { senseLineWordRanges, type SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { fetchNarration } from "@/lib/cloudNarration";
import { narrateText } from "@/lib/narrateText";
import { isSecureContextOrLocal, isSpeechRecognitionSupported, requestMicPermission, startListening } from "@/lib/speechRecognition";
import { spokenPrefixMatchCount } from "@/lib/textMatch";
import { playCorrectSfx } from "@/lib/audio";

// idle: not started (a phone needs a tap before any audio). playing: the app is reading the
// current line. yourTurn: the reader says it back. done: every line heard and repeated.
export type ListenRepeatPhase = "idle" | "playing" | "yourTurn" | "done";
export type MicBlocked = "insecure" | "denied" | "unsupported";

function initialMicBlock(): MicBlocked | null {
  if (!isSpeechRecognitionSupported()) return "unsupported";
  return isSecureContextOrLocal() ? null : "insecure";
}

export interface ListenRepeat {
  ranges: SenseLineWordRange[];
  // tokenizeVerseWords(text) — every range's startIndex/endIndex index into this.
  words: string[];
  clauseIndex: number;
  phase: ListenRepeatPhase;
  // The word being read aloud right now (an index into `words`), or -1.
  narratedWord: number;
  // How many of the current line's words the reader has said back so far.
  repeatedCount: number;
  // The mic is listening for the reader (false: they say it aloud and tap Next themselves).
  micListening: boolean;
  // Why the mic can't listen at all, if it can't: no https (a phone on the local network), the
  // reader declined it, or the browser has no speech recognition.
  micBlocked: MicBlocked | null;
  start: () => void;
  hearAgain: () => void;
  next: () => void;
}

// A silent sound played during the Start tap: an audio element played once from a tap may then
// play again on its own, which is what lets each following line start by itself on a phone.
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

// A pause between a line said back and the next one being read, so it doesn't feel rushed.
const NEXT_LINE_DELAY_MS = 500;

// Words a line may be short of and still count as said: a longer line forgives one misheard word.
const allowedMisses = (wordCount: number) => (wordCount >= 5 ? 1 : 0);

// Where in `text` each of its `words` starts — narration reports character positions.
function wordStarts(text: string, words: string[]): number[] {
  let cursor = 0;
  return words.map((word) => {
    const at = text.indexOf(word, cursor);
    cursor = at === -1 ? cursor : at + word.length;
    return at === -1 ? cursor : at;
  });
}

// Listen & Repeat (ListenVerseRep.tsx): the verse's sense lines one at a time — each read aloud
// with its words lit as they're heard, then said back by the reader, the mic lighting each word
// as it's recognized and moving on once the line is said. Without a usable mic (no speech
// recognition, or a phone on plain http) the reader says it aloud and taps Next.
export function useListenRepeat(text: string): ListenRepeat {
  const ranges = useMemo(() => senseLineWordRanges(text), [text]);
  const words = useMemo(() => tokenizeVerseWords(text), [text]);
  const [clauseIndex, setClauseIndex] = useState(0);
  const [phase, setPhase] = useState<ListenRepeatPhase>("idle");
  const [narratedWord, setNarratedWord] = useState(-1);
  const [repeatedCount, setRepeatedCount] = useState(0);
  const [micListening, setMicListening] = useState(false);
  const [micBlocked, setMicBlocked] = useState<MicBlocked | null>(null);
  const micBlockedRef = useRef<MicBlocked | null>(null);
  const blockMic = (reason: MicBlocked | null) => {
    micBlockedRef.current = reason;
    setMicBlocked(reason);
  };
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const cancelRef = useRef<() => void>(() => {});

  // Every line's narration fetched up front, so each plays the moment its turn comes.
  useEffect(() => {
    for (const range of ranges) void fetchNarration(range.clause.text);
  }, [ranges]);
  useEffect(() => () => cancelRef.current(), []);

  function playLine(index: number) {
    cancelRef.current();
    const range = ranges[index];
    if (!range) return;
    setClauseIndex(index);
    setPhase("playing");
    setNarratedWord(-1);
    setRepeatedCount(0);
    setMicListening(false);
    const starts = wordStarts(range.clause.text, words.slice(range.startIndex, range.endIndex));
    const onWord = (charIndex: number) => {
      let offset = 0;
      starts.forEach((start, i) => {
        if (start <= charIndex) offset = i;
      });
      setNarratedWord(range.startIndex + offset);
    };
    cancelRef.current = narrateText(range.clause.text, onWord, () => yourTurn(index), playerRef.current ?? undefined);
  }

  function yourTurn(index: number) {
    const range = ranges[index];
    setNarratedWord(-1);
    setPhase("yourTurn");
    // Straight into listening once the line has been read — unless the mic can't be used.
    if (micBlockedRef.current) return;
    const target = words.slice(range.startIndex, range.endIndex);
    let finished = false;
    const listener = startListening(
      (transcript) => {
        if (finished) return;
        const said = spokenPrefixMatchCount(transcript, target);
        setRepeatedCount((prev) => Math.max(prev, said));
        if (said < target.length - allowedMisses(target.length)) return;
        finished = true;
        listener.stop();
        setRepeatedCount(target.length);
        setMicListening(false);
        playCorrectSfx();
        const timer = setTimeout(() => advanceFrom(index), NEXT_LINE_DELAY_MS);
        cancelRef.current = () => clearTimeout(timer);
      },
      (kind) => {
        setMicListening(false);
        if (kind === "denied") blockMic("denied");
      },
    );
    listener.transcriptPromise.catch(() => {}).finally(() => setMicListening(false));
    setMicListening(true);
    cancelRef.current = () => {
      finished = true;
      listener.stop();
    };
  }

  function advanceFrom(index: number) {
    if (index + 1 < ranges.length) {
      playLine(index + 1);
      return;
    }
    cancelRef.current();
    setPhase("done");
    setMicListening(false);
  }

  return {
    ranges,
    words,
    clauseIndex,
    phase,
    narratedWord,
    repeatedCount,
    micListening,
    micBlocked,
    start: () => {
      // Asked for inside the tap, so the mic can then switch on by itself after every line.
      const blocked = initialMicBlock();
      blockMic(blocked);
      if (!blocked) void requestMicPermission().then((state) => state === "denied" && blockMic("denied"));
      if (!playerRef.current) {
        playerRef.current = new Audio(SILENT_WAV);
        playerRef.current.play().catch(() => {});
      }
      playLine(0);
    },
    hearAgain: () => playLine(clauseIndex),
    next: () => advanceFrom(clauseIndex),
  };
}

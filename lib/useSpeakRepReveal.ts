import { useMemo, useRef, useState } from "react";
import { buildDrawTokens } from "@/lib/verseDrawTokens";
import { spokenLenientPrefixCountFirstLetter, spokenPrefixMatchCount, spokenPrefixMatchCountFirstLetter } from "@/lib/textMatch";

export interface SpeakRepReveal {
  revealedCount: number;
  total: number;
  reset: () => void;
  // A new listen carries on from the words already recognized instead of starting over.
  resume: () => void;
  // Returns the new count.
  onTranscript: (transcript: string) => number;
}

// Tracks how many of targetText's own words have been recognized so far in a live speech
// transcript, monotonically (a later transcript revision never lowers the count) — drives
// SpeakRepRevealLine.tsx's word-by-word fill. See lib/textMatch.ts's spokenPrefixMatchCount for
// the matching itself. Split out of SpeakRep.tsx purely to keep that file under this codebase's
// 200-line cap. targetWords excludes verse-reference tokens (e.g. "3:16") the same way
// SpeakRepRevealLine's own token loop does, so the two stay in lockstep index-for-index.
// `gradeByFirstLetter` swaps in the first-letter matcher, so a word reveals the instant its first
// letter is heard. Each listen (`resume`) matches only the words still to come, so stopping and
// starting again never loses what's been said. `lenient` (the say-it ladder) lets the run skip
// a missed word (lib/textMatch.ts's spokenLenientPrefixCountFirstLetter).
export function useSpeakRepReveal(targetText: string, gradeByFirstLetter: boolean, lenient = false): SpeakRepReveal {
  const [revealedCount, setRevealedCount] = useState(0);
  const countRef = useRef(0);
  const baseRef = useRef(0);
  const targetWords = useMemo(
    () => buildDrawTokens(targetText, {}).filter((token) => token.kind === "word" && !token.isReference).map((token) => token.text),
    [targetText],
  );
  const matchCount = lenient ? spokenLenientPrefixCountFirstLetter : gradeByFirstLetter ? spokenPrefixMatchCountFirstLetter : spokenPrefixMatchCount;
  const set = (count: number) => {
    countRef.current = count;
    setRevealedCount(count);
  };
  return {
    revealedCount,
    total: targetWords.length,
    reset: () => {
      baseRef.current = 0;
      set(0);
    },
    resume: () => {
      baseRef.current = countRef.current;
    },
    onTranscript: (transcript: string) => {
      const base = baseRef.current;
      const next = Math.max(countRef.current, base + matchCount(transcript, targetWords.slice(base)));
      set(next);
      return next;
    },
  };
}

import { useMemo, useState } from "react";
import { buildDrawTokens } from "@/lib/verseDrawTokens";
import { spokenPrefixMatchCount, spokenPrefixMatchCountFirstLetter } from "@/lib/textMatch";

export interface SpeakRepReveal {
  revealedCount: number;
  reset: () => void;
  onTranscript: (transcript: string) => void;
}

// Tracks how many of targetText's own words have been recognized so far in a live speech
// transcript, monotonically (a later transcript revision never lowers the count) — drives
// SpeakRepRevealLine.tsx's word-by-word fill. See lib/textMatch.ts's spokenPrefixMatchCount for
// the matching itself. Split out of SpeakRep.tsx purely to keep that file under this codebase's
// 200-line cap. targetWords excludes verse-reference tokens (e.g. "3:16") the same way
// SpeakRepRevealLine's own token loop does, so the two stay in lockstep index-for-index.
// `gradeByFirstLetter` (see useSpeakRepMic.ts's own doc comment) swaps in the first-letter
// counterpart matcher, so a word visibly reveals under the SAME criterion the finished attempt
// gets graded by — never "correct at the end" without ever having visibly filled in.
export function useSpeakRepReveal(targetText: string, gradeByFirstLetter: boolean): SpeakRepReveal {
  const [revealedCount, setRevealedCount] = useState(0);
  const targetWords = useMemo(
    () => buildDrawTokens(targetText, {}).filter((token) => token.kind === "word" && !token.isReference).map((token) => token.text),
    [targetText],
  );
  const matchCount = gradeByFirstLetter ? spokenPrefixMatchCountFirstLetter : spokenPrefixMatchCount;
  return {
    revealedCount,
    reset: () => setRevealedCount(0),
    onTranscript: (transcript: string) => setRevealedCount((prev) => Math.max(prev, matchCount(transcript, targetWords))),
  };
}

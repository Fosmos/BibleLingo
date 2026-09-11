"use client";

import { useState } from "react";

interface MistakeLetterHintProps {
  expectedLetter: string;
  // True (every caller except SRS review's real verse pass) shows the correct letter
  // immediately on a mistake — a helpful hint while still learning. False shows only a
  // generic "wrong" message until the reader taps "Reveal letter" themselves — a review is
  // meant to test recall, not hand it over. Either way the mistake already counts against
  // accuracy the moment it happens (see FirstLetterTypeRep's wrongWordIndices), so asking
  // for the letter afterward doesn't add a second penalty — the word's already flagged wrong.
  autoReveal: boolean;
  // Fires the instant the letter actually becomes visible — SRS review's own signal that this
  // word genuinely needed to be revealed, not just mistyped once and self-corrected (see
  // lib/useFirstLetterTyping.ts's own markHintUsed / VerseAccuracy.neededHint). Undefined for
  // every other caller, which doesn't track Problem Verses at all.
  onReveal?: () => void;
}

// The caller mounts this with `key={wordIndex}` (see FirstLetterTypeRep) so `revealed` starts
// fresh for each new word — asking for one word's letter never leaves the next word's hint
// sitting unlocked too.
export function MistakeLetterHint({ expectedLetter, autoReveal, onReveal }: MistakeLetterHintProps) {
  const [revealed, setRevealed] = useState(false);

  if (autoReveal || revealed) {
    return (
      <p className="text-sm font-medium text-heart-600">
        Not quite — the next word starts with &quot;{expectedLetter}&quot;.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-heart-600">Not quite — try again.</p>
      <button
        type="button"
        onClick={() => {
          setRevealed(true);
          onReveal?.();
        }}
        className="self-start text-sm font-medium text-brand-600 hover:underline"
      >
        Reveal letter
      </button>
    </div>
  );
}

"use client";

interface ReviewChainHintProps {
  firstLetter: string | undefined;
  hintLetterShown: boolean;
  onShowLetter: () => void;
  onRevealWord: () => void;
}

// ReviewChain.tsx's own two-step hint escalation, split out purely to keep that file under
// this codebase's 200-line cap — reveal just the next letter first (still requires clicking
// through to reveal the word), rather than jumping straight to the word.
export function ReviewChainHint({ firstLetter, hintLetterShown, onShowLetter, onRevealWord }: ReviewChainHintProps) {
  if (!hintLetterShown) {
    return (
      <button type="button" onClick={onShowLetter} className="text-sm font-medium text-brand-600 hover:underline">
        Reveal next letter
      </button>
    );
  }

  return (
    <>
      <span className="text-sm text-ink-muted">Hint: &quot;{firstLetter}&quot;</span>
      <button type="button" onClick={onRevealWord} className="text-sm font-medium text-brand-600 hover:underline">
        Reveal word
      </button>
    </>
  );
}

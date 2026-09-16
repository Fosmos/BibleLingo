"use client";

interface ReviewChainHintProps {
  onRevealWord: () => void;
}

// ReviewChain.tsx's own hint action, split out purely to keep that file under this codebase's
// 200-line cap — a single "Reveal word" action (no intermediate letter-hint step), a mistake
// already costs accuracy the moment it happens, so asking for the word doesn't add a second
// penalty of its own.
export function ReviewChainHint({ onRevealWord }: ReviewChainHintProps) {
  return (
    <button type="button" onClick={onRevealWord} className="text-sm font-medium text-brand-600 hover:underline">
      Reveal word
    </button>
  );
}

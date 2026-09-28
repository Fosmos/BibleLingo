import { AlertTriangle } from "lucide-react";

// The "problem verse" mark — a small orange seal on a verse chip's top-right corner (the
// memorized check takes the bottom-right) for a verse the reader had to peek at while reviewing
// it (see lib/flagPeekedVerse.ts), the same verses as Memorized > Problem Verses. The parent must
// be positioned and must not clip its own overflow.
export function MindMapProblemMark() {
  return (
    <span
      aria-label="Problem verse — you needed a hint in review"
      title="Problem verse"
      className="pointer-events-none absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full border border-white bg-orange-500 text-white shadow-sm dark:border-zinc-900"
    >
      <AlertTriangle size={7} strokeWidth={3} />
    </span>
  );
}

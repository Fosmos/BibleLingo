import { splitWordPunctuation } from "@/lib/verseWords";

export type HiddenWordTone = "pending" | "target" | "error" | "filled";

interface HiddenWordProps {
  word: string;
  // Shows the word's first letter, the rest still hidden (first-letter stages).
  firstLetter?: boolean;
  // Shows the word's last letter (the Last letters stage) — never on a one-letter word, where it
  // would be the answer.
  lastLetter?: boolean;
  // The underline: waiting (sand), the word asked for now (terracotta), a wrong try (red); filled
  // is a first letter already typed (terracotta letter, faint line).
  tone?: HiddenWordTone;
}

const LINE: Record<HiddenWordTone, string> = {
  pending: "border-sand-400 dark:border-zinc-600",
  target: "border-brand-500",
  error: "border-heart-500",
  filled: "border-sand-300 dark:border-zinc-700",
};

// A word a lesson stage is hiding: its punctuation stays, and its letters keep their exact width
// over an underline, so the reader can see how long the word is — "F___ G__ h__ d___," — with
// the first letter showing on a first-letter stage, and the last on the Last letters stage. `indent-0`: an inline-block would otherwise
// re-apply SenseLineRow.tsx's hanging `-indent-5` to its own text.
export function HiddenWord({ word, firstLetter = false, lastLetter = false, tone = "pending" }: HiddenWordProps) {
  const { lead, core, trail } = splitWordPunctuation(word);
  if (!core) return <>{word}</>;
  const showFirst = firstLetter;
  const showLast = lastLetter && core.length > 1;
  const middle = core.slice(showFirst ? 1 : 0, showLast ? -1 : undefined);
  return (
    <>
      {lead}
      <span className={`inline-block whitespace-nowrap border-b-2 indent-0 leading-[1.15] ${LINE[tone]}`}>
        {showFirst && <span className={tone === "filled" ? "text-brand-700 dark:text-brand-300" : ""}>{core[0]}</span>}
        <span className="invisible" aria-hidden="true">
          {middle}
        </span>
        {showLast && <span>{core[core.length - 1]}</span>}
      </span>
      {trail}
    </>
  );
}

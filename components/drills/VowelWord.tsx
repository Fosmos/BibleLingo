import type { HiddenWordTone } from "@/components/drills/HiddenWord";

export const VOWEL = /[aeiou]/i;

interface VowelWordProps {
  word: string;
  // The vowel slot (counted across the whole passage) this word's first vowel is.
  firstSlot: number;
  // How many slots are typed in so far, and the one asked for now (undefined while none is).
  filledCount: number;
  targetSlot: number | undefined;
  showError: boolean;
}

const LINE: Record<HiddenWordTone, string> = {
  pending: "border-sand-400 dark:border-zinc-600",
  target: "border-brand-500",
  error: "border-heart-500",
  filled: "border-sand-300 dark:border-zinc-700",
};

// A word on the Fill in the vowels stage: its consonants and punctuation show, each vowel a blank
// its own slot over an underline — "F_r G_d s_ l_v_d" — filled in as it's typed. Each slot is at
// least a letter wide with a hair of room either side, so two vowels in a row read as two blanks,
// and words sit a wider space apart, so it's clear which word each blank belongs to.
// `indent-0`: an inline-block would otherwise re-apply SenseLineRow.tsx's hanging indent.
export function VowelWord({ word, firstSlot, filledCount, targetSlot, showError }: VowelWordProps) {
  let slot = firstSlot;
  return (
    <span className="mr-[0.45em] whitespace-nowrap">
      {[...word].map((character, index) => {
        if (!VOWEL.test(character)) return <span key={index}>{character}</span>;
        const current = slot++;
        const filled = current < filledCount;
        const tone: HiddenWordTone = filled ? "filled" : current === targetSlot ? (showError ? "error" : "target") : "pending";
        return (
          <span key={index} className={`mx-[0.14em] inline-block min-w-[0.72em] border-b-2 text-center indent-0 leading-[1.15] ${LINE[tone]}`}>
            <span className={filled ? "text-brand-700 dark:text-brand-300" : "invisible"} aria-hidden={!filled}>
              {character}
            </span>
          </span>
        );
      })}
    </span>
  );
}

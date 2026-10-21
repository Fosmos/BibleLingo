import { HiddenWord } from "@/components/drills/HiddenWord";

interface WordSlot {
  word: string;
  globalIndex: number;
}

interface ReviewChainVerseWordsProps {
  words: WordSlot[]; // this verse's own words, each still carrying its position in the whole chain
  revealedCount: number; // how many words, from the very start of the WHOLE chain, are revealed
  // The progressive hint on the word being typed (ReviewHintButton.tsx): 1 shows its pill, 2 its first letter too.
  hintLevel?: number;
}

// One verse's own words within ReviewChain.tsx's combine stage, inline — used only when
// ReviewChain renders on the Learn flow's own real reading-view page (see
// ReviewChainParchment.tsx/LessonPageCard.tsx), so a neighbor's already-printed text and this
// verse's own not-yet-typed words read as ONE continuous page rather than the separate,
// individually-boxed per-verse lines ReviewChainRevealed.tsx uses for every other caller. No
// verse-number sup here — ChapterVerseRun.tsx already renders that verse's own real number
// unconditionally.
export function ReviewChainVerseWords({ words, revealedCount, hintLevel = 0 }: ReviewChainVerseWordsProps) {
  return (
    <>
      {words.map((slot) => {
        const hinted = slot.globalIndex === revealedCount && hintLevel > 0;
        const tone = slot.globalIndex < revealedCount ? "filled" : hinted ? "target" : "pending";
        return (
          <span key={slot.globalIndex}>
            <HiddenWord word={slot.word} firstLetter={slot.globalIndex < revealedCount || (hinted && hintLevel >= 2)} tone={tone} />{" "}
          </span>
        );
      })}
    </>
  );
}

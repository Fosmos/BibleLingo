import type { VerseSegment } from "@/types";
import { tokenizeVerseWords } from "@/lib/verseWords";
import type { ChapterReadingLayout } from "@/lib/useChapterReadingLayout";
import type { SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { ReviewChainRevealed } from "@/components/drills/ReviewChainRevealed";
import { ReviewChainVerseWords } from "@/components/drills/ReviewChainVerseWords";
import { VerseReferenceHeader } from "@/components/ui/VerseReferenceHeader";
import { LessonPageCard } from "@/components/gamification/LessonPageCard";

interface CombinedWord {
  word: string;
  verseIndex: number;
}

interface WordSlot {
  word: string;
  globalIndex: number;
}

// This verse's own words, in order, each carrying its position in the WHOLE chain — the slice
// ReviewChainVerseWords.tsx needs to know which of its own words are revealed yet.
function wordsForVerse(combinedWords: CombinedWord[], verseIndex: number): WordSlot[] {
  return combinedWords.reduce<WordSlot[]>((acc, entry, globalIndex) => {
    if (entry.verseIndex === verseIndex) acc.push({ word: entry.word, globalIndex });
    return acc;
  }, []);
}

interface ReviewChainParchmentProps {
  verses: VerseSegment[];
  combinedWords: CombinedWord[];
  revealedCount: number;
  currentVerse: VerseSegment | null;
  // The reading view's own real page layout (see lib/useChapterReadingLayout.ts) — when set,
  // `verses` render inline on that SAME real page (see LessonPageCard.tsx), every one of them
  // "active" (filling in together) at once, instead of the standalone "Now in: X:Y" + per-verse-
  // line layout below (still used wherever this isn't set, e.g. DaySessionController.tsx's own
  // chapter_review usage).
  layout?: ChapterReadingLayout;
}

// ReviewChain.tsx's own parchment content, split out purely to keep that file under this
// codebase's 200-line cap.
export function ReviewChainParchment({ verses, combinedWords, revealedCount, currentVerse, layout }: ReviewChainParchmentProps) {
  const verseIds = new Set(verses.map((verse) => verse.id));
  // How far into `currentVerse` ITSELF (not the whole chain) recall currently is —
  // disambiguates which page a verse split across the page break should open to (see
  // lib/chapterPagination.ts's pageIndexForVerse), same as FirstLetterMultiVersePageCard.tsx's
  // own identical math.
  const currentVerseIndex = currentVerse ? verses.findIndex((verse) => verse.id === currentVerse.id) : -1;
  const currentVerseWordOffset = currentVerseIndex >= 0 ? (wordsForVerse(combinedWords, currentVerseIndex)[0]?.globalIndex ?? 0) : 0;
  const activeWordIndex = Math.max(revealedCount - currentVerseWordOffset, 0);

  return (
    <>
      {/* No "Now in: X:Y" caption in `layout` mode — it's unmeasured chrome between bodyTopRef
          and the card (pushing the page past one viewport, see useParchmentFillHeight.ts), and
          the real page already shows which verse is live via its own number/highlight, exactly
          like the Learn flow. The standalone layout still gets the header. */}
      {currentVerse && !layout && (
        <VerseReferenceHeader
          book={currentVerse.book}
          chapter={currentVerse.chapter}
          verseNumber={currentVerse.verseNumber}
          reference={`Now in: ${currentVerse.reference}`}
          compact
        />
      )}
      {layout ? (
        <LessonPageCard
          layout={layout}
          activeVerse={currentVerse ?? verses[verses.length - 1]}
          activeWordIndex={activeWordIndex}
          isActive={(verse) => verseIds.has(verse.id)}
          renderActiveVerse={(verse, range: SenseLineWordRange) => {
            // `verse` is whatever this real PAGE actually holds — the whole verse, or (see
            // lib/chapterPagination.ts) just one fragment of it, if it was split across the
            // page break. Slice this verse's own chain words down to just the fragment's own
            // range (`wordOffset` on, for as many words as the fragment's own text tokenizes
            // to) so a split verse's later half doesn't repeat words its earlier half already
            // showed on the page before it — then down again to just THIS clause's own
            // [range.startIndex, range.endIndex), called once per clause (see
            // LessonPageCard.tsx's own renderActiveVerse doc comment) so a multi-clause verse
            // still renders through the same hanging-indent line structure a non-active verse
            // gets, not the whole fragment repeated on every clause row.
            const verseIndex = verses.findIndex((candidate) => candidate.id === verse.id);
            const fragmentStart = verse.wordOffset ?? 0;
            const fragmentWordCount = tokenizeVerseWords(verse.text).length;
            const fragmentWords = wordsForVerse(combinedWords, verseIndex)
              .slice(fragmentStart, fragmentStart + fragmentWordCount)
              .slice(range.startIndex, range.endIndex);
            return <ReviewChainVerseWords words={fragmentWords} revealedCount={revealedCount} />;
          }}
          isVerseNumberVisible={(verse) => {
            // Shown once every word before this verse is revealed (the previous verse's last
            // word just recalled). A verse not in this chain (idx -1) always shows its number.
            const verseIndex = verses.findIndex((candidate) => candidate.id === verse.id);
            if (verseIndex < 0) return true;
            const firstWord = wordsForVerse(combinedWords, verseIndex)[0];
            return firstWord === undefined || firstWord.globalIndex <= revealedCount;
          }}
        />
      ) : (
        <ReviewChainRevealed verses={verses} combinedWords={combinedWords} revealedCount={revealedCount} />
      )}
    </>
  );
}

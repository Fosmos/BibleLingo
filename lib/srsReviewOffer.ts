import type { MemorizedEntity } from "@/types";
import { isDue } from "@/lib/srs";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import type { RelearnTarget } from "@/lib/relearnTarget";

// A review the Mind Map offers for a tapped verse or chapter (see MindMapReviewTab.tsx).
export interface SrsReviewOffer {
  // "Verse" or "Chapter" — the tab's caption.
  scope: "verse" | "chapter";
  label: string;
  // The ranges to review, in verse order (see InPlaceSrsReview.tsx).
  entityIds: string[];
  // Nothing in it is due yet — reviewing now is an early review.
  early: boolean;
  // What "Relearn" runs the full Learn flow over again (InPlaceRelearnSession.tsx): the whole
  // lesson the tapped verse was learned in, or a chapter's whole memorized stretch.
  relearn: RelearnTarget;
  // A tapped verse inside a multi-verse relearn: offered on its own too ("just v3").
  relearnVerse?: number;
}

// The verses a lesson taught, when the tapped verse was learned as part of one.
export interface LessonRange {
  startVerse: number;
  endVerse: number;
}

// A tapped verse offers its review only once it's due; it's the chapter that allows an early one.
// Relearning covers the whole multi-verse lesson the verse was learned in (`lesson`), or failing
// that the range it's reviewed as — with the tapped verse alone as a second option.
export function verseReviewOffer(entities: MemorizedEntity[], book: string, chapter: number, verseNumber: number, lesson?: LessonRange): SrsReviewOffer | null {
  const holder = entities.find(
    (entity) => entity.book === book && entity.chapter === chapter && verseNumber >= entity.startVerse && verseNumber <= entity.endVerse,
  );
  if (!holder || !isDue(holder.srs)) return null;
  return {
    scope: "verse",
    label: formatVerseSpanLabel(holder.book, holder.chapter, holder.startVerse, holder.endVerse),
    entityIds: [holder.id],
    early: false,
    relearn: { book, chapter, ...(lesson ?? { startVerse: holder.startVerse, endVerse: holder.endVerse }), version: holder.version },
    relearnVerse: (lesson ?? holder).startVerse !== (lesson ?? holder).endVerse ? verseNumber : undefined,
  };
}

// A tapped chapter offers every range memorized in it, due or not — the due ones first, so an
// early review still starts where it's most needed.
export function chapterReviewOffer(entities: MemorizedEntity[], book: string, chapter: number): SrsReviewOffer | null {
  const inChapter = entities.filter((entity) => entity.book === book && entity.chapter === chapter).sort((a, b) => a.startVerse - b.startVerse);
  if (inChapter.length === 0) return null;
  const due = inChapter.filter((entity) => isDue(entity.srs));
  const rest = inChapter.filter((entity) => !isDue(entity.srs));
  const relearn = {
    book,
    chapter,
    startVerse: inChapter[0].startVerse,
    endVerse: Math.max(...inChapter.map((entity) => entity.endVerse)),
    version: inChapter[0].version,
  };
  return { scope: "chapter", label: `${book} ${chapter}`, entityIds: [...due, ...rest].map((entity) => entity.id), early: due.length === 0, relearn };
}

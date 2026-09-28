import type { MemorizationDay } from "@/types";
import type { LessonFocusVerse } from "@/store/useLessonSessionStore";
import type { VerseLessonAction } from "@/lib/verseLessonAction";
import { singleVersePathHref } from "@/lib/singleVersePath";
import type { RelearnTarget } from "@/lib/relearnTarget";

// Either a page to go to, or verses to relearn in the sheet.
interface SecondaryAction {
  label: string;
  href?: string;
  relearn?: RelearnTarget;
}

// The Mind Map verse preview's second, smaller action (MindMapVersePreview.tsx's `secondary`):
// "Learn just vN" for a verse still to learn inside a multi-verse lesson, or — once the lesson is
// learned — "Relearn" to run that same lesson's full Learn flow again, in the sheet
// (InPlaceRelearnSession.tsx).
export function versePreviewSecondary(
  tapped: LessonFocusVerse | undefined,
  lessonDay: MemorizationDay | undefined,
  action: VerseLessonAction | null,
  canLearnSingleVerse: boolean,
  version: string,
): SecondaryAction | undefined {
  if (!tapped) return undefined;
  if (canLearnSingleVerse) {
    return { label: `Learn just v${tapped.verseNumber}`, href: singleVersePathHref(tapped.book, tapped.chapter, tapped.verseNumber, version) };
  }
  const verses = lessonDay?.newVerses.filter((verse) => verse.book === tapped.book && verse.chapter === tapped.chapter) ?? [];
  if (action?.mode !== "practice" || verses.length === 0) return undefined;
  const first = verses[0].verseNumber;
  const last = verses[verses.length - 1].verseNumber;
  return { label: first === last ? "Relearn" : `Relearn v${first}–${last}`, relearn: { book: tapped.book, chapter: tapped.chapter, startVerse: first, endVerse: last, version } };
}

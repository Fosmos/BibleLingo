import type { VerseSegment } from "@/types";
import type { ChapterPage } from "@/lib/chapterPagination";

// LessonPageCard.tsx's own portal branch — the in-place Mind Map lesson sheet renders NO
// pagination at all, just this stage's own real verses directly, so this builds the one-off
// single-segment "page" ChapterPageContent.tsx still expects without ever consulting
// `layout.pages`. No heading/label (the embedded card shows neither).
export function buildEmbeddedChapterPage(verses: VerseSegment[]): ChapterPage {
  return {
    segments: [
      {
        key: "embedded",
        label: "",
        heading: "",
        book: verses[0].book,
        chapter: verses[0].chapter,
        startVerse: verses[0].verseNumber,
        endVerse: verses[verses.length - 1].verseNumber,
        verses,
      },
    ],
  };
}

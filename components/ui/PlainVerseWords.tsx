import type { VerseSegment } from "@/types";

interface PlainVerseWordsProps {
  verse: VerseSegment;
}

// One verse's own superscript-number-plus-text, inline — the same treatment a plain verse
// gets on the Path screen's own reading view (see ChapterVerseRun.tsx), stripped down to
// just the number+text (no tap-to-open, no location/peg/icon markers, none of which make
// sense mid-lesson). Shared by VerseContextLine.tsx (a single context verse on its own line)
// and LessonVerseContext.tsx (every non-active verse flowing inline in the same paragraph as
// the one actually being drilled) — the one place this exact look is defined, so a verse
// reads identically whether it's on the reading page, sitting as context around an active
// drill, or the active verse itself once a stage reveals it in full.
export function PlainVerseWords({ verse }: PlainVerseWordsProps) {
  return (
    <>
      <sup className="mr-0.5 text-[0.7em] font-semibold text-ink-muted dark:text-zinc-500">{verse.verseNumber}</sup>
      {verse.text}{" "}
    </>
  );
}

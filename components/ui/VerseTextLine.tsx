interface VerseTextLineProps {
  chapter: number;
  verseNumber: number;
}

// Just the "chapter:verse " prefix, not a wrapping <p> — meant to be dropped in as the first
// child of whatever paragraph/flex container already renders the verse being learned/worked
// on's own text, so it works whether that's a plain string or (as in RhythmRep.tsx) a row of
// individually-styled word spans. Purely decorative (independent of the
// includeVerseReferences settings toggle, which bakes the reference INTO verse.text itself
// for typing/matching purposes elsewhere) — same small bold-prefix treatment
// VerseContextLine.tsx already gives a neighboring verse, just in the foreground text color
// instead of muted, so a prev/current/next sandwich reads as three consistently-labeled
// lines instead of two labeled ones around a bare one.
export function VerseTextLine({ chapter, verseNumber }: VerseTextLineProps) {
  return (
    <span className="font-semibold text-ink-muted dark:text-zinc-500">
      {chapter}:{verseNumber}{" "}
    </span>
  );
}

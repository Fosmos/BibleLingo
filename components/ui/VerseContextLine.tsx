import type { VerseSegment } from "@/types";

interface VerseContextLineProps {
  verse: VerseSegment;
}

// A single previous/next-verse context line shown directly around a drill's own verse
// text — the reference is bolded so it's identifiable at a glance without competing with
// the verse actually being worked on, which stays the only full-size text on screen.
// Chapter:verse only (not verse.reference's full "Book Chapter:Verse") since the book is
// already established by the verse currently being worked on.
export function VerseContextLine({ verse }: VerseContextLineProps) {
  return (
    <p className="text-lg leading-relaxed text-ink-muted dark:text-zinc-600">
      <span className="font-semibold">
        {verse.chapter}:{verse.verseNumber}
      </span>{" "}
      {verse.text}
    </p>
  );
}

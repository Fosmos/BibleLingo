interface VerseNumberMarkerProps {
  number: number;
  // Lets a stage that steps through this segment token-by-token (e.g. DrawFirstLetterRep)
  // override the default muted look with its own current/past/future state styling.
  className?: string;
}

// Inline verse-number marker shown wherever a new verse starts within a multi-verse joined
// segment (see lib/verseBatching.ts's verseNumberMarkers) — matches VerseTextLine's muted
// styling so it reads as the same kind of navigational cue, not memorization content.
export function VerseNumberMarker({ number, className }: VerseNumberMarkerProps) {
  return <span className={className ?? "font-semibold text-ink-muted dark:text-zinc-500"}>{number}</span>;
}

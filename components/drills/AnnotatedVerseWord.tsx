import { themeForAnnotation, type WordAnnotation } from "@/lib/verseHighlights";

interface AnnotatedVerseWordProps {
  word: string;
  annotation?: WordAnnotation;
  // Extra classes this word needs from its own stage (current-word ring, italic, underline,
  // bold, etc.) — merged alongside the annotation's own role tint.
  className?: string;
}

// A single verse word, optionally tinted with the clause role it belongs to (see
// lib/verseHighlights.ts) — reused everywhere this verse's words are shown across the Learn
// flow so a role assigned in Orientation stays visible for the rest of the lesson. Read-only:
// the role itself is only ever assigned at the clause level, in the Orientation stage (see
// VerseOrientationRep.tsx).
export function AnnotatedVerseWord({ word, annotation, className = "" }: AnnotatedVerseWordProps) {
  const theme = themeForAnnotation(annotation);
  return <span className={`${theme ? `${theme.washClassName} rounded px-0.5` : ""} ${className}`}>{word}</span>;
}

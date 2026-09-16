import type { VerseSegment } from "@/types";
import { PlainVerseWords } from "@/components/ui/PlainVerseWords";

interface VerseContextLineProps {
  verse: VerseSegment;
}

// A single previous/next-verse context line on its own — same superscript-number treatment
// as a plain verse on the reading page (see PlainVerseWords.tsx), just wrapped as its own
// paragraph rather than flowing inline. Used wherever only one neighboring verse needs
// showing on its own, outside a full LessonVerseContext run.
export function VerseContextLine({ verse }: VerseContextLineProps) {
  return (
    <p className="font-serif text-lg leading-loose text-ink-muted dark:text-zinc-500">
      <PlainVerseWords verse={verse} />
    </p>
  );
}

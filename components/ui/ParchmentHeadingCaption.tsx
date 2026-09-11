interface ParchmentHeadingCaptionProps {
  // The pericope this stage's own verse(s) open, if any — undefined wherever pericope data
  // isn't cached yet, or this content doesn't open a new section at all. Renders nothing in
  // that case, same "decorative, never blocking" convention every other pericope consumer in
  // this codebase follows.
  heading?: string;
}

// The ONE small-caps caption every Learn/Review stage's own parchment shows a pericope heading
// with — the exact same treatment the Path screen's own reading view uses (see
// ChapterPageContent.tsx) — pulled out into its own component so every stage that shows a
// heading on its own parchment (not just the ones reading a real reading-view page via
// LessonPageCard.tsx) renders the identical look rather than a hand-copied, driftable
// duplicate of this same markup.
export function ParchmentHeadingCaption({ heading }: ParchmentHeadingCaptionProps) {
  if (!heading) return null;
  return <p className="py-3 text-center font-serif text-xs uppercase tracking-widest text-parchment-heading dark:text-zinc-400">{heading}</p>;
}

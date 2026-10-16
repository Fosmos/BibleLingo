import type { ReferenceEntry } from "@/lib/useReferenceEntry";
import type { ReferenceAnswer, ReferencePart } from "@/lib/referenceAnswer";

interface ReferenceSlotsProps {
  entry: ReferenceEntry;
  correct: ReferenceAnswer;
}

const WIDTH: Record<ReferencePart, string> = { number: "min-w-[1.1em]", book: "min-w-[4.5em]", chapter: "min-w-[1.4em]", verse: "min-w-[1.4em]" };

// The reference being recalled as the verse's opening line — [Book] [chapter]:[verse], a numbered
// book's number in a block of its own ([1] [Corinthians] …) — in the lesson's word states
// (design_handoff_lesson_view): a part entered reads as plain reference text,
// the part asked for now is ringed in terracotta, the rest wait in sand. A part answered wrongly
// shows its answer faintly until it's entered right.
export function ReferenceSlots({ entry, correct }: ReferenceSlotsProps) {
  const slot = (part: ReferencePart) => {
    const value = entry.entered[part];
    const done = value === correct[part];
    const tone = done ? "" : entry.part === part ? "bg-brand-100 ring-2 ring-inset ring-brand-500 dark:bg-brand-900/40" : "bg-sand-300 dark:bg-zinc-700";
    return (
      <span className={`inline-block rounded-md px-[.12em] text-center ${done ? "" : WIDTH[part]} ${tone}`}>
        {value || (entry.shown.has(part) ? <span className="text-brand-400 opacity-70">{correct[part]}</span> : "\u00a0")}
      </span>
    );
  };
  return (
    <span className="inline-flex items-baseline gap-[.26em]" aria-live="polite">
      {correct.number && slot("number")}
      {slot("book")}
      <span className="inline-flex items-baseline">
        {slot("chapter")}:{slot("verse")}
      </span>
    </span>
  );
}

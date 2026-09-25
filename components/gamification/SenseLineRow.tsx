import type { ReactNode } from "react";

interface SenseLineRowProps {
  // "clause" for a genuinely new clause/line within the SAME verse (every punctuation-bounded
  // split lib/senseLineSplitting.ts's own parser ever produces renders identically — to a
  // reader they're each just "the rest of this sentence, on the next line"), "verse" for the
  // first line of a NEW verse.
  topGap: "clause" | "verse";
  leadingMarkers?: ReactNode;
  number?: number;
  numberColor: string;
  underline: boolean;
  children: ReactNode;
}

// One sense-line — a single clause block. Every row starts flush at the SAME left margin as the
// verse's own very first line, whatever produced this particular split (see topGap's own doc
// comment above) — `pl-6`/`-indent-6` together (1.5rem — lib/senseLines.ts's own
// HANGING_INDENT_PX) still do real work within a SINGLE row's own `<p>`: if that one line's own
// text is long enough to wrap on its own within the browser (same `<p>`, a rare case since every
// line this app hands here already fits the column on its own), the -indent-6 only ever affects
// that paragraph's own FIRST line — its second line still lands at the padded position, hanging
// indented under the line's own first word, same as any hanging-indent paragraph. `text-pretty`
// avoids leaving an orphan word alone on its own wrapped line.
//
// leadingMarkers/number render in a SEPARATE `absolute right-full` span, not inline before
// `children` — inline, they'd sit ahead of the clause's own first word and push it rightward by
// however wide THIS particular row's own markers happen to be, so the first LETTER of the
// clause (not counting a verse number's own digit or an icon) would land at a different x on a
// numbered/tagged row than on a plain one, even though both are meant to be "this clause's own
// first line." Absolutely positioning the marker span removes it from the text's own flow
// entirely — `children` is then always the first real inline content of the line, so it always
// lands at the exact same flush-left position (see above) regardless of whether this particular
// row happens to carry a verse number, a Loci tag, a dual-coding icon, none of them, or all
// three. `right-full` (not `right-0`, which would anchor to the `<p>`'s own FAR right edge — the
// width of the whole text column, not the text's own start) puts the marker span's own right
// edge exactly at that shared text-start x; `mr-1` then nudges its actual border box a hair
// further left of that so it doesn't visually touch the text. Since only `right` (not `left`) is
// set, the span is shrink-to-fit and grows LEFTWARD as its own content needs — into the card's
// own padding gutter — rather than a fixed width a 3-digit verse number or several icons
// together could overflow out of.
//
// Every row shares the SAME leading-[1.5] regardless of `topGap` — governs the gap wherever a
// line happens to wrap within its own `<p>` (rare — see above), so a natural browser wrap and a
// new sense-line never visibly disagree with each other.
//
// A new LINE (still the same verse) gets a real margin instead — `mt-[0.65em]` — and a new VERSE
// gets bigger still — `mt-[1.3em]`, double that. Two tiers, not three: margin, not line-height,
// is what tells "a new verse" apart from "still this verse" in the first place. `em` keeps every
// tier scaled to whatever font size the page actually renders at, same as every other size on
// this row. Split out of SenseLineVerse.tsx purely to keep that file under this codebase's own
// 200-line file cap — no behavior difference from having it inline there.
const TOP_GAP_CLASS: Record<SenseLineRowProps["topGap"], string> = { clause: "mt-[0.65em]", verse: "mt-[1.3em]" };

export function SenseLineRow({ topGap, leadingMarkers, number, numberColor, underline, children }: SenseLineRowProps) {
  return (
    <div className={TOP_GAP_CLASS[topGap]}>
      <p className="relative -indent-6 pl-6 text-pretty leading-[1.5]">
        {(leadingMarkers || number !== undefined) && (
          <span className="absolute right-full mr-1 whitespace-nowrap text-right">
            {leadingMarkers}
            {number !== undefined && <sup className={`text-[0.9em] font-semibold ${numberColor}`}>{number}</sup>}
          </span>
        )}
        <span className={underline ? "underline decoration-brand-600 underline-offset-2 dark:decoration-brand-400" : undefined}>{children}</span>
      </p>
    </div>
  );
}

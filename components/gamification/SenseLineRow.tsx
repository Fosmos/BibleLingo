import type { ReactNode } from "react";

interface SenseLineRowProps {
  continuation?: boolean;
  leadingMarkers?: ReactNode;
  number?: number;
  numberColor: string;
  underline: boolean;
  children: ReactNode;
}

// One sense-line — a single clause block. Every row starts flush at the SAME left margin as the
// verse's own very first line, whether it's a genuinely new clause OR a `continuation` row
// (enforceMaxLength forcing an over-long clause to split, often right at a conjunction/relative
// pronoun — see SenseLineClause's own doc comment): `-indent-6` is unconditional below, not
// gated on `continuation`, so a forced split reads as a plain, natural next line rather than
// hanging indented. `pl-6`/`-indent-6` together (1.5rem — lib/senseLines.ts's own
// HANGING_INDENT_PX) still do real work within a SINGLE row's own `<p>`: if that one clause's
// own text is long enough to wrap on its own within the browser (same `<p>`, no forced split at
// all), the -indent-6 only ever affects that paragraph's own FIRST line — its second line still
// lands at the padded position, hanging indented under the clause's own first word, same as any
// hanging-indent paragraph. `text-pretty` avoids leaving an orphan word alone on its own wrapped
// line.
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
// Every row shares the SAME tight leading-[1.5] regardless of `continuation` — that governs the
// gap between two lines that are still part of the SAME clause, which happens two different
// ways: an explicit `continuation` row (enforceMaxLength forced a split), or a plain clause
// that's simply long enough to wrap on its own within the browser (same `<p>`, no continuation
// flag at all — CSS line-height can't tell "my own natural second line" apart from "my own
// first line," so both need the identical value or they'd visibly disagree with each other).
// Distinct clauses get a LARGER gap instead, from `mt-[0.9em]` on every non-continuation row's
// own outer div (continuation rows get none, so they stay snug under whichever line precedes
// them, reading as "the rest of that same clause" via spacing alone now that both are flush) —
// margin, not line-height, is what can tell "a new clause" apart from "still this one." `em`
// keeps both this and the leading above scaled to whatever font size the page actually renders
// at, same as every other size on this row. Split out of SenseLineVerse.tsx purely to keep that
// file under this codebase's own 200-line file cap — no behavior difference from having it
// inline there.
export function SenseLineRow({ continuation, leadingMarkers, number, numberColor, underline, children }: SenseLineRowProps) {
  return (
    <div className={continuation ? "" : "mt-[0.9em]"}>
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

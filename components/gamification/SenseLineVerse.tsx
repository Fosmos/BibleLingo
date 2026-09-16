"use client";

import type { ReactNode } from "react";
import { Lightbulb, MapPin } from "lucide-react";
import type { VerseSegment } from "@/types";
import type { RunState } from "@/lib/chapterReadingRuns";
import { senseLineWordRanges, type SenseLineWordRange } from "@/lib/senseLineWordRanges";
import { locationTagKey } from "@/lib/locationTags";
import { verseIconById } from "@/lib/verseIcons";
import { isStructuralWord } from "@/lib/structuralWords";
import { SenseLineRow } from "@/components/gamification/SenseLineRow";

interface SenseLineVerseProps {
  verse: VerseSegment;
  dayNumber: number | undefined;
  state: RunState;
  locationTags: Record<string, string>;
  iconTags: Record<string, string>;
  pegActive: boolean;
  pegAnchorVerse?: number;
  // Learn/Review only (see ChapterPageContent.tsx's own doc comment) — swaps this verse's own
  // words for whatever a drill stage wants shown in their place, called ONCE PER CLAUSE (see
  // lib/senseLines.ts's own senseLineWordRanges) rather than once for the whole verse, so the
  // verse actually being drilled still renders through the SAME multi-line, hanging-indent
  // clause structure every other verse on the page gets — only the WORDS within each clause
  // differ (revealed/blanked/masked), never the line breaks or the spacing between them. A
  // caller slices its own per-word reveal state by `range.startIndex`/`endIndex` (both index
  // into tokenizeVerseWords(verse.text), the same tokenizer that per-word state is already
  // built from) or, for a caller with no per-word state of its own, just returns
  // `range.clause.text` outright. Returns undefined for every clause when this verse isn't the
  // one being drilled right now, in which case this component falls back to its own default
  // clause rendering below.
  renderVerseWords?: (verse: VerseSegment, range: SenseLineWordRange) => ReactNode | undefined;
  isVerseNumberVisible?: (verse: VerseSegment) => boolean;
  onSelect: (dayNumber: number | undefined) => void;
}

// A clause opening with a quotation mark (curly or straight, single or double — e.g. Mark 1:2's
// own "'Behold, I send my messenger...") gets that mark split off so it can hang slightly into
// the margin instead of sitting inline before the real first letter — the same "the LEFT edge
// is set by the first LETTER, not the first character" rule SenseLineRow's own marker span
// already applies to a leading verse number/icon, just here for punctuation baked into the
// verse text itself. A fixed `ml-[-0.35em]` (not a measured-per-glyph value) is the same
// practical approximation real typesetting software uses for optical margin alignment — close
// enough by eye that a pixel-exact glyph width would be indistinguishable from it.
const LEADING_QUOTE_PATTERN = /^([‘’“”'"])([\s\S]*)$/;

function renderClauseWords(text: string): ReactNode {
  return text.split(/(\s+)/).map((token, index) => {
    if (index === 0) {
      const leadingQuote = token.match(LEADING_QUOTE_PATTERN);
      if (leadingQuote) {
        const [, quote, rest] = leadingQuote;
        return (
          <span key={index}>
            <span className="ml-[-0.35em]">{quote}</span>
            {isStructuralWord(rest) ? (
              <span className="font-semibold text-brand-600 dark:text-brand-400">{rest}</span>
            ) : (
              rest
            )}
          </span>
        );
      }
    }
    return isStructuralWord(token) ? (
      <span key={index} className="font-semibold text-brand-600 dark:text-brand-400">
        {token}
      </span>
    ) : (
      token
    );
  });
}

// One verse, laid out as its own real sense-line clauses (see lib/senseLines.ts) instead of
// flowing inline paragraph text — replaces ChapterVerseRun.tsx for every sense-line page.
// Preserves every marker ChapterVerseRun.tsx rendered (a Loci tag, section Peg word, dual-
// coding icon, verse number, structural-word bolding, "today" underline, and the tap-to-
// open behavior) — only the LAYOUT changed, from one shared paragraph to individually
// block-level, indented clause lines.
export function SenseLineVerse({
  verse,
  dayNumber,
  state,
  locationTags,
  iconTags,
  pegActive,
  pegAnchorVerse,
  renderVerseWords,
  isVerseNumberVisible,
  onSelect,
}: SenseLineVerseProps) {
  const numberColor =
    state === "completed" ? "text-green-600 dark:text-green-500" : state === "today" ? "text-brand-600 dark:text-brand-400" : "text-ink-muted";
  const key = locationTagKey({ level: "verse", book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber });
  const hasLoci = Boolean(locationTags[key]);
  const icon = verseIconById(iconTags[key]);
  // A continuation fragment of a verse split across the page break (verse.wordOffset set — see
  // lib/chapterPagination.ts) skips every marker and the number itself: they already showed on
  // the fragment before it.
  const leadingMarkers = !verse.wordOffset && (
    <>
      {hasLoci && <Lightbulb aria-hidden="true" size={10} className="mr-0.5 inline text-purple-500 dark:text-purple-400" />}
      {icon && <icon.Icon aria-hidden="true" size={10} className="mr-0.5 inline text-brand-500 dark:text-brand-400" />}
      {pegActive && verse.verseNumber === pegAnchorVerse && <MapPin aria-hidden="true" size={10} className="mr-0.5 inline text-teal-600 dark:text-teal-400" />}
    </>
  );
  const showNumber = !verse.wordOffset && (!isVerseNumberVisible || isVerseNumberVisible(verse));
  const underline = state === "today";
  const ranges = senseLineWordRanges(verse.text);

  return (
    <div
      onClick={() => onSelect(dayNumber)}
      className={`rounded transition-colors ${dayNumber !== undefined ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" : ""} ${
        state === "future" ? "text-brand-900/70 dark:text-zinc-100/70" : "text-brand-900 dark:text-zinc-100"
      }`}
    >
      {ranges.map((range, index) => {
        const { clause } = range;
        const overridden = renderVerseWords?.(verse, range);
        return (
          <SenseLineRow
            key={index}
            continuation={clause.continuation}
            leadingMarkers={index === 0 ? leadingMarkers : undefined}
            number={index === 0 && showNumber ? verse.verseNumber : undefined}
            numberColor={numberColor}
            underline={underline}
          >
            {overridden !== undefined ? overridden : renderClauseWords(clause.text)}
          </SenseLineRow>
        );
      })}
    </div>
  );
}

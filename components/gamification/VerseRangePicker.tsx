import type { PalaceVerseRange, VerseSegment } from "@/types";
import { inRange, rangeFrom } from "@/lib/builtPalaces";

interface VerseRangePickerProps {
  // The verses it can hold — the path's, or the room's or palace's range around it.
  verses: VerseSegment[];
  value: PalaceVerseRange | undefined;
  onChange: (range: PalaceVerseRange | undefined) => void;
}

const SELECT = "min-w-0 flex-1 rounded-xl border border-sand-300 bg-paper px-2 py-1.5 text-[13px] font-bold text-ink dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const shortRef = (verse: VerseSegment) => `${verse.chapter}:${verse.verseNumber}`;

// Which verses a built palace, room or spot holds (the Palace tab): a From and a To verse, the To
// never before the From. "None" leaves it without verses for now — they're assigned as you go.
export function VerseRangePicker({ verses, value, onChange }: VerseRangePickerProps) {
  const fromIndex = value ? verses.findIndex((verse) => inRange(verse, value)) : -1;
  const toIndex = value ? verses.findLastIndex((verse) => inRange(verse, value)) : -1;
  const pick = (from: number, to: number) => onChange(from < 0 ? undefined : rangeFrom(verses[from], verses[Math.max(from, to)]));

  return (
    <div className="flex items-center gap-1.5">
      <select aria-label="From verse" className={SELECT} value={fromIndex} onChange={(event) => pick(Number(event.target.value), toIndex)}>
        <option value={-1}>No verses yet</option>
        {verses.map((verse, index) => (
          <option key={verse.id} value={index}>
            {shortRef(verse)}
          </option>
        ))}
      </select>
      <span className="text-xs font-bold text-ink-muted">to</span>
      <select aria-label="To verse" className={SELECT} value={toIndex} disabled={fromIndex < 0} onChange={(event) => pick(fromIndex, Number(event.target.value))}>
        {fromIndex < 0 && <option value={-1}>—</option>}
        {verses.map((verse, index) =>
          index < fromIndex ? null : (
            <option key={verse.id} value={index}>
              {shortRef(verse)}
            </option>
          ),
        )}
      </select>
    </div>
  );
}

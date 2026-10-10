"use client";

import type { CSSProperties } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { VerseSegment } from "@/types";
import type { ChapterPathGroup } from "@/lib/useChapterPathGroups";
import { useNodeCentres } from "@/lib/useNodeCentres";
import { cardAction, formatRuns, type MemoryState } from "@/lib/verseMemoryState";
import { ChapterPathRoad } from "@/components/gamification/ChapterPathRoad";
import { ChapterPathVerseRow, type VerseStatus } from "@/components/gamification/ChapterPathVerseRow";
import { PericopeTrail } from "@/components/gamification/PericopeTrail";

interface PericopeTrailCardProps {
  group: ChapterPathGroup;
  statusOf: (verseNumber: number) => VerseStatus;
  chosen: Set<number>;
  open: boolean;
  onToggleOpen: () => void;
  selected: number | null;
  onSelect: (verseNumber: number) => void;
  onAction: (verse: VerseSegment, status: VerseStatus) => void;
  onToggleChosen: (verseNumber: number) => void;
  onChooseAll: (verses: number[]) => void;
  onLearn: (verses: number[]) => void;
  onReview: (verses: number[]) => void;
  // A lesson, review or preview running in place: the verse holding it, and which verses it hides.
  lessonVerse: number | null;
  isHidden: (verseNumber: number) => boolean;
}

const asMemory = (status: VerseStatus): MemoryState => (status === "current" ? "open" : status);
const BUTTON = "whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-extrabold";
const PRIMARY = `${BUTTON} bg-brand-500 text-paper hover:bg-brand-600 active:bg-brand-700`;

// One pericope on a chapter (shelf_path): its range and heading; collapsed, a mini trail of its
// verses; expanded, the path view's road and verse rows for just its verses. Its footer tallies the
// verses and offers the one next step — review what's due, choose what's open, learn what's chosen.
export function PericopeTrailCard(props: PericopeTrailCardProps) {
  const { group, statusOf, chosen, open, onToggleOpen, selected, onSelect, onAction, onToggleChosen, onChooseAll, onLearn, onReview, lessonVerse, isHidden } = props;
  const states = group.verses.map((verse) => [verse.verseNumber, asMemory(statusOf(verse.verseNumber))] as [number, MemoryState]);
  const tally = (state: MemoryState) => states.filter(([, s]) => s === state).length;
  const action = cardAction(states, chosen);
  const chapter = group.verses[0]?.chapter;
  const stat = [
    tally("rooted") && `${tally("rooted")} memorized`,
    tally("growing") && `${tally("growing")} growing`,
    tally("due") && `${tally("due")} due`,
    tally("open") && `${tally("open")} to choose`,
  ]
    .filter(Boolean)
    .join(" · ");
  const [wrapperRef, centres] = useNodeCentres<HTMLDivElement>(`${group.key}:${open}:${chosen.size}:${selected}:${lessonVerse}`);
  const lessonRunning = lessonVerse !== null;

  return (
    <section
      data-pericope={group.key}
      style={{ "--p": group.colour.base, "--t": group.colour.tint, "--k": group.colour.ink } as CSSProperties}
      className="flex shrink-0 flex-col gap-2.5 rounded-organic bg-[var(--t)] py-3.5 pl-3.5 pr-3 dark:bg-zinc-900"
    >
      <button type="button" onClick={onToggleOpen} aria-expanded={open} className="flex items-start gap-2 text-left text-[var(--k)] dark:text-zinc-200">
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-xs font-extrabold uppercase tracking-[.06em]">{group.range}</span>
          <span className="font-heading text-xl leading-[1.1]">{group.heading}</span>
        </span>
        {action.kind === "rooted" && (
          <span className="rounded-full bg-sage-200 px-2.5 py-1 text-xs font-extrabold text-sage-800">{tally("rooted") === states.length ? "Rooted" : "Growing"}</span>
        )}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper dark:bg-zinc-800">{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
      </button>

      {!open && <PericopeTrail verses={states} chosen={chosen} onTap={onToggleOpen} />}

      {open && (
        <div ref={wrapperRef} className="relative -ml-2.5 flex flex-col gap-1">
          <ChapterPathRoad
            centres={centres}
            nodes={states.map(([verseNumber, state], index) => ({
              verseNumber,
              colour: group.colour.base,
              walked: index > 0 && state !== "open" && states[index - 1][1] !== "open",
            }))}
          />
          {group.verses.map((verse, index) => {
            const status = statusOf(verse.verseNumber);
            return (
              <ChapterPathVerseRow
                key={verse.verseNumber}
                verse={verse}
                index={index}
                status={status}
                selected={!lessonRunning && verse.verseNumber === selected}
                inSelectedPericope
                chosen={(status === "open" || status === "current") && chosen.has(verse.verseNumber)}
                onSelect={() => onSelect(verse.verseNumber)}
                onAction={() => onAction(verse, status)}
                onChoose={() => onToggleChosen(verse.verseNumber)}
                hostsLesson={lessonVerse === verse.verseNumber}
                duringLesson={lessonRunning}
                hidden={isHidden(verse.verseNumber)}
              />
            );
          })}
        </div>
      )}

      {!lessonRunning && (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs font-bold text-[var(--k)] dark:text-zinc-300">{stat || "Not started"}</span>
          {action.kind === "review" && (
            <button type="button" className={PRIMARY} onClick={() => onReview(action.verses)}>
              Review {chapter}:{formatRuns(action.verses)}
            </button>
          )}
          {action.kind === "chooseAll" && (
            <button type="button" className={`${BUTTON} bg-paper text-ink hover:bg-sand-100 dark:bg-zinc-800 dark:text-zinc-100`} onClick={() => onChooseAll(action.verses)}>
              Choose all {action.verses.length}
            </button>
          )}
          {action.kind === "learn" && (
            <button type="button" className={PRIMARY} onClick={() => onLearn(action.verses)}>
              Learn {action.verses.length} chosen
            </button>
          )}
        </div>
      )}
    </section>
  );
}

"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import type { MemorizationDay } from "@/types";
import { chapterScopedDays } from "@/lib/chapterScopedDays";
import { buildVerseSpotlightLayout } from "@/lib/learnVerseSpotlightLayout";
import { findSpotlightTargets } from "@/lib/verseSpotlightTargets";
import { useMindMapCompactCenter } from "@/lib/useMindMapCompactCenter";
import { pericopeVerseProgress } from "@/lib/mindMapCompletion";
import { isPericopeNode } from "@/lib/mindMapLayoutTypes";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { MindMapSpotlightSpine } from "@/components/gamification/MindMapSpotlightSpine";
import { MindMapPericopeGateway } from "@/components/gamification/MindMapPericopeGateway";
import { MindMapVerseStream } from "@/components/gamification/MindMapVerseStream";

interface LearnMindMapSpotlightProps {
  book: string;
  chapter: number;
  verseNumber: number;
  allDays: MemorizationDay[];
  day: MemorizationDay;
  completedDays: number;
  todaysDay: number;
}

function noop() {
  // Read-only spotlight — pericope cards/verse chips never navigate or edit anything here.
}

// The Learn flow's own compact Mind Map "spotlight" (see components/gamification/
// LearnVerseSpotlightChrome.tsx) — a small, read-only view of just the current chapter's own
// pericope spine, auto-centered/zoomed on the verse actually being drilled with its immediate
// neighbor(s) in frame. Reuses the SAME node/verse-chip rendering components the real Mind Map
// canvas (BookMindMap.tsx) uses, laid out via lib/learnVerseSpotlightLayout.ts instead of the
// whole-book tree — no react-zoom-pan-pinch instance, no CAFD dimming, no fetch.
export function LearnMindMapSpotlight({ book, chapter, verseNumber, allDays, day, completedDays, todaysDay }: LearnMindMapSpotlightProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keyed on stable PRIMITIVES only (book/chapter/completedDays/todaysDay/day.chapterGroup) —
  // not on `allDays`/`day` themselves, which LearnSection.tsx's own non-memoized parent chain
  // hands down as a fresh array/object reference on every render even though their real content
  // (which days exist for this chapter) never changes mid-lesson. Depending on those unstable
  // references would recompute `layout` (and everything derived from it below) on EVERY render,
  // which — since lib/useMindMapCompactCenter.ts's own effect depends on referentially-stable
  // `targets` — would re-run that effect every render too, permanently starving the chip/card
  // Framer Motion animations of a chance to ever finish (each retrigger restarts them from
  // scratch). `allDays`/`day` are still read inside the memo body (React just can't statically
  // verify that's safe from a narrower dep list, hence the disable below).
  const layout = useMemo(
    () => buildVerseSpotlightLayout(book, chapter, chapterScopedDays(allDays, day), completedDays, todaysDay),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above: allDays/day's own CONTENT is already fully determined by book+chapter+completedDays+todaysDay
    [book, chapter, completedDays, todaysDay, day.chapterGroup],
  );

  const targetPericope = layout.pericopes.find(
    (pericope) => pericope.rangeStartVerse !== undefined && pericope.rangeEndVerse !== undefined && verseNumber >= pericope.rangeStartVerse && verseNumber <= pericope.rangeEndVerse,
  );
  // Memoized so its own identity only changes when the real verse being drilled changes — see
  // lib/useMindMapCompactCenter.ts's own doc comment on why a fresh object every render would
  // re-run that hook's effect every render.
  const targets = useMemo(
    () => (targetPericope ? findSpotlightTargets(layout.pericopes, layout.verseChips, targetPericope.id, verseNumber) : undefined),
    [layout, targetPericope, verseNumber],
  );

  const transform = useMindMapCompactCenter(wrapperRef, targets);

  const bounds = layout.nodes.reduce(
    (acc, node) => ({ minX: Math.min(acc.minX, node.cx), maxX: Math.max(acc.maxX, node.cx), maxY: Math.max(acc.maxY, node.cy) }),
    { minX: 0, maxX: 0, maxY: 0 },
  );
  const contentWidth = bounds.maxX - bounds.minX + 200;
  const contentHeight = bounds.maxY + 200;

  return (
    <div ref={wrapperRef} className="relative h-52 w-full overflow-hidden rounded-xl bg-mist/30 dark:bg-zinc-900/40">
      <motion.div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: contentWidth, height: contentHeight }}
        animate={{ x: transform?.offsetX ?? 0, y: transform?.offsetY ?? 0, scale: transform?.scale ?? 1, opacity: transform ? 1 : 0 }}
        transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }}
      >
        <MindMapSpotlightSpine spine={layout.spine} width={contentWidth} height={contentHeight} />
        {layout.nodes.filter(isPericopeNode).map((node) => (
          <MindMapPericopeGateway
            key={node.data.id}
            pericope={node.data}
            style={{ left: node.cx, top: node.cy, scale: 1 }}
            hallNumber={node.hallNumber}
            tagKey={undefined}
            progress={pericopeVerseProgress(node.data)}
            onSelect={noop}
          />
        ))}
        {layout.nodes.filter(isPericopeNode).map((node) => (
          <MindMapVerseStream
            key={node.data.id}
            pericope={node.data}
            verseChips={layout.verseChips.filter((chip) => chip.pericopeId === node.data.id)}
            hallNumber={node.hallNumber}
            pinVerseNumber={node.data.id === targetPericope?.id ? verseNumber : undefined}
            onSelectVerse={noop}
          />
        ))}
      </motion.div>
    </div>
  );
}

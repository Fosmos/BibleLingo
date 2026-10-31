"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { MemorizationDay, PathKind } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { playSectionCompleteSfx } from "@/lib/audio";
import { buildDuoPath, type DuoUnit } from "@/lib/altPaths/duoPath";
import { computeMemorizedStats } from "@/lib/progressSummary";
import { rankStanding } from "@/lib/ranks";
import type { TrailStop } from "@/lib/trailStops";
import { useArrivalToast } from "@/lib/useArrivalToast";
import { useStartStop } from "@/lib/altPaths/useStartStop";
import { useTrailSections } from "@/lib/useTrailSections";
import { DuoChestSheet } from "@/components/gamification/altPaths/DuoChestSheet";
import { DuoPathUnit } from "@/components/gamification/altPaths/DuoPathUnit";
import { TrailNodeSheet } from "@/components/gamification/TrailNodeSheet";
import { PathViewSwitch } from "@/components/ui/PathViewSwitch";

interface DuoPathScreenProps {
  pathKey: string;
  kind: PathKind;
  label: string;
  days: MemorizationDay[];
  version: string;
  completedDays: number;
  versesIntoDay?: number;
}

// The Path tab's Duolingo-style view: each passage a unit with a pinned banner, its verses a zigzag of
// chunky nodes, its reviews bosses, and a chest at the end. A lamb stands by the verse you're up to.
export function DuoPathScreen({ pathKey, kind, label, days, version, completedDays, versesIntoDay }: DuoPathScreenProps) {
  const sections = useTrailSections(pathKey, kind, days, completedDays, versesIntoDay);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const chests = useProgressStore((state) => state.paths[pathKey]?.pathChests);
  const openChest = useProgressStore((state) => state.openPathChest);
  const units = useMemo(() => buildDuoPath(sections, entities, chests), [sections, entities, chests]);
  const [sheet, setSheet] = useState<{ stop: TrailStop; unit: DuoUnit } | null>(null);
  const [chest, setChest] = useState<{ unit: DuoUnit; ready: boolean } | null>(null);
  const { start, review } = useStartStop(pathKey, version, kind, "duo");
  const toast = useArrivalToast();
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.querySelector("[data-next]")?.scrollIntoView({ block: "center" });
  }, []);

  const tapChest = (unit: DuoUnit) => {
    if (unit.chest === "ready") {
      openChest(pathKey, unit.id);
      playSectionCompleteSfx();
    }
    setChest({ unit, ready: unit.chest !== "locked" });
  };
  const verses = computeMemorizedStats(entities).verses;

  return (
    <div className="-mb-28 flex h-[100dvh] w-full flex-col">
      <header className="flex shrink-0 items-center gap-2 px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <Link href="/" aria-label="Back to your paths" className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-sand-600 hover:bg-sand-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
          <ArrowLeft size={20} strokeWidth={2.75} />
        </Link>
        <span className="min-w-0 flex-1 truncate font-heading text-[22px] leading-none text-ink dark:text-zinc-100">{label}</span>
        <PathViewSwitch className="shrink-0" />
      </header>
      <div ref={scroller} className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-y-auto overflow-x-clip px-4 pb-[120px] [scrollbar-width:none]">
        {units.map((unit) => (
          <DuoPathUnit key={unit.id} unit={unit} onTapStop={(stop) => setSheet({ stop, unit })} onTapChest={() => tapChest(unit)} />
        ))}
      </div>
      {sheet && <TrailNodeSheet stop={sheet.stop} sectionTitle={sheet.unit.title} pathLabel={label} onClose={() => setSheet(null)} onStart={() => start(sheet.stop, false)} onReview={() => review(sheet.stop.dueIds)} onPractise={() => start(sheet.stop, true)} />}
      {chest && <DuoChestSheet unitTitle={chest.unit.title} ready={chest.ready} verses={verses} standing={rankStanding(verses)} onClose={() => setChest(null)} />}
      {toast && <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-2.5 text-[13px] font-extrabold text-paper shadow-organic-lg dark:bg-zinc-100 dark:text-zinc-900">{toast}</div>}
    </div>
  );
}

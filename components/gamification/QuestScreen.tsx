"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import type { MemorizationDay, PathKind } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { playSectionCompleteSfx } from "@/lib/audio";
import { QUEST_BIOMES } from "@/lib/quest/biomes";
import { buildQuestWorld, type QuestLand, type QuestNode } from "@/lib/quest/world";
import type { TrailStop } from "@/lib/trailStops";
import { useArrivalToast } from "@/lib/useArrivalToast";
import { useStartStop } from "@/lib/useStartStop";
import { useTrailSections } from "@/lib/useTrailSections";
import { QuestAmbience } from "@/components/gamification/QuestAmbience";
import { QuestLandView } from "@/components/gamification/QuestLandView";
import { TrailNodeSheet } from "@/components/gamification/TrailNodeSheet";
import { PathViewSwitch } from "@/components/ui/PathViewSwitch";

interface QuestScreenProps {
  pathKey: string;
  kind: PathKind;
  label: string;
  days: MemorizationDay[];
  version: string;
  completedDays: number;
  versesIntoDay?: number;
}

type Sheet = { stop: TrailStop; land: QuestLand } | null;

const showHero = (behavior: ScrollBehavior) => document.getElementById("quest-hero")?.scrollIntoView({ block: "center", behavior });

// The experimental Quest tab: the path as a journey across a world map. Each section is a land with
// its own scenery and weather; a pilgrim walks its road verse by verse, to a boss review at
// its end. Lessons and reviews run in the reader, as on the Path tab, then come back here.
export function QuestScreen({ pathKey, kind, label, days, version, completedDays, versesIntoDay }: QuestScreenProps) {
  const sections = useTrailSections(pathKey, kind, days, completedDays, versesIntoDay);
  const entities = useProgressStore((state) => state.memorizedEntities);
  const world = useMemo(() => buildQuestWorld(sections, entities), [sections, entities]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [walked] = useState(() => new URLSearchParams(window.location.search).get("toast") === "done");
  const toast = useArrivalToast();
  const [landInView, setLandInView] = useState(0);
  const map = useRef<HTMLDivElement>(null);

  useEffect(() => {
    showHero("auto");
    if (walked) playSectionCompleteSfx();
  }, [walked]);

  // Which land is in the middle of the screen sets the weather.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries.find((entry) => entry.isIntersecting);
        if (seen) setLandInView(Number((seen.target as HTMLElement).dataset.biome));
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    map.current?.querySelectorAll("section[data-biome]").forEach((land) => observer.observe(land));
    return () => observer.disconnect();
  }, [world.lands.length]);

  const tapNode = (node: QuestNode, land: QuestLand) => setSheet({ stop: node.stop, land });
  const { start, review } = useStartStop(pathKey, version, kind, "quest");
  const weather = QUEST_BIOMES[landInView % QUEST_BIOMES.length].weather;

  return (
    <div ref={map} className="relative flex flex-1 flex-col pb-24">
      <QuestAmbience weather={weather} />
      <div className="fixed inset-x-0 top-[calc(0.6rem+env(safe-area-inset-top))] z-30 mx-auto flex max-w-md items-center justify-between gap-2 px-3">
        <PathViewSwitch dark />
        {world.heroKey && (
          <button type="button" aria-label="Go to where you're up to" onClick={() => showHero("smooth")} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white">
            <LocateFixed aria-hidden="true" size={16} strokeWidth={2.75} />
          </button>
        )}
      </div>
      {world.lands.map((land, index) => (
        <QuestLandView key={land.id} land={land} index={index} heroKey={world.heroKey} walked={walked} onTapNode={tapNode} />
      ))}
      {sheet && (
        <TrailNodeSheet
          stop={sheet.stop}
          sectionTitle={sheet.land.title}
          pathLabel={label}
          onClose={() => setSheet(null)}
          onStart={() => start(sheet.stop, false)}
          onReview={() => review(sheet.stop.dueIds)}
          onPractise={() => start(sheet.stop, true)}
        />
      )}
      {toast && <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-2.5 text-[13px] font-extrabold text-paper shadow-organic-lg dark:bg-zinc-100 dark:text-zinc-900">{toast}</div>}
    </div>
  );
}

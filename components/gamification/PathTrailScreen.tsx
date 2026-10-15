"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemorizationDay, PathKind } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildSteps } from "@/lib/learnSteps";
import { STAGE_LABELS } from "@/lib/learnSheetStage";
import { buildTrail, type TrailStop } from "@/lib/trailStops";
import { readerHref } from "@/lib/readerHref";
import { useArrivalToast } from "@/lib/useArrivalToast";
import { PathPillbox } from "@/components/gamification/PathPillbox";
import { WindingTrail } from "@/components/gamification/WindingTrail";
import { TrailNodeSheet } from "@/components/gamification/TrailNodeSheet";

interface PathTrailScreenProps {
  pathKey: string;
  kind: PathKind;
  label: string;
  days: MemorizationDay[];
  version: string;
  completedDays: number;
  // Verses of the next day already learned, each verse being its own lesson.
  versesIntoDay?: number;
  versesPerDay?: number;
}

// The Path tab (design_handoff_path_picker → Path): the path's pillbox over its winding trail. A
// stop's lesson, review or practice runs in the Memorized tab's chapter reader, in place, and
// comes back here when it's done (lib/readerHref.ts).
export function PathTrailScreen({ pathKey, kind, label, days, version, completedDays, versesIntoDay = 0, versesPerDay }: PathTrailScreenProps) {
  const router = useRouter();
  const entities = useProgressStore((state) => state.memorizedEntities);
  const toggles = useProgressStore((state) => state);
  // A verse path's trail is its one lesson's learning stages, in the order the reader has them on.
  const stageLabels = useMemo(() => {
    const steps = buildSteps([0], toggles.understandStageEnabled, toggles.visualizeStageEnabled, toggles.writeFirstLetterStageEnabled, toggles.fillInTheBlankStageEnabled, toggles.kineticTextStageEnabled ?? true, toggles.rhythmStageEnabled ?? false, 0);
    return [...new Set(steps.filter((step) => step.phase !== "pray").map((step) => STAGE_LABELS[step.phase]))];
  }, [toggles.understandStageEnabled, toggles.visualizeStageEnabled, toggles.writeFirstLetterStageEnabled, toggles.fillInTheBlankStageEnabled, toggles.kineticTextStageEnabled, toggles.rhythmStageEnabled]);
  const sections = useMemo(() => buildTrail(kind, days, completedDays, entities, stageLabels, versesIntoDay), [kind, days, completedDays, entities, stageLabels, versesIntoDay]);
  const [open, setOpen] = useState<TrailStop | null>(null);
  const toast = useArrivalToast();

  const learnDays = days.filter((day) => day.kind === "learn");
  const doneLearn = learnDays.filter((day) => day.dayNumber <= completedDays);
  const stops = sections.flatMap((section) => section.stops);
  const doneStops = stops.filter((stop) => stop.state === "done").length;
  const percent = stops.length ? Math.round((doneStops / stops.length) * 100) : 0;
  const known = kind === "verse" ? doneStops : doneLearn.reduce((sum, day) => sum + day.newVerses.length, 0) + versesIntoDay;
  const total = kind === "verse" ? stops.length : learnDays.reduce((sum, day) => sum + day.newVerses.length, 0);
  const due = new Set(stops.flatMap((stop) => stop.dueIds)).size;
  // A verse stop opens just that verse (a verse path's stages, and review stops, the whole day).
  const verseOf = (stop: TrailStop) => (stop.verse && kind !== "verse" ? `${stop.verse.chapter}:${stop.verse.verseNumber}` : undefined);
  const sectionOf = (stop: TrailStop) => sections.find((section) => section.stops.includes(stop))?.title ?? "";

  return (
    <div className="flex h-[100dvh] w-full flex-col -mb-28">
      <PathPillbox kind={kind} label={label} version={version} versesPerDay={versesPerDay} percent={percent} known={known} total={total} due={due} sections={sections} />
      <WindingTrail sections={sections} label={label} onTapStop={setOpen} />
      {open && (
        <TrailNodeSheet
          stop={open}
          sectionTitle={sectionOf(open)}
          pathLabel={label}
          onClose={() => setOpen(null)}
          onStart={() => router.push(readerHref(pathKey, version, { learnDay: open.dayNumber, verse: verseOf(open) }))}
          onReview={() => router.push(readerHref(pathKey, version, { review: open.dueIds }))}
          onPractise={() => router.push(readerHref(pathKey, version, { practiceDay: open.dayNumber, verse: verseOf(open) }))}
        />
      )}
      {toast && <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-2.5 text-[13px] font-extrabold text-paper shadow-organic-lg dark:bg-zinc-100 dark:text-zinc-900">{toast}</div>}
    </div>
  );
}

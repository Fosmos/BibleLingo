"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MemorizationDay, PathKind } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildSteps } from "@/lib/learnSteps";
import { STAGE_LABELS } from "@/lib/learnSheetStage";
import { buildTrail, type TrailStop } from "@/lib/trailStops";
import { readerHref } from "@/lib/readerHref";
import { PATH_TYPE_META } from "@/lib/pathTypeMeta";
import { useArrivalToast } from "@/lib/useArrivalToast";
import { PericopeMapScreen } from "@/components/gamification/PericopeMapScreen";
import { SectionTrailScreen } from "@/components/gamification/SectionTrailScreen";
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
}

// The Path tab (design_handoff_path_trail): the path's sections as a map, or — with `?section=` (an
// index, or "current") — one section's trail. A verse path is one section, so always its trail. A
// stop's lesson, review or practice runs in the Memorized tab's chapter reader, in place, and
// comes back here when it's done (lib/readerHref.ts).
export function PathTrailScreen({ pathKey, kind, label, days, version, completedDays, versesIntoDay = 0 }: PathTrailScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const entities = useProgressStore((state) => state.memorizedEntities);
  const reviewsDone = useProgressStore((state) => state.paths[pathKey]?.reviewsDone);
  const toggles = useProgressStore((state) => state);
  // A verse path's trail is its one lesson's learning stages, in the order the reader has them on.
  const stageLabels = useMemo(() => {
    const steps = buildSteps([0], [1], {
      understand: toggles.understandStageEnabled,
      visualize: toggles.visualizeStageEnabled,
      rhythm: toggles.rhythmStageEnabled ?? false,
      writeFirstLetter: toggles.writeFirstLetterStageEnabled,
    });
    return [...new Set(steps.filter((step) => step.phase !== "pray").map((step) => STAGE_LABELS[step.phase]))];
  }, [toggles.understandStageEnabled, toggles.visualizeStageEnabled, toggles.writeFirstLetterStageEnabled, toggles.rhythmStageEnabled]);
  const sections = useMemo(() => buildTrail(kind, days, completedDays, entities, stageLabels, versesIntoDay, reviewsDone), [kind, days, completedDays, entities, stageLabels, versesIntoDay, reviewsDone]);
  const [open, setOpen] = useState<TrailStop | null>(null);
  const toast = useArrivalToast();

  const sectionParam = params.get("section");
  const currentIndex = Math.max(0, sections.findIndex((section) => section.state !== "complete"));
  const index = kind === "verse" ? 0 : sectionParam === "current" ? currentIndex : sectionParam !== null ? Math.min(Number(sectionParam) || 0, sections.length - 1) : null;
  const showSection = (next: number | null) => {
    // A chapter review is one stop: the map opens it straight away.
    if (next !== null && sections[next]?.review) return setOpen(sections[next].stops[0]);
    const query = new URLSearchParams(params.toString());
    if (next === null) query.delete("section");
    else query.set("section", String(next));
    router.replace(`${pathname}?${query}`);
  };
  // A verse stop opens just that verse (a verse path's stages, and review stops, the whole day).
  const verseOf = (stop: TrailStop) => (stop.verse && kind !== "verse" ? `${stop.verse.chapter}:${stop.verse.verseNumber}` : undefined);
  const sectionOf = (stop: TrailStop) => sections.find((section) => section.stops.includes(stop))?.title ?? "";
  // A passage review (a pericope's or chapter's) runs as a practice over those verses.
  const start = (stop: TrailStop, practise: boolean) =>
    router.push(stop.review ? readerHref(pathKey, version, { passage: stop.review, day: stop.dayNumber }) : practise ? readerHref(pathKey, version, { practiceDay: stop.dayNumber, verse: verseOf(stop) }) : readerHref(pathKey, version, { learnDay: stop.dayNumber, verse: verseOf(stop) }));

  return (
    <>
      {!sections.length ? null : index === null ? (
        <PericopeMapScreen pathLabel={label} kindLabel={`${PATH_TYPE_META[kind].name} path`} sections={sections} onOpenSection={showSection} />
      ) : (
        <SectionTrailScreen pathLabel={label} sections={sections} index={index} onBack={() => (kind === "verse" ? router.push("/") : showSection(null))} onTapStop={setOpen} onOpenSection={showSection} />
      )}
      {open && (
        <TrailNodeSheet
          stop={open}
          sectionTitle={sectionOf(open)}
          pathLabel={label}
          onClose={() => setOpen(null)}
          onStart={() => start(open, false)}
          onReview={() => router.push(readerHref(pathKey, version, { review: open.dueIds }))}
          onPractise={() => start(open, true)}
        />
      )}
      {toast && <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-2.5 text-[13px] font-extrabold text-paper shadow-organic-lg dark:bg-zinc-100 dark:text-zinc-900">{toast}</div>}
    </>
  );
}

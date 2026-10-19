"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MemorizationDay, PathKind } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildSteps } from "@/lib/learnSteps";
import { STAGE_LABELS } from "@/lib/learnSheetStage";
import { buildTrail, type TrailStop } from "@/lib/trailStops";
import { readerHref } from "@/lib/readerHref";
import { mapThemePages } from "@/lib/mapThemePages";
import { parsePathKey } from "@/lib/memorizationContent";
import { pathTags, sectionTags } from "@/lib/trailTags";
import type { LocationTagLevel } from "@/types";
import type { TrailSection } from "@/lib/trailStops";
import { PATH_TYPE_META } from "@/lib/pathTypeMeta";
import { useArrivalToast } from "@/lib/useArrivalToast";
import { PericopeMapScreen } from "@/components/gamification/PericopeMapScreen";
import { SectionTrailScreen } from "@/components/gamification/SectionTrailScreen";
import { TrailNodeSheet } from "@/components/gamification/TrailNodeSheet";

const PASSAGE_TAG_LEVELS: LocationTagLevel[] = ["book", "chapter", "pericope"];

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
      pray: toggles.prayStageEnabled ?? false,
      lastLetters: toggles.lastLettersStageEnabled ?? true,
      timedType: toggles.timedTypeStageEnabled ?? true,
      payload: toggles.payloadStageEnabled ?? true,
      mathBreaks: toggles.mathBreakStageEnabled ?? true,
      wholeVerse: toggles.wholeVerseLearning,
    });
    return [...new Set(steps.filter((step) => step.phase !== "pray").map((step) => STAGE_LABELS[step.phase]))];
  }, [toggles.understandStageEnabled, toggles.visualizeStageEnabled, toggles.writeFirstLetterStageEnabled, toggles.rhythmStageEnabled, toggles.prayStageEnabled, toggles.lastLettersStageEnabled, toggles.timedTypeStageEnabled, toggles.payloadStageEnabled, toggles.mathBreakStageEnabled, toggles.wholeVerseLearning]);
  const sections = useMemo(() => buildTrail(kind, days, completedDays, entities, stageLabels, versesIntoDay, reviewsDone), [kind, days, completedDays, entities, stageLabels, versesIntoDay, reviewsDone]);
  const [open, setOpen] = useState<TrailStop | null>(null);
  const toast = useArrivalToast();

  const sectionParam = params.get("section");
  const currentIndex = Math.max(0, sections.findIndex((section) => section.state !== "complete"));
  // A long book's map has a page per theme — opening on the one you're on, kept in `?theme=`.
  const pages = useMemo(() => (kind === "book" ? mapThemePages(parsePathKey(pathKey).identifier, sections) : null), [kind, pathKey, sections]);
  const themeParam = params.get("theme");
  const page = pages ? (themeParam !== null ? Math.min(Number(themeParam) || 0, pages.length - 1) : Math.max(0, pages.findIndex((entry) => entry.indices.includes(currentIndex)))) : 0;
  // Memory Palace tags on a book or chapter path's map and trail, for the scopes turned on — book,
  // chapter and pericope until the reader has chosen in Settings.
  const tagLevels = useProgressStore((state) => state.locationTagLevels) ?? PASSAGE_TAG_LEVELS;
  const passagePath = kind === "book" || kind === "chapter";
  const headerTags = useMemo(() => (passagePath ? pathTags(kind, sections, tagLevels) : []), [passagePath, kind, sections, tagLevels]);
  const tagsFor = passagePath ? (section: TrailSection) => sectionTags(section, tagLevels) : undefined;
  const showPage = (next: number) => {
    const query = new URLSearchParams(params.toString());
    query.set("theme", String(next));
    router.replace(`${pathname}?${query}`);
  };
  const index = kind === "verse" ? 0 : sectionParam === "current" ? currentIndex : sectionParam !== null ? Math.min(Number(sectionParam) || 0, sections.length - 1) : null;
  // A book or chapter path's pericope opens in the reader, on the section's verse you're up to.
  const readerFor = (section: TrailSection | undefined) => {
    const lessons = section?.stops.filter((stop) => stop.verse) ?? [];
    const verse = (lessons.find((stop) => stop.state === "current") ?? lessons.find((stop) => stop.state !== "done") ?? lessons[0])?.verse;
    return passagePath && !section?.review && verse ? readerHref(pathKey, version, { select: `${verse.chapter}:${verse.verseNumber}` }, false) : null;
  };
  const showSection = (next: number | null) => {
    // A chapter review is one stop: the map opens it straight away.
    if (next !== null && sections[next]?.review) return setOpen(sections[next].stops[0]);
    const reader = next === null ? null : readerFor(sections[next]);
    if (reader) return router.push(reader);
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

  // A link to one of their sections (Home's Continue) goes on to the reader the same way.
  const redirect = index === null ? null : readerFor(sections[index]);
  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);
  if (redirect) return null;

  return (
    <>
      {!sections.length ? null : index === null ? (
        <PericopeMapScreen pathLabel={label} kindLabel={`${PATH_TYPE_META[kind].name} path`} sections={sections} onOpenSection={showSection} pages={pages} page={page} onPageChange={showPage} headerTags={headerTags} tagsFor={tagsFor} />
      ) : (
        <SectionTrailScreen pathLabel={label} sections={sections} index={index} onBack={() => (kind === "verse" ? router.push("/") : showSection(null))} onTapStop={setOpen} onOpenSection={showSection} tagsFor={tagsFor} />
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

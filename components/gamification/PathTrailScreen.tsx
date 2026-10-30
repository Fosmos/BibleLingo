"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MemorizationDay, PathKind } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import type { TrailStop } from "@/lib/trailStops";
import { useTrailSections } from "@/lib/useTrailSections";
import { readerHref } from "@/lib/readerHref";
import { parsePathKey } from "@/lib/memorizationContent";
import { pathTags, sectionTags } from "@/lib/trailTags";
import { sectionEmblem } from "@/lib/sectionEmblems";
import type { LocationTagLevel } from "@/types";
import type { TrailSection } from "@/lib/trailStops";
import { PATH_TYPE_META } from "@/lib/pathTypeMeta";
import { useArrivalToast } from "@/lib/useArrivalToast";
import { BookGridScreen } from "@/components/gamification/BookGridScreen";
import { PericopeMapScreen } from "@/components/gamification/PericopeMapScreen";
import { SectionTrailScreen } from "@/components/gamification/SectionTrailScreen";
import { TrailNodeSheet } from "@/components/gamification/TrailNodeSheet";
import { BookStructureScreen } from "@/components/gamification/BookStructureScreen";

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
  // The Palace tab: the whole book's structure, a picture per verse (BookStructureScreen.tsx).
  palace?: boolean;
}

// The Path tab (design_handoff_path_trail): the path's sections as a map, or — with `?section=` (an
// index, or "current") — one section's trail. A verse path is one section, so always its trail. A
// stop's lesson, review or practice runs in the Memorized tab's chapter reader, in place, and
// comes back here when it's done (lib/readerHref.ts).
export function PathTrailScreen({ pathKey, kind, label, days, version, completedDays, versesIntoDay = 0, palace = false }: PathTrailScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sections = useTrailSections(pathKey, kind, days, completedDays, versesIntoDay);
  const [open, setOpen] = useState<TrailStop | null>(null);
  const toast = useArrivalToast();

  const sectionParam = params.get("section");
  const currentIndex = Math.max(0, sections.findIndex((section) => section.state !== "complete"));
  // Memory Palace tags on a book or chapter path's map and trail, for the scopes turned on — book,
  // chapter and pericope until the reader has chosen in Settings.
  const tagLevels = useProgressStore((state) => state.locationTagLevels) ?? PASSAGE_TAG_LEVELS;
  const passagePath = kind === "book" || kind === "chapter";
  const headerTags = useMemo(() => (passagePath ? pathTags(kind, sections, tagLevels) : []), [passagePath, kind, sections, tagLevels]);
  const tagsFor = passagePath ? (section: TrailSection) => sectionTags(section, tagLevels) : undefined;
  // Each stone's symbol on the map — its pericope's hall emblem, or its review's (lib/sectionEmblems.ts).
  const iconTags = useProgressStore((state) => state.iconTags);
  const emblemFor = (section: TrailSection) => sectionEmblem(section, iconTags);
  const index = kind === "verse" ? 0 : sectionParam === "current" ? currentIndex : sectionParam !== null ? Math.min(Number(sectionParam) || 0, sections.length - 1) : null;
  // A pericope opens in the reader, on the section's verse you're up to.
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
  // A passage review (a pericope's or chapter's) runs as a practice over those verses. Begun on the
  // Palace, the reader comes back there.
  const back = palace ? ("palace" as const) : true;
  const start = (stop: TrailStop, practise: boolean) =>
    router.push(stop.review ? readerHref(pathKey, version, { passage: stop.review, day: stop.dayNumber }, back) : practise ? readerHref(pathKey, version, { practiceDay: stop.dayNumber, verse: verseOf(stop) }, back) : readerHref(pathKey, version, { learnDay: stop.dayNumber, verse: verseOf(stop) }, back));

  // A link to one of their sections (Home's Continue) goes on to the reader the same way.
  const redirect = index === null || palace || passagePath ? null : readerFor(sections[index]);
  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);
  if (redirect) return null;

  return (
    <>
      {!sections.length ? null : passagePath && !palace ? (
        <BookGridScreen label={label} sections={sections} headerTags={headerTags} tagsFor={tagsFor} onStart={(stop) => start(stop, false)} onPractise={(stop) => start(stop, true)} onReview={(ids) => router.push(readerHref(pathKey, version, { review: ids }, back))} />
      ) : palace ? (
        <BookStructureScreen pathKey={pathKey} pathLabel={label} book={passagePath ? parsePathKey(pathKey).identifier.split("|")[0] : undefined} sections={sections} onStart={(stop) => start(stop, stop.state === "done")} onReview={(ids) => router.push(readerHref(pathKey, version, { review: ids }, back))} />
      ) : index === null ? (
        <PericopeMapScreen pathLabel={label} kindLabel={`${PATH_TYPE_META[kind].name} path`} sections={sections} onOpenSection={showSection} outlineBook={passagePath ? parsePathKey(pathKey).identifier.split("|")[0] : undefined} headerTags={headerTags} tagsFor={tagsFor} emblemFor={emblemFor} />
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
          onReview={() => router.push(readerHref(pathKey, version, { review: open.dueIds }, back))}
          onPractise={() => start(open, true)}
        />
      )}
      {toast && <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-2.5 text-[13px] font-extrabold text-paper shadow-organic-lg dark:bg-zinc-100 dark:text-zinc-900">{toast}</div>}
    </>
  );
}

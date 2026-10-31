"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MemorizationDay, PathKind } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import type { TrailSection, TrailStop } from "@/lib/trailStops";
import { useTrailSections } from "@/lib/useTrailSections";
import { readerHref } from "@/lib/readerHref";
import { parsePathKey } from "@/lib/memorizationContent";
import { sectionEmblem } from "@/lib/sectionEmblems";
import { PATH_TYPE_META } from "@/lib/pathTypeMeta";
import { useArrivalToast } from "@/lib/useArrivalToast";
import { BookStructureScreen } from "@/components/gamification/BookStructureScreen";
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

// The Path tab. A book or chapter path is its whole book, then a chapter (BookStructureScreen.tsx). A
// topic path, with no book to show, is its sections as a map, or with `?section=` one section's trail;
// a verse path is one section, so always its trail. A lesson, review or practice runs in the Memorized
// tab's chapter reader, in place, and comes back here when it's done (lib/readerHref.ts).
export function PathTrailScreen({ pathKey, kind, label, days, version, completedDays, versesIntoDay = 0 }: PathTrailScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const sections = useTrailSections(pathKey, kind, days, completedDays, versesIntoDay);
  const [open, setOpen] = useState<TrailStop | null>(null);
  const toast = useArrivalToast();

  const sectionParam = params.get("section");
  const currentIndex = Math.max(0, sections.findIndex((section) => section.state !== "complete"));
  const passagePath = kind === "book" || kind === "chapter";
  // Each stone's symbol on the map — its review's (lib/sectionEmblems.ts).
  const iconTags = useProgressStore((state) => state.iconTags);
  const emblemFor = (section: TrailSection) => sectionEmblem(section, iconTags);
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
  const review = (ids: string[]) => router.push(readerHref(pathKey, version, { review: ids }));

  return (
    <>
      {!sections.length ? null : passagePath ? (
        <BookStructureScreen pathKey={pathKey} pathLabel={label} version={version} book={parsePathKey(pathKey).identifier.split("|")[0]} sections={sections} onStart={(stop) => start(stop, stop.state === "done")} onOpenVerse={({ verse }) => router.push(readerHref(pathKey, version, { select: `${verse.chapter}:${verse.verseNumber}` }))} />
      ) : index === null ? (
        <PericopeMapScreen pathLabel={label} kindLabel={`${PATH_TYPE_META[kind].name} path`} sections={sections} onOpenSection={showSection} emblemFor={emblemFor} />
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
          onReview={() => review(open.dueIds)}
          onPractise={() => start(open, true)}
        />
      )}
      {toast && <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-2.5 text-[13px] font-extrabold text-paper shadow-organic-lg dark:bg-zinc-100 dark:text-zinc-900">{toast}</div>}
    </>
  );
}

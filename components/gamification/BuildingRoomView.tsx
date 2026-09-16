"use client";

import { useEffect, useRef } from "react";
import type { MemorizationDay } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildPathZones } from "@/lib/pathZones";
import { computeZoneCardState, zoneShowsTodaysVerses } from "@/lib/pericopeCardState";
import { locationTagKey } from "@/lib/locationTags";
import { LocationTagField } from "@/components/gamification/LocationTagField";
import { PegTagField } from "@/components/gamification/PegTagField";
import { IconTagField } from "@/components/gamification/IconTagField";
import { PericopeCard } from "@/components/gamification/PericopeCard";

// A stable empty-array fallback for the `locationTagLevels` selector below — `?? []` inline
// in the selector would hand useSyncExternalStore a fresh array reference on every call
// whenever a path has none set, which it reads as "the store changed" and re-renders forever
// (surfaces as React's "Maximum update depth exceeded" / "getSnapshot should be cached").
const NO_LOCATION_TAG_LEVELS: never[] = [];

interface BuildingRoomViewProps {
  days: MemorizationDay[];
  completedDays: number;
  todaysDayNumber: number;
  pathKey: string;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
}

// The Building-view path: the exact same PericopeCard list as the plain view (see
// PathDayList.tsx) — same rail circles, same cards, same capstone days (Weekly Review, Boss
// Battle, ...) — with an "add location tag" option layered in at whichever scopes this path
// picked (see PathProgress.locationTagLevels): a book-level tag once at the top, a
// chapter-level tag right below it, a pericope-level tag in each card's own header, and a
// verse-level tag under each card's verse grid — one per verse actually shown there. No walls,
// no rooms, no predefined suggestions of any kind — every location tag is free text, entered
// and edited the same way via LocationTagField.tsx. When the Memory Palace step's Pegs
// checkbox was on, an editable Peg word (PegTagField.tsx, reading/writing the reader's own
// Master Peg List — see app/profile/peg-list/page.tsx) sits next to the chapter, pericope, and
// verse tags too — never the book one, since a book has no natural number to peg the way a
// chapter, section, or verse does. A pericope's own peg is pegged to the VERSE NUMBER it
// starts with (zone.startVerse), not an arbitrary section index — so, e.g., a section opening
// at verse 9 always shows the same peg word as verse 9's own tag. When the path's own
// PathProgress.sectionEndPegEnabled is also on (see LocationTagLevelPicker.tsx — only offered
// once "pericope" and Pegs are both picked), a second chip pegged to the section's own last
// verse (zone.endVerse) sits right beside the start one, each labeled so it's clear which is
// which — suppressed for a one-verse section, where start and end are the same verse anyway.
export function BuildingRoomView({ days, completedDays, todaysDayNumber, pathKey, onSelectDay, onPracticeDay }: BuildingRoomViewProps) {
  const levels = useProgressStore((state) => state.paths[pathKey]?.locationTagLevels ?? NO_LOCATION_TAG_LEVELS);
  const pegSystemEnabled = useProgressStore((state) => state.pegSystemEnabled);
  const sectionEndPegEnabled = useProgressStore((state) => state.paths[pathKey]?.sectionEndPegEnabled ?? false);

  const zones = buildPathZones(days);
  const activeCardRef = useRef<HTMLDivElement | null>(null);
  const states = zones.map((zone) => computeZoneCardState(zone, completedDays, todaysDayNumber));
  const showsToday = zones.map((zone, index) => zoneShowsTodaysVerses(zone, states[index], todaysDayNumber));

  useEffect(() => {
    activeCardRef.current?.scrollIntoView({ block: "center" });
  }, [completedDays]);

  if (zones.length === 0) {
    return <p className="p-8 text-center text-sm text-ink-muted">Loading…</p>;
  }

  const anchorBook = zones[0].anchorBook;
  const anchorChapter = zones[0].anchorChapter;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-3 pb-8 pt-4">
        {(levels.includes("book") || levels.includes("chapter")) && (
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            {levels.includes("book") && <LocationTagField tagKey={locationTagKey({ level: "book", book: anchorBook })} />}
            {levels.includes("chapter") && (
              <>
                <LocationTagField tagKey={locationTagKey({ level: "chapter", book: anchorBook, chapter: anchorChapter })} />
                {pegSystemEnabled && <PegTagField n={anchorChapter} />}
              </>
            )}
          </div>
        )}

        {zones.map((zone, index) => {
          const showEndPeg =
            pegSystemEnabled &&
            sectionEndPegEnabled &&
            zone.endVerse !== undefined &&
            zone.startVerse !== undefined &&
            zone.endVerse !== zone.startVerse;
          const headerExtra = zone.heading && levels.includes("pericope") && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <LocationTagField
                tagKey={locationTagKey({ level: "pericope", book: zone.anchorBook, chapter: zone.anchorChapter, pericopeLabel: zone.label })}
              />
              {pegSystemEnabled && zone.startVerse !== undefined && (
                <div className="flex items-center gap-1">
                  {showEndPeg && <span className="text-[10px] font-semibold uppercase text-ink-muted">Start</span>}
                  <PegTagField n={zone.startVerse} />
                </div>
              )}
              {showEndPeg && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold uppercase text-ink-muted">End</span>
                  <PegTagField n={zone.endVerse!} />
                </div>
              )}
            </div>
          );
          const verseGridExtra = zone.heading && levels.includes("verse") && zone.startVerse !== undefined && zone.endVerse !== undefined && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {Array.from({ length: zone.endVerse - zone.startVerse + 1 }, (_, i) => zone.startVerse! + i).map((verseNumber) => (
                <div key={verseNumber} className="flex items-center gap-1">
                  <LocationTagField
                    tagKey={locationTagKey({ level: "verse", book: zone.anchorBook, chapter: zone.anchorChapter, verseNumber })}
                  />
                  {pegSystemEnabled && <PegTagField n={verseNumber} />}
                  <IconTagField tagKey={locationTagKey({ level: "verse", book: zone.anchorBook, chapter: zone.anchorChapter, verseNumber })} />
                </div>
              ))}
            </div>
          );
          return (
            <PericopeCard
              key={`${zone.zoneNumber}-${zone.label}`}
              zone={zone}
              state={states[index]}
              index={index}
              isLast={index === zones.length - 1}
              completedDays={completedDays}
              todaysDayNumber={todaysDayNumber}
              connectToPrevious={showsToday[index] && showsToday[index - 1] === true}
              connectToNext={showsToday[index] && showsToday[index + 1] === true}
              cardRef={states[index].status === "active" ? activeCardRef : undefined}
              onSelectDay={onSelectDay}
              onPracticeDay={onPracticeDay}
              headerExtra={headerExtra || undefined}
              verseGridExtra={verseGridExtra || undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

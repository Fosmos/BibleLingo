"use client";

import type { MemorizationDay } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildPathZones, type PathZone } from "@/lib/pathZones";
import { locationTagKey } from "@/lib/locationTags";
import { verseKey } from "@/lib/verseKey";
import { LocationTagField } from "@/components/gamification/LocationTagField";
import { DayCircle } from "@/components/gamification/DayCircle";

// A stable empty-array fallback for the `locationTagLevels` selector below — `?? []` inline
// in the selector would hand useSyncExternalStore a fresh array reference on every call
// whenever a path has none set, which it reads as "the store changed" and re-renders forever
// (surfaces as React's "Maximum update depth exceeded" / "getSnapshot should be cached").
const NO_LOCATION_TAG_LEVELS: never[] = [];

interface BuildingRoomViewProps {
  days: MemorizationDay[];
  completedDays: number;
  // completedDays + 1, gated so it only advances once a real calendar day has passed since
  // this path's last completion — see lib/dayRollover.ts's own activeDayNumber. -1 (never a
  // real dayNumber) whenever today's own lesson is already done, so no circle glows as
  // freshly "unlocked" until tomorrow (every circle stays tappable regardless — see
  // DayCircle.tsx's own comment — this only changes which one visually reads as "next").
  activeDayNumber: number;
  pathKey: string;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
}

function zoneLearnDays(zone: PathZone): MemorizationDay[] {
  return zone.days.filter((day) => day.kind === "learn");
}

// The Building-view path: the same pericope-grouped lesson-circle list as the plain view
// (see PathDayList.tsx) — one circle per LESSON, grouping several verses into a single
// circle exactly when versesPerDay > 1 does for the plain view too (see lib/dayPlan.ts) —
// with an "add location tag" option layered in at whichever scopes this path picked (see
// PathProgress.locationTagLevels): a book-level tag once at the top, a chapter-level tag
// right below it, a pericope-level tag on each section heading, and/or a verse-level tag
// under each lesson circle — one field per verse the lesson actually covers, since a
// location tag is always scoped to a single verse even when several share one lesson. No
// walls, no rooms, no predefined suggestions of any kind — every tag is free text, entered
// and edited the same way via LocationTagField.tsx.
export function BuildingRoomView({ days, completedDays, activeDayNumber, pathKey, onSelectDay, onPracticeDay }: BuildingRoomViewProps) {
  const versePOA = useProgressStore((state) => state.versePOA);
  const levels = useProgressStore((state) => state.paths[pathKey]?.locationTagLevels ?? NO_LOCATION_TAG_LEVELS);

  const zones = buildPathZones(days).filter((zone) => zone.heading);

  if (zones.length === 0) {
    return <p className="p-8 text-center text-sm text-ink-muted">Loading…</p>;
  }

  const anchorBook = zones[0].anchorBook;
  const anchorChapter = zones[0].anchorChapter;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-8 pb-8">
        {(levels.includes("book") || levels.includes("chapter")) && (
          <div className="flex flex-wrap items-center justify-center gap-2 pb-2 pt-6">
            {levels.includes("book") && <LocationTagField tagKey={locationTagKey({ level: "book", book: anchorBook })} />}
            {levels.includes("chapter") && (
              <LocationTagField tagKey={locationTagKey({ level: "chapter", book: anchorBook, chapter: anchorChapter })} />
            )}
          </div>
        )}

        {zones.map((zone) => {
          const learnDays = zoneLearnDays(zone);
          return (
            <div key={`${zone.zoneNumber}-${zone.label}`} className="flex w-full flex-col items-center">
              <div className="flex w-full max-w-xs flex-col items-center gap-1 pb-3 pt-6 text-center">
                <p className="text-title text-ink dark:text-zinc-100">
                  {zone.label} {zone.heading}
                </p>
                {levels.includes("pericope") && (
                  <LocationTagField
                    tagKey={locationTagKey({ level: "pericope", book: zone.anchorBook, chapter: zone.anchorChapter, pericopeLabel: zone.label })}
                  />
                )}
                <div className="mt-1 h-px w-full bg-mist dark:bg-zinc-700" />
              </div>

              {learnDays.map((day, index) => {
                const firstVerse = day.newVerses[0];
                const poa = firstVerse ? versePOA[verseKey(firstVerse.book, firstVerse.chapter, firstVerse.verseNumber)] : undefined;
                return (
                  <div key={day.dayNumber} className="flex flex-col items-center">
                    {index > 0 && <div className="h-8 w-1 bg-mist dark:bg-zinc-700" aria-hidden="true" />}
                    <div className="flex flex-col items-center gap-1.5">
                      <DayCircle
                        day={day}
                        isCompleted={day.dayNumber <= completedDays}
                        isUnlocked={day.dayNumber === activeDayNumber}
                        progress={0}
                        offset={index % 2 === 0 ? "left" : "right"}
                        versePOA={poa}
                        onSelect={() => onSelectDay(day.dayNumber)}
                        onPractice={() => onPracticeDay(day.dayNumber)}
                      />
                      {levels.includes("verse") && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {day.newVerses.map((verse) => (
                            <LocationTagField
                              key={verseKey(verse.book, verse.chapter, verse.verseNumber)}
                              tagKey={locationTagKey({ level: "verse", book: verse.book, chapter: verse.chapter, verseNumber: verse.verseNumber })}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

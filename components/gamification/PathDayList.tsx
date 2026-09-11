"use client";

import { useEffect, useRef } from "react";
import type { MemorizationDay } from "@/types";
import { buildPathZones } from "@/lib/pathZones";
import { computeZoneCardState, zoneShowsTodaysVerses } from "@/lib/pericopeCardState";
import { PericopeCard } from "@/components/gamification/PericopeCard";

interface PathDayListProps {
  days: MemorizationDay[];
  completedDays: number;
  onSelectDay: (dayNumber: number) => void;
  onPracticeDay: (dayNumber: number) => void;
}

// One dedicated card per pericope zone (see lib/pathZones.ts) — start/continue today's
// lesson, replay an already-finished section, or (locked) nothing yet, since a path only
// ever has one currently-actionable zone at a time (see lib/pericopeCardState.ts). A dotted
// rail runs down the left side connecting each card's own circle, checked off once done.
// Consecutive cards that are all part of today's one lesson (a lesson spanning a section
// break — see PathZone.spilloverVerses) visually merge into a single continuous box instead
// of reading as separate cards — see PericopeCard.tsx's connectToPrevious/connectToNext.
// Opening the path always scrolls the current card to the middle of the screen rather than
// leaving the reader to hunt for it. No location tags here — those are a Building-view-only
// feature (see BuildingRoomView.tsx).
export function PathDayList({ days, completedDays, onSelectDay, onPracticeDay }: PathDayListProps) {
  const zones = buildPathZones(days);
  const activeCardRef = useRef<HTMLDivElement | null>(null);
  const states = zones.map((zone) => computeZoneCardState(zone, completedDays));
  const showsToday = zones.map((zone, index) => zoneShowsTodaysVerses(zone, states[index], completedDays));

  useEffect(() => {
    activeCardRef.current?.scrollIntoView({ block: "center" });
  }, [completedDays]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-3 pb-8 pt-4">
        {zones.map((zone, index) => (
          <PericopeCard
            key={`${zone.zoneNumber}-${zone.label}`}
            zone={zone}
            state={states[index]}
            index={index}
            isLast={index === zones.length - 1}
            completedDays={completedDays}
            connectToPrevious={showsToday[index] && showsToday[index - 1] === true}
            connectToNext={showsToday[index] && showsToday[index + 1] === true}
            cardRef={states[index].status === "active" ? activeCardRef : undefined}
            onSelectDay={onSelectDay}
            onPracticeDay={onPracticeDay}
          />
        ))}
      </div>
    </div>
  );
}

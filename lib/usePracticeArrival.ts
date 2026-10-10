"use client";

import { useEffect, useRef } from "react";

// Home's "Review" on a finished lesson (TodayVersesCard.tsx) links to the Path tab with
// `?practiceDay=<day>`: once, on arrival, hands that day to `startPractice` so its review runs on
// the path — in place, like a spaced review.
export function practiceArrivalHref(pathKey: string, version: string, dayNumber: number): string {
  return `/path/${encodeURIComponent(pathKey)}?${new URLSearchParams({ version, practiceDay: String(dayNumber) })}`;
}

export function usePracticeArrival(startPractice: (dayNumber: number) => void): void {
  const doneRef = useRef(false);
  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const dayNumber = Number(new URLSearchParams(window.location.search).get("practiceDay"));
    if (dayNumber > 0) startPractice(dayNumber);
  }, [startPractice]);
}

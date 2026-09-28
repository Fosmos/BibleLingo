"use client";

import { useEffect, useRef } from "react";

// Home's "Go to your path" (TodayVersesCard.tsx) opens the path with ?today=1: the Mind Map then
// flies straight to the reader's pin — the verses they're on — just like its own "Back to my
// place" button (`locate`, see lib/useMindMapLocate.ts). Once per visit.
export function useLocateOnArrival(locate: () => void): void {
  const doneRef = useRef(false);
  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (new URLSearchParams(window.location.search).get("today") === "1") locate();
  }, [locate]);
}

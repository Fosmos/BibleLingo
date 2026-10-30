"use client";

import { useRouter } from "next/navigation";
import type { PathKind } from "@/types";
import { readerHref } from "@/lib/readerHref";
import type { TrailStop } from "@/lib/trailStops";

// Runs a path stop's lesson, review or practice in the reader, then comes back to `back`.
export function useStartStop(pathKey: string, version: string, kind: PathKind, back: "quest" | "duo") {
  const router = useRouter();
  const verseOf = (stop: TrailStop) => (stop.verse && kind !== "verse" ? `${stop.verse.chapter}:${stop.verse.verseNumber}` : undefined);
  return {
    start: (stop: TrailStop, practise: boolean) =>
      router.push(stop.review ? readerHref(pathKey, version, { passage: stop.review, day: stop.dayNumber }, back) : practise ? readerHref(pathKey, version, { practiceDay: stop.dayNumber, verse: verseOf(stop) }, back) : readerHref(pathKey, version, { learnDay: stop.dayNumber, verse: verseOf(stop) }, back)),
    review: (ids: string[]) => router.push(readerHref(pathKey, version, { review: ids }, back)),
  };
}

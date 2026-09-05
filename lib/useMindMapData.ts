"use client";

import { useEffect, useState } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { applyReferencePreference } from "@/lib/chapterContent";
import { resolvePath, parsePathKey } from "@/lib/memorizationContent";
import { ensurePathVerses, pathContentMatchesVersion, BibleFetchError } from "@/lib/bibleApiClient";
import { setCachedChapter } from "@/lib/bibleContentCache";
import { usePericopesReady } from "@/lib/usePericopesReady";
import { useHasMounted } from "@/lib/useHasMounted";
import { buildPathZones, type PathZone } from "@/lib/pathZones";
import { computeZoneCardState, type PericopeCardState, type PericopeCardStatus } from "@/lib/pericopeCardState";

export interface ChapterNode {
  chapter: number;
  status: PericopeCardStatus;
  // This chapter's own slice of the full day plan — handed straight to PathDayList.tsx (the
  // same component the real path screen renders) once a pericope in this chapter is opened,
  // so its own pericope cards/grids/Learn buttons are pixel-for-pixel the real thing, not a
  // mind-map-specific re-derivation of the same state.
  days: MemorizationDay[];
  // The same zones/states PathDayList itself would compute from `days` above — kept here too
  // so the mind map's own small inline pericope-branch nodes (MindMapPericopeNode.tsx) can
  // show each pericope's real status/short label without rendering a full PathDayList just
  // to read it.
  zones: PathZone[];
  states: PericopeCardState[];
}

export type MindMapData =
  | { status: "no-path" }
  | { status: "loading" }
  | { status: "error"; message: string; retry: () => void }
  | { status: "ready"; pathKey: string; label: string; completedDays: number; chapters: ChapterNode[] };

// A whole chapter's own status, mirroring computeZoneCardState's own three-state read on a
// single pericope zone (lib/pericopeCardState.ts) — "active" the moment any of its days is
// the one currently up next, "completed" once every one of its days (learn lessons and any
// weekly/monthly capstones tagged into it) is behind completedDays, "locked" otherwise. A
// chapter's days are always contiguous in dayNumber (same guarantee a PathZone's own days
// carry), so this never needs to represent "partially done."
function chapterStatus(chapterDays: MemorizationDay[], completedDays: number): PericopeCardStatus {
  if (chapterDays.some((day) => day.dayNumber === completedDays + 1)) return "active";
  if (chapterDays.length > 0 && chapterDays.every((day) => day.dayNumber <= completedDays)) return "completed";
  return "locked";
}

// Loads and shapes everything the Mind Map (components/gamification/MindMapScreen.tsx) needs
// to draw the CURRENTLY ACTIVE book path's own chapter/pericope tree — deliberately mirrors
// PathOverviewScreen.tsx's own data pipeline (same resolvePath/ensurePathVerses/
// buildPathDayPlan calls) so this view can never show a structure that disagrees with the
// real path screen for the same book. Scoped to "book" kind paths only — chapter/verse/topic
// paths have no chapter tier to draw a tree from, so those (and no active path at all) report
// "no-path".
export function useMindMapData(): MindMapData {
  const mounted = useHasMounted();
  const activePathKey = useProgressStore((state) => state.activePathKey);
  const plan = useProgressStore((state) => (activePathKey ? state.paths[activePathKey] : undefined));
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);

  const key = activePathKey ?? "";
  const isBookPath = activePathKey ? parsePathKey(activePathKey).kind === "book" : false;
  const version = plan?.version ?? "";

  const [verses, setVerses] = useState<VerseSegment[] | null>(() =>
    isBookPath && pathContentMatchesVersion(key, version) ? (resolvePath(key)?.verses ?? null) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // Re-checks on every key/version change (switching the active path, or its translation)
  // rather than only on mount — same reasoning as PathOverviewScreen.tsx's identical guard.
  const versionCheckKey = `${key}|${version}`;
  const [lastVersionCheckKey, setLastVersionCheckKey] = useState(versionCheckKey);
  if (lastVersionCheckKey !== versionCheckKey) {
    setLastVersionCheckKey(versionCheckKey);
    if (verses && !pathContentMatchesVersion(key, version)) setVerses(null);
  }

  useEffect(() => {
    if (!isBookPath || !plan || verses) return;
    let cancelled = false;
    ensurePathVerses(key, version)
      .then((loaded) => {
        if (cancelled) return;
        if (loaded) setVerses(loaded);
        else setError(`No content found for ${key}.`);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof BibleFetchError ? err.message : "Couldn't load this content.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version, isBookPath, verses, retryToken]);

  const pericopesReady = usePericopesReady(verses);

  if (!mounted) return { status: "loading" };
  if (!activePathKey || !isBookPath || !plan) return { status: "no-path" };
  if (error) {
    return {
      status: "error",
      message: error,
      retry: () => {
        setError(null);
        setRetryToken((token) => token + 1);
      },
    };
  }
  if (!verses || !pericopesReady) return { status: "loading" };

  // Re-primes the shared chapter-content cache from the whole book's verses this hook
  // already holds, one chapter at a time — a pericope's own closing verse (see
  // lib/chapterPericopes.ts's buildPericopeInfo) falls back to that cache's chapter length
  // whenever it's the LAST pericope in its chapter, but that cache only durably keeps a
  // handful of chapters at once for ESV content (lib/bibleContentCache.ts's own eviction
  // cap), and this is the one place in the app that needs every chapter's own count
  // available AT ONCE rather than just whichever one is currently on screen. Idempotent
  // (re-writing exactly what was already fetched) and cheap, so doing it inline here each
  // time this recomputes is safe — see React's own guidance on caching writes during render.
  const versesByChapter = new Map<number, VerseSegment[]>();
  for (const verse of verses) {
    versesByChapter.set(verse.chapter, [...(versesByChapter.get(verse.chapter) ?? []), verse]);
  }
  for (const [chapterNumber, chapterVerses] of versesByChapter) {
    setCachedChapter(chapterVerses[0].book, chapterNumber, plan.version, chapterVerses);
  }

  const days = buildPathDayPlan(key, applyReferencePreference(verses, includeVerseReferences), plan);
  const chapterNumbers = Array.from(
    new Set(days.map((day) => day.chapterGroup).filter((group): group is number => group !== undefined)),
  ).sort((a, b) => a - b);

  const chapters: ChapterNode[] = chapterNumbers.map((chapter) => {
    const chapterDays = days.filter((day) => day.chapterGroup === chapter);
    const zones = buildPathZones(chapterDays);
    const states = zones.map((zone) => computeZoneCardState(zone, plan.completedDays));
    return { chapter, status: chapterStatus(chapterDays, plan.completedDays), days: chapterDays, zones, states };
  });

  return {
    status: "ready",
    pathKey: key,
    label: parsePathKey(key).identifier,
    completedDays: plan.completedDays,
    chapters,
  };
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { MemorizationDay, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { applyReferencePreference } from "@/lib/chapterContent";
import { resolvePath } from "@/lib/memorizationContent";
import { ensurePathVerses, pathContentMatchesVersion, BibleFetchError } from "@/lib/bibleApiClient";
import { setCachedChapter } from "@/lib/bibleContentCache";
import { usePericopesReady } from "@/lib/usePericopesReady";
import { useHasMounted } from "@/lib/useHasMounted";
import { buildPathZones, type PathZone } from "@/lib/pathZones";
import { computeZoneCardState, type PericopeCardState, type PericopeCardStatus } from "@/lib/pericopeCardState";
import { todaysDayNumber } from "@/lib/dayRollover";
import { activePathScope, mapHostPathKey, pathBookName } from "@/lib/mindMapPathTarget";
import { useActivePathKeys } from "@/lib/useActivePathKeys";
import { NO_LOCATION_TAG_LEVELS } from "@/lib/locationTags";

export interface ChapterNode {
  chapter: number;
  status: PericopeCardStatus;
  // This chapter's own slice of the full day plan — handed straight to PathDayList.tsx (the
  // same component the real path screen renders) once a pericope in this chapter is opened,
  // so its own pericope cards/grids/Learn buttons are pixel-for-pixel the real thing, not a
  // mind-map-specific re-derivation of the same state.
  days: MemorizationDay[];
  // The same zones/states PathDayList itself would compute from `days` above — kept here too
  // so the mind map's own tree (see lib/mindMapHierarchy.ts's buildMindMapTree) can shape
  // each pericope's real status/verses/label without rendering a full PathDayList just to
  // read it.
  zones: PathZone[];
  states: PericopeCardState[];
}

export type MindMapData =
  | { status: "no-path" }
  | { status: "loading" }
  | { status: "error"; message: string; retry: () => void }
  | {
      status: "ready";
      // The path drawn — see mapHostPathKey (may be broader than the focused path).
      pathKey: string;
      label: string;
      version: string;
      completedDays: number;
      todaysDay: number;
      chapters: ChapterNode[];
      // Its whole day plan and verses, built exactly as PathOverviewScreen.tsx builds them — so a
      // lesson tapped on the map can run from this path when the page's own path doesn't cover it.
      days: MemorizationDay[];
      verses: VerseSegment[];
    };

// A whole chapter's own status, mirroring computeZoneCardState's own three-state read on a
// single pericope zone (lib/pericopeCardState.ts) — "active" (amber) whenever any of its days
// is TODAY's own lesson (see lib/dayRollover.ts's todaysDayNumber — always real, so a chapter
// stays amber for today's just-finished lesson too, not just an upcoming one), "completed"
// once every one of its days (learn lessons and any weekly/monthly capstones tagged into it)
// is behind completedDays, "locked" otherwise. A chapter's days are always contiguous in
// dayNumber (same guarantee a PathZone's own days carry), so this never needs to represent
// "partially done."
function chapterStatus(chapterDays: MemorizationDay[], completedDays: number, todaysDay: number): PericopeCardStatus {
  if (chapterDays.some((day) => day.dayNumber === todaysDay)) return "active";
  if (chapterDays.length > 0 && chapterDays.every((day) => day.dayNumber <= completedDays)) return "completed";
  return "locked";
}

// Loads and shapes everything the Mind Map (components/gamification/MindMapScreen.tsx) needs
// to draw the CURRENTLY ACTIVE book path's own chapter/pericope tree — deliberately mirrors
// PathOverviewScreen.tsx's own data pipeline (same resolvePath/ensurePathVerses/
// buildPathDayPlan calls) so this view can never show a structure that disagrees with the
// real path screen for the same book. Book, chapter and verse paths all draw here — a chapter or
// verse path is simply a book with just its own one chapter filled in. A topic path (verses from
// all over) and no active path at all report "no-path", which shows the bare canon to pick from.
export function useMindMapData(focusedKey: string | null): MindMapData {
  const mounted = useHasMounted();
  const activeKeys = useActivePathKeys();
  const activePathKey = focusedKey ? mapHostPathKey(focusedKey, activeKeys) : null;
  const plan = useProgressStore((state) => (activePathKey ? state.paths[activePathKey] : undefined));
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  const pegSystemEnabled = useProgressStore((state) => state.pegSystemEnabled);
  const locationTagLevels = useProgressStore((state) => state.locationTagLevels) ?? NO_LOCATION_TAG_LEVELS;

  const key = activePathKey ?? "";
  const scope = activePathScope(activePathKey);
  const isMappable = scope !== undefined;
  const version = plan?.version ?? "";

  const [verses, setVerses] = useState<VerseSegment[] | null>(() =>
    isMappable && pathContentMatchesVersion(key, version) ? (resolvePath(key)?.verses ?? null) : null,
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
    if (!isMappable || !plan || verses) return;
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
  }, [key, version, isMappable, verses, retryToken]);

  const pericopesReady = usePericopesReady(verses);

  // Only recomputes when something REAL changes (the verses/plan content itself) — not on
  // every unrelated store write (a checkpoint save mid-lesson, say). Before this was memoized,
  // `chapters` was a fresh array on literally every render of any consumer (MindMapScreen.tsx),
  // which was harmless in isolation but, once the Mind Map canvas started staying mounted
  // alongside an active in-place lesson (see BookMindMapWithLessonSheet.tsx), fed a rapid
  // re-render loop into BookMindMap.tsx's own `tree`/`layout` useMemos — the same class of bug
  // already fixed once this session in LearnMindMapSpotlight.tsx (see that file's own doc
  // comment): renders arriving faster than a Framer Motion transition can finish leaves it
  // permanently stuck at its own `initial` state. Called unconditionally, alongside every
  // other hook here, since hooks can't run after an early return.
  const readyData = useMemo(() => {
    if (!verses || !plan) return null;
    // Re-primes the shared chapter-content cache from the whole book's verses this hook
    // already holds, one chapter at a time — a pericope's own closing verse (see
    // lib/chapterPericopes.ts's buildPericopeInfo) falls back to that cache's chapter length
    // whenever it's the LAST pericope in its chapter, but that cache only durably keeps a
    // handful of chapters at once for ESV content (lib/bibleContentCache.ts's own eviction
    // cap), and this is the one place in the app that needs every chapter's own count
    // available AT ONCE rather than just whichever one is currently on screen. Idempotent
    // (re-writing exactly what was already fetched) and cheap.
    const versesByChapter = new Map<number, VerseSegment[]>();
    for (const verse of verses) {
      versesByChapter.set(verse.chapter, [...(versesByChapter.get(verse.chapter) ?? []), verse]);
    }
    // Never from a verse path, whose content is that one verse, not its whole chapter.
    for (const [chapterNumber, chapterVerses] of scope?.kind === "verse" ? [] : versesByChapter) {
      setCachedChapter(chapterVerses[0].book, chapterNumber, plan.version, chapterVerses);
    }

    const planDays = buildPathDayPlan(key, applyReferencePreference(verses, includeVerseReferences), plan, pegSystemEnabled, locationTagLevels);
    // Book paths tag every day with its chapter; a chapter/verse path's days all sit in the one
    // chapter its key names.
    const days = planDays.map((day) => (day.chapterGroup === undefined && scope?.chapter !== undefined ? { ...day, chapterGroup: scope.chapter } : day));
    const chapterNumbers = Array.from(
      new Set(days.map((day) => day.chapterGroup).filter((group): group is number => group !== undefined)),
    ).sort((a, b) => a - b);

    const todaysDay = todaysDayNumber(plan, new Date());
    const chapters: ChapterNode[] = chapterNumbers.map((chapter) => {
      const chapterDays = days.filter((day) => day.chapterGroup === chapter);
      // A standalone review day (a chapter/verse path's weekly or monthly review) has no verses of
      // its own to learn, so it isn't a hall on the map.
      const zones = buildPathZones(chapterDays).filter((zone) => zone.days.some((day) => day.kind === "learn"));
      const states = zones.map((zone) => computeZoneCardState(zone, plan.completedDays, todaysDay));
      return { chapter, status: chapterStatus(chapterDays, plan.completedDays, todaysDay), days: chapterDays, zones, states };
    });
    return { chapters, todaysDay, days: planDays };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key`/`plan.completedDays`/`plan.version` are already covered by `plan`/`version` itself
  }, [key, version, plan, includeVerseReferences, pegSystemEnabled, locationTagLevels, verses]);

  if (!mounted) return { status: "loading" };
  if (!activePathKey || !isMappable || !plan) return { status: "no-path" };
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
  if (!verses || !pericopesReady || !readyData) return { status: "loading" };

  return {
    status: "ready",
    pathKey: key,
    label: pathBookName(key),
    version: plan.version,
    completedDays: plan.completedDays,
    todaysDay: readyData.todaysDay,
    chapters: readyData.chapters,
    days: readyData.days,
    verses,
  };
}

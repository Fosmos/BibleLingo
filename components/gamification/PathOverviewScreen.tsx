"use client";

import { useEffect, useState } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { NO_LOCATION_TAG_LEVELS } from "@/lib/locationTags";
import { buildPathDayPlan, priorKnownDayCount } from "@/lib/dayPlan";
import { applyReferencePreference } from "@/lib/chapterContent";
import { resolvePath, parsePathKey } from "@/lib/memorizationContent";
import { ensurePathVerses, pathContentMatchesVersion, BibleFetchError } from "@/lib/bibleApiClient";
import { useHasMounted } from "@/lib/useHasMounted";
import { usePericopesReady } from "@/lib/usePericopesReady";
import { resolveBookChapterView } from "@/lib/bookChapterView";
import { useMindMapSelection } from "@/lib/useMindMapSelection";
import { activeDayNumber, todaysDayNumber } from "@/lib/dayRollover";
import { DayPathDiagram } from "@/components/gamification/DayPathDiagram";
import { InPlaceLessonSession } from "@/components/gamification/InPlaceLessonSession";
import { BookMindMapWithLessonSheet } from "@/components/gamification/BookMindMapWithLessonSheet";
import { ChapterPathScreen } from "@/components/gamification/ChapterPathScreen";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface PathOverviewScreenProps {
  pathKey: string;
  label: string;
  version: string;
  versesPerDay?: number;
  startLesson?: boolean; // see BookMindMapWithLessonSheet.tsx's `autoStartLesson`
  // GuidedPathFlow.tsx's "I've already learned some of this" step — arrives once (PathProgress.priorKnownVerseCount).
  priorKnownVerseCount?: number;
  // "map" — the Mind Map tab (app/path/[key]/map); otherwise the Path tab's chapter path view.
  view?: "path" | "map";
}

export function PathOverviewScreen({ pathKey: key, label, version, versesPerDay, startLesson, priorKnownVerseCount, view = "path" }: PathOverviewScreenProps) {
  // `verses` is seeded from the localStorage cache (empty during SSR) — gating on `mounted` keeps the first paint stable.
  const mounted = useHasMounted();
  const plan = useProgressStore((state) => state.paths[key]);
  const setPath = useProgressStore((state) => state.setPath);
  const setActivePath = useProgressStore((state) => state.setActivePath);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  const pegSystemEnabled = useProgressStore((state) => state.pegSystemEnabled);
  const locationTagLevels = useProgressStore((state) => state.locationTagLevels) ?? NO_LOCATION_TAG_LEVELS;

  // resolvePath() ignores translation — checked during render, not an effect, same pattern as chapterOverride below.
  const [verses, setVerses] = useState<VerseSegment[] | null>(() =>
    pathContentMatchesVersion(key, version) ? (resolvePath(key)?.verses ?? null) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const versionCheckKey = `${key}|${version}`;
  const [lastVersionCheckKey, setLastVersionCheckKey] = useState(versionCheckKey);
  if (lastVersionCheckKey !== versionCheckKey) {
    setLastVersionCheckKey(versionCheckKey);
    if (verses && !pathContentMatchesVersion(key, version)) setVerses(null);
  }
  // The Mind Map's own nav: null shows the map; a chapter number shows that chapter's parchment view (lib/useMindMapSelection.ts).
  const { chapterOverride, targetVerse, setChapterOverride, selectPericope, reset: resetMindMapSelection } = useMindMapSelection();
  // A lesson/practice session, rendered right here instead of navigating away (InPlaceLessonSession.tsx) — null means none running.
  const [lessonDay, setLessonDay] = useState<{ dayNumber: number; mode: "select" | "practice" } | null>(null);
  const [overrideResetKey, setOverrideResetKey] = useState(key);
  if (key !== overrideResetKey) {
    setOverrideResetKey(key);
    resetMindMapSelection();
    setLessonDay(null);
  }

  useEffect(() => {
    setActivePath(key);
  }, [key, setActivePath]);
  useEffect(() => {
    if (verses) return;
    let cancelled = false;
    ensurePathVerses(key, version)
      .then((loaded) => {
        if (cancelled) return;
        if (loaded) setVerses(loaded);
        else setError(`No content found for ${label}.`);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof BibleFetchError ? err.message : "Couldn't load this content.");
      });
    return () => {
      cancelled = true;
    };
  }, [key, version, label, verses, retryToken]);

  // Also re-runs when an existing plan's version/versesPerDay doesn't match what was just picked.
  useEffect(() => {
    if (!verses) return;
    const versesPerDayChanged = versesPerDay !== undefined && plan?.versesPerDay !== versesPerDay;
    if (!plan || plan.version !== version || versesPerDayChanged) {
      // How many auto-completed days that prior-known verse count actually becomes (see
      // lib/dayPlan.ts's own doc comment — book mode's own prefix can span several chapters,
      // one day each, not always just one) — computed here, the one place this effect already
      // has both the real `verses` AND this path's own `kind` in hand.
      const priorKnownDays = priorKnownVerseCount ? priorKnownDayCount(verses, priorKnownVerseCount, parsePathKey(key).kind) : 0;
      setPath(key, version, versesPerDay, priorKnownVerseCount, priorKnownDays);
    }
  }, [plan, verses, key, version, versesPerDay, priorKnownVerseCount, setPath]);
  const pericopesReady = usePericopesReady(verses);
  // Wins over every other early return below — the only one identical between server/client.
  if (!mounted) return <FetchLoading label={`Loading ${label}…`} />;

  if (error) {
    return (
      <FetchError
        message={error}
        onRetry={() => {
          setError(null);
          setRetryToken((token) => token + 1);
        }}
      />
    );
  }
  if (!verses) return <FetchLoading label={`Loading ${label}…`} />;
  // Waits for section-heading data before chunking (see lib/usePericopesReady.ts).
  if (!pericopesReady) return <FetchLoading label={`Loading ${label}…`} />;
  if (!plan) return null;

  const days = buildPathDayPlan(key, applyReferencePreference(verses, includeVerseReferences), plan, pegSystemEnabled, locationTagLevels);
  const now = new Date();
  const activeDay = activeDayNumber(plan, now);
  const todaysDay = todaysDayNumber(plan, now);
  const { kind } = parsePathKey(key);
  // Wins over everything below — stays mounted here until it exits.
  if (lessonDay) {
    return (
      <InPlaceLessonSession
        pathKey={key}
        label={label}
        days={days}
        verses={verses}
        version={version}
        completedDays={plan.completedDays}
        todaysDay={todaysDay}
        dayNumber={lessonDay.dayNumber}
        mode={lessonDay.mode}
        onExit={() => setLessonDay(null)}
      />
    );
  }

  // Book, chapter and verse paths: the Path tab's chapter path view (ChapterPathScreen.tsx), or
  // the Mind Map tab's canon view (BookMindMapWithLessonSheet.tsx). Topic paths get the day list.
  const onMindMap = kind === "book" || kind === "chapter" || kind === "verse";
  if (onMindMap && view === "path") {
    return (
      <ChapterPathScreen
        key={key}
        pathKey={key}
        label={label}
        days={days}
        verses={verses}
        version={version}
        completedDays={plan.completedDays}
        todaysDay={todaysDay}
        autoStartLesson={startLesson}
      />
    );
  }
  if (onMindMap && chapterOverride === null) {
    return (
      <BookMindMapWithLessonSheet
        key={key}
        pathKey={key}
        label={label}
        days={days}
        verses={verses}
        version={version}
        completedDays={plan.completedDays}
        todaysDay={todaysDay}
        onSelectChapter={selectPericope}
        autoStartLesson={startLesson}
      />
    );
  }

  const { visibleDays, title, chapterMemorizedFraction, onNextChapter, onPreviousChapter } = resolveBookChapterView(kind, days, plan, todaysDay, label, chapterOverride, setChapterOverride);

  const diagram = (
    <DayPathDiagram
      label={title}
      version={version}
      days={visibleDays}
      completedDays={plan.completedDays}
      activeDayNumber={activeDay}
      todaysDayNumber={todaysDay}
      chapterMemorizedFraction={chapterMemorizedFraction}
      onSelectDay={(dayNumber) => setLessonDay({ dayNumber, mode: "select" })}
      onPracticeDay={(dayNumber) => setLessonDay({ dayNumber, mode: "practice" })}
      onNextChapter={onNextChapter}
      onPreviousChapter={onPreviousChapter}
      onShowMindMap={onMindMap ? () => setChapterOverride(null) : undefined}
      targetVerse={targetVerse}
    />
  );

  return diagram;
}

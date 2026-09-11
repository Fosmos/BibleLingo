"use client";

import { useEffect, useState } from "react";
import type { LocationTagLevel, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { applyReferencePreference } from "@/lib/chapterContent";
import { resolvePath, parsePathKey } from "@/lib/memorizationContent";
import { ensurePathVerses, pathContentMatchesVersion, BibleFetchError } from "@/lib/bibleApiClient";
import { useHasMounted } from "@/lib/useHasMounted";
import { usePericopesReady } from "@/lib/usePericopesReady";
import { resolveBookChapterView } from "@/lib/bookChapterView";
import { useMindMapSelection } from "@/lib/useMindMapSelection";
import { useJumpToTodayVerse } from "@/lib/useJumpToTodayVerse";
import { activeDayNumber, todaysDayNumber } from "@/lib/dayRollover";
import { DayPathDiagram } from "@/components/gamification/DayPathDiagram";
import { MindMapScreen } from "@/components/gamification/MindMapScreen";
import { InPlaceLessonSession } from "@/components/gamification/InPlaceLessonSession";
// TEMPORARILY DISABLED along with its own usage below — see that comment.
// import { DailyChapterReviewGate } from "@/components/gamification/DailyChapterReviewGate";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface PathOverviewScreenProps {
  pathKey: string;
  label: string;
  version: string;
  versesPerDay?: number;
  locationTagLevels?: LocationTagLevel[];
  sectionEndPegEnabled?: boolean;
  jumpToToday?: boolean; // see lib/useJumpToTodayVerse.ts
}

export function PathOverviewScreen({
  pathKey: key,
  label,
  version,
  versesPerDay,
  locationTagLevels,
  sectionEndPegEnabled,
  jumpToToday,
}: PathOverviewScreenProps) {
  // `verses` below is lazily seeded from the localStorage-backed content cache, which may
  // already be populated on the client's first render but is always empty during SSR —
  // gating on `mounted` keeps the first paint a stable FetchLoading placeholder either way.
  const mounted = useHasMounted();
  const plan = useProgressStore((state) => state.paths[key]);
  const setPath = useProgressStore((state) => state.setPath);
  const setActivePath = useProgressStore((state) => state.setActivePath);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  const pegSystemEnabled = useProgressStore((state) => state.pegSystemEnabled);

  // resolvePath() ignores translation — checked during render (not an effect, avoiding a
  // setState-in-effect lint error), same pattern as chapterOverride below.
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
  // Book mode's own nav between its two screens: null shows the Mind Map (see render below);
  // a chapter number shows that chapter's parchment view, optionally with a specific verse to
  // open straight to (see lib/useMindMapSelection.ts). Never persisted; reset below when the
  // path changes (React's own "adjusting state when a prop changes" pattern).
  const { chapterOverride, targetVerse, setChapterOverride, selectPericope, reset: resetMindMapSelection } = useMindMapSelection();
  useJumpToTodayVerse(key, jumpToToday, verses, plan, includeVerseReferences, pegSystemEnabled, selectPericope);
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

  // Also re-runs when an EXISTING plan's version/versesPerDay doesn't match what was just
  // selected, so re-picking either for an already-started path doesn't leave it stuck at the
  // original choice. locationTagLevels/sectionEndPegEnabled only ever arrive once at creation.
  useEffect(() => {
    if (!verses) return;
    const versesPerDayChanged = versesPerDay !== undefined && plan?.versesPerDay !== versesPerDay;
    if (!plan || plan.version !== version || versesPerDayChanged) {
      setPath(key, version, versesPerDay, locationTagLevels, sectionEndPegEnabled);
    }
  }, [plan, verses, key, version, versesPerDay, locationTagLevels, sectionEndPegEnabled, setPath]);

  const pericopesReady = usePericopesReady(verses);

  // Must win over every other early return below — the only one guaranteed identical between
  // server and client's first render, since the others can already hold client-only values.
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
  // Waits for section-heading data before chunking — must never disagree with a specific
  // lesson's own loader (DayLoader) for the same day number (see lib/usePericopesReady.ts).
  if (!pericopesReady) return <FetchLoading label={`Loading ${label}…`} />;
  if (!plan) return null;

  const days = buildPathDayPlan(key, applyReferencePreference(verses, includeVerseReferences), plan, pegSystemEnabled);
  const now = new Date();
  const activeDay = activeDayNumber(plan, now);
  const todaysDay = todaysDayNumber(plan, now);
  const { kind } = parsePathKey(key);

  // Wins over everything below — stays mounted right here until it exits.
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

  // Book opens on its own Mind Map — tapping a pericope sets chapterOverride + targetVerse;
  // "Back" returns here (onShowMindMap). Other kinds skip this.
  if (kind === "book" && chapterOverride === null) {
    return <MindMapScreen onSelectChapter={selectPericope} />;
  }

  const { visibleDays, title, chapterMemorizedFraction, onNextChapter, onPreviousChapter } = resolveBookChapterView(
    kind,
    days,
    plan,
    todaysDay,
    label,
    chapterOverride,
    setChapterOverride,
  );

  const diagram = (
    <DayPathDiagram
      label={title}
      version={version}
      days={visibleDays}
      allDays={days}
      completedDays={plan.completedDays}
      activeDayNumber={activeDay}
      todaysDayNumber={todaysDay}
      pathKey={key}
      chapterMemorizedFraction={chapterMemorizedFraction}
      onSelectDay={(dayNumber) => setLessonDay({ dayNumber, mode: "select" })}
      onPracticeDay={(dayNumber) => setLessonDay({ dayNumber, mode: "practice" })}
      onNextChapter={onNextChapter}
      onPreviousChapter={onPreviousChapter}
      onShowMindMap={kind === "book" ? () => setChapterOverride(null) : undefined}
      targetVerse={targetVerse}
    />
  );

  // TEMPORARILY DISABLED — the once-a-day chapter recap gate (DailyChapterReviewGate) is
  // switched off for now; see git history for the wrapped-`diagram` version that re-enables it.

  return diagram;
}

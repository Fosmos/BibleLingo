"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LocationTagLevel, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { applyReferencePreference } from "@/lib/chapterContent";
import { resolvePath, parsePathKey } from "@/lib/memorizationContent";
import { ensurePathVerses, pathContentMatchesVersion, BibleFetchError } from "@/lib/bibleApiClient";
import { useHasMounted } from "@/lib/useHasMounted";
import { usePericopesReady } from "@/lib/usePericopesReady";
import { activeDayNumber, todaysDayNumber } from "@/lib/dayRollover";
import { DayPathDiagram } from "@/components/gamification/DayPathDiagram";
// TEMPORARILY DISABLED along with its own usage below — see that comment.
// import { DailyChapterReviewGate } from "@/components/gamification/DailyChapterReviewGate";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface PathOverviewScreenProps {
  pathKey: string;
  label: string;
  version: string;
  versesPerDay?: number;
  locationTagLevels?: LocationTagLevel[];
  // See GuidedPathFlow.tsx's "I've already learned some of this" step — arrives once, at creation.
  startAtCompletedDays?: number;
}

export function PathOverviewScreen({
  pathKey: key,
  label,
  version,
  versesPerDay,
  locationTagLevels,
  startAtCompletedDays,
}: PathOverviewScreenProps) {
  const router = useRouter();
  // `verses` below is lazily seeded from the localStorage-backed content cache (via
  // resolvePath), which is empty during SSR but may already be populated on the client's
  // very first render — letting that decide the first paint's output would make server and
  // client disagree on what to render (React hydration mismatch). Gating on `mounted`
  // (false during SSR and the client's hydration render, true only afterward) guarantees the
  // first paint is always the same FetchLoading placeholder everywhere; the real,
  // possibly-cached content takes over on the very next render.
  const mounted = useHasMounted();
  const plan = useProgressStore((state) => state.paths[key]);
  const setPath = useProgressStore((state) => state.setPath);
  const setActivePath = useProgressStore((state) => state.setActivePath);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);

  // resolvePath() ignores translation — a chapter cached under a different version than
  // the one just selected would otherwise be trusted as-is, silently showing the wrong
  // translation's text with no fetch and no error. See pathContentMatchesVersion. Checked
  // during render (not an effect) whenever key/version change, same pattern as
  // chapterOverride below, so an on-mismatch reset can't itself trigger a setState-in-effect lint error.
  const [verses, setVerses] = useState<VerseSegment[] | null>(() =>
    pathContentMatchesVersion(key, version) ? (resolvePath(key)?.verses ?? null) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const versionCheckKey = `${key}|${version}`;
  const [lastVersionCheckKey, setLastVersionCheckKey] = useState(versionCheckKey);
  if (lastVersionCheckKey !== versionCheckKey) {
    setLastVersionCheckKey(versionCheckKey);
    if (verses && !pathContentMatchesVersion(key, version)) {
      setVerses(null);
    }
  }
  // Testing-only: lets a tester preview later chapters' circles without actually
  // completing everything before them — never persisted, purely a local view override.
  // Reset during render (not an effect) when the path changes, per React's recommended
  // "adjusting state when a prop changes" pattern.
  const [chapterOverride, setChapterOverride] = useState<number | null>(null);
  const [overrideResetKey, setOverrideResetKey] = useState(key);
  if (key !== overrideResetKey) {
    setOverrideResetKey(key);
    setChapterOverride(null);
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

  // Also re-runs when an EXISTING plan's version or versesPerDay doesn't match what was
  // just selected — otherwise re-picking a different translation (or a different
  // verses-per-day amount) for a path you'd already started would update this screen's own
  // content but leave plan.version/versesPerDay stuck at whatever they were first set to, so
  // every lesson (which reads the stored plan, not the URL) would keep silently using the
  // original choice forever. locationTagLevels only ever arrives once, from GuidedPathFlow's
  // own LocationTagLevelPicker step at path creation — never re-passed on a later visit — so
  // it's never treated as a "changed, re-apply" signal the way version/versesPerDay are.
  useEffect(() => {
    if (!verses) return;
    const versesPerDayChanged = versesPerDay !== undefined && plan?.versesPerDay !== versesPerDay;
    if (!plan || plan.version !== version || versesPerDayChanged) {
      setPath(key, version, versesPerDay, locationTagLevels, startAtCompletedDays);
    }
  }, [plan, verses, key, version, versesPerDay, locationTagLevels, startAtCompletedDays, setPath]);

  const pericopesReady = usePericopesReady(verses);

  // Must win over every other early return below — it's the only one guaranteed identical
  // between server and client's first render, since `error`/`verses`/`plan` can each already
  // hold client-only values (from the cache-seeded `verses` initializer above) by that point.
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
  // Waits for this path's section-heading data before chunking — buildPathDayPlan's lesson
  // boundaries must never disagree with what a specific lesson's own loader (DayLoader)
  // computes for the same day number (see lib/usePericopesReady.ts).
  if (!pericopesReady) return <FetchLoading label={`Loading ${label}…`} />;
  if (!plan) return null;

  const days = buildPathDayPlan(key, applyReferencePreference(verses, includeVerseReferences), plan);
  const basePath = `/path/${encodeURIComponent(key)}`;
  // See lib/dayRollover.ts: activeDay gates what's newly startable (never advances until a
  // real calendar day passes since the last completion); todaysDay is whichever day still
  // counts as "today" for display, whether or not it's already done.
  const now = new Date();
  const activeDay = activeDayNumber(plan, now);
  const todaysDay = todaysDayNumber(plan, now);

  // Book mode shows one chapter at a time rather than the whole book's lesson list —
  // the visible group is whichever chapter today's own day belongs to. Once every day in a
  // chapter's group is done, today's day naturally belongs to the next chapter (or, after
  // the last chapter, to the undefined-group whole-book capstone).
  const { kind } = parsePathKey(key);
  let visibleDays = days;
  let title = label;
  // Book mode only: fraction of THIS chapter's own verses memorized so far, in place of the
  // plain "N of M lessons complete" every other path kind shows — see DayPathDiagram.tsx.
  let chapterMemorizedFraction: number | undefined;
  let onNextChapter: (() => void) | undefined;
  let onPreviousChapter: (() => void) | undefined;
  if (kind === "book") {
    const chapterGroups = Array.from(
      new Set(days.map((day) => day.chapterGroup).filter((group): group is number => group !== undefined)),
    ).sort((a, b) => a - b);
    const nextDay = days.find((day) => day.dayNumber === todaysDay);
    const group = chapterOverride ?? nextDay?.chapterGroup;
    visibleDays = days.filter((day) => day.chapterGroup === group);
    if (group !== undefined) {
      // "Mark 14", matching chapter-mode's own title format — no separate "Chapter 14 of
      // 16" line.
      title = `${label} ${group}`;
      const learnDays = visibleDays.filter((day) => day.kind === "learn");
      const completedLearnDays = learnDays.filter((day) => day.dayNumber <= plan.completedDays).length;
      chapterMemorizedFraction = learnDays.length > 0 ? completedLearnDays / learnDays.length : 0;
      const groupIndex = chapterGroups.indexOf(group);
      if (groupIndex !== -1 && groupIndex < chapterGroups.length - 1) {
        onNextChapter = () => setChapterOverride(chapterGroups[groupIndex + 1]);
      }
      if (groupIndex > 0) {
        onPreviousChapter = () => setChapterOverride(chapterGroups[groupIndex - 1]);
      }
    } else if (chapterGroups.length > 0) {
      // Past every chapter (at the whole-book capstone) — still offer a way back into
      // the last chapter's circles for testing, since there's otherwise no entry point.
      onPreviousChapter = () => setChapterOverride(chapterGroups[chapterGroups.length - 1]);
    }
  }

  const diagram = (
    <DayPathDiagram
      label={title}
      days={visibleDays}
      completedDays={plan.completedDays}
      activeDayNumber={activeDay}
      todaysDayNumber={todaysDay}
      pathKey={key}
      chapterMemorizedFraction={chapterMemorizedFraction}
      onSelectDay={(dayNumber) => router.push(`${basePath}/day/${dayNumber}`)}
      onPracticeDay={(dayNumber) => router.push(`${basePath}/day/${dayNumber}/practice`)}
      onNextChapter={onNextChapter}
      onPreviousChapter={onPreviousChapter}
    />
  );

  // TEMPORARILY DISABLED — the once-a-day chapter recap gate (DailyChapterReviewGate) is
  // switched off for now; re-wrap `diagram` in it (see git history / below) to bring it back.
  // if (kind === "book" && buildingViewEnabled) {
  //   const reviewVerses = visibleDays
  //     .filter((day) => day.kind === "learn" && day.dayNumber <= plan.completedDays)
  //     .flatMap((day) => day.newVerses);
  //   return (
  //     <DailyChapterReviewGate pathKey={key} label={title} verses={reviewVerses}>
  //       {diagram}
  //     </DailyChapterReviewGate>
  //   );
  // }

  return diagram;
}

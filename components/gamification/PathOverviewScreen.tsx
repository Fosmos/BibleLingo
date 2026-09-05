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
import { resolveBookChapterView } from "@/lib/bookChapterView";
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
  sectionEndPegEnabled?: boolean;
}

export function PathOverviewScreen({
  pathKey: key,
  label,
  version,
  versesPerDay,
  locationTagLevels,
  sectionEndPegEnabled,
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
  // original choice forever. locationTagLevels/sectionEndPegEnabled only ever arrive once,
  // from GuidedPathFlow's own LocationTagLevelPicker step at path creation — never re-passed
  // on a later visit — so neither is ever treated as a "changed, re-apply" signal the way
  // version/versesPerDay are.
  useEffect(() => {
    if (!verses) return;
    const versesPerDayChanged = versesPerDay !== undefined && plan?.versesPerDay !== versesPerDay;
    if (!plan || plan.version !== version || versesPerDayChanged) {
      setPath(key, version, versesPerDay, locationTagLevels, sectionEndPegEnabled);
    }
  }, [plan, verses, key, version, versesPerDay, locationTagLevels, sectionEndPegEnabled, setPath]);

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

  const { kind } = parsePathKey(key);
  const { visibleDays, title, chapterMemorizedFraction, onNextChapter, onPreviousChapter } = resolveBookChapterView(
    kind,
    days,
    plan,
    label,
    chapterOverride,
    setChapterOverride,
  );

  const diagram = (
    <DayPathDiagram
      label={title}
      days={visibleDays}
      allDays={days}
      completedDays={plan.completedDays}
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

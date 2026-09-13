"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { applyReferencePreference } from "@/lib/chapterContent";
import { resolvePath } from "@/lib/memorizationContent";
import { ensurePathVerses, pathContentMatchesVersion, BibleFetchError } from "@/lib/bibleApiClient";
import { usePericopesReady } from "@/lib/usePericopesReady";
import { PracticeChain } from "@/components/drills/PracticeChain";
import { Button } from "@/components/ui/Button";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

interface PracticeLoaderProps {
  pathKey: string;
  label: string;
  dayNumber: number;
}

// Mirrors DayLoader's fetch/build logic, but renders the redoable first-letter practice
// drill instead of the real lesson session — no completeDay/streak/shekel side effects,
// and reachable regardless of lock state, since practice is meant to be revisited anytime
// both before and after a boss battle. Also doubles as the "Review" button's target for a
// completed learn lesson (see DayCircle.tsx) — practiceVerses below picks whichever field
// actually holds this day's own content: newVerses for a learn day (that lesson's own
// verses), falling back to reviewVerses for boss-battle days (newVerses is empty there).
export function PracticeLoader({ pathKey, label, dayNumber }: PracticeLoaderProps) {
  const router = useRouter();
  const plan = useProgressStore((state) => state.paths[pathKey]);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  // The version query param is what the path overview page treats as the source of truth
  // (see app/path/[key]/page.tsx) — omitting it would default to KJV and silently overwrite
  // an already-selected translation via PathOverviewScreen's sync effect.
  const pathHref = `/path/${encodeURIComponent(pathKey)}${plan ? `?version=${encodeURIComponent(plan.version)}` : ""}`;

  const [verses, setVerses] = useState<VerseSegment[] | null>(() =>
    plan && pathContentMatchesVersion(pathKey, plan.version) ? (resolvePath(pathKey)?.verses ?? null) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const versionCheckKey = `${pathKey}|${plan?.version ?? ""}`;
  const [lastVersionCheckKey, setLastVersionCheckKey] = useState(versionCheckKey);
  if (lastVersionCheckKey !== versionCheckKey) {
    setLastVersionCheckKey(versionCheckKey);
    if (verses && plan && !pathContentMatchesVersion(pathKey, plan.version)) {
      setVerses(null);
    }
  }

  useEffect(() => {
    if (verses || !plan) return;
    let cancelled = false;
    ensurePathVerses(pathKey, plan.version)
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
  }, [pathKey, plan, label, verses, retryToken]);

  const pericopesReady = usePericopesReady(verses);

  if (!plan) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 p-8 text-center">
        <h1 className="text-title">Start this path first</h1>
        <Button href={pathHref}>Back to {label}</Button>
      </div>
    );
  }

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
  if (!pericopesReady) return <FetchLoading label={`Loading ${label}…`} />;

  const days = buildPathDayPlan(pathKey, applyReferencePreference(verses, includeVerseReferences), plan);
  const day = days.find((candidate) => candidate.dayNumber === dayNumber);
  const practiceVerses = day ? (day.newVerses.length > 0 ? day.newVerses : day.reviewVerses) : [];
  // Matches whichever button got the reader here — DayCircle.tsx's Practice (boss battles)
  // or Review (a completed learn lesson's own verses) — see PracticeChain.tsx's own doc
  // comment on why Review always drills first-letter while Practice stays full-word.
  const isReview = day?.kind === "learn";
  const drillLabel = isReview ? "Review" : "Practice";

  if (!day || practiceVerses.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 p-8 text-center">
        <h1 className="text-title">Nothing to {drillLabel.toLowerCase()} yet</h1>
        <Button href={pathHref}>Back to {label}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <PracticeChain
        verses={practiceVerses}
        label={drillLabel}
        mode={isReview ? "firstLetter" : "fullWord"}
        onExit={() => router.push(pathHref)}
        sessionKey={`${pathKey}:${dayNumber}:practice`}
      />
    </div>
  );
}

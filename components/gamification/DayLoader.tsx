"use client";

import { useEffect, useState } from "react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { buildPathDayPlan } from "@/lib/dayPlan";
import { applyReferencePreference } from "@/lib/chapterContent";
import { resolvePath } from "@/lib/memorizationContent";
import { ensurePathVerses, pathContentMatchesVersion, BibleFetchError } from "@/lib/bibleApiClient";
import { DaySessionController } from "@/components/gamification/DaySessionController";
import { Button } from "@/components/ui/Button";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";
import { EsvAttribution } from "@/components/ui/EsvAttribution";

interface DayLoaderProps {
  pathKey: string;
  label: string;
  dayNumber: number;
}

export function DayLoader({ pathKey, label, dayNumber }: DayLoaderProps) {
  const plan = useProgressStore((state) => state.paths[pathKey]);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  // The version query param is what the path overview page treats as the source of truth
  // (see app/path/[key]/page.tsx) — omitting it would default to KJV and silently overwrite
  // an already-selected translation via PathOverviewScreen's sync effect.
  const pathHref = `/path/${encodeURIComponent(pathKey)}${plan ? `?version=${encodeURIComponent(plan.version)}` : ""}`;

  // resolvePath() ignores translation — a chapter cached under a different version than
  // this path's plan would otherwise be trusted as-is, silently showing the wrong
  // translation's text with no fetch and no error. See pathContentMatchesVersion. Checked
  // during render (not an effect) whenever pathKey/plan.version change, to avoid a
  // setState-in-effect lint error on the on-mismatch reset.
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

  if (!plan) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 p-8 text-center">
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

  const days = buildPathDayPlan(pathKey, applyReferencePreference(verses, includeVerseReferences), plan);
  const day = days.find((candidate) => candidate.dayNumber === dayNumber);

  if (!day) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 p-8 text-center">
        <h1 className="text-title">Lesson not found</h1>
        <Button href={pathHref}>Back to {label}</Button>
      </div>
    );
  }

  return (
    <>
      <DaySessionController pathKey={pathKey} label={label} day={day} totalDays={days.length} />
      <EsvAttribution visible={plan.version === "ESV"} />
    </>
  );
}

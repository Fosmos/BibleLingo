"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import type { VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { getCurrentDay } from "@/lib/progressSummary";
import { resolvePath, resolvePathLabel } from "@/lib/memorizationContent";
import { ensurePathVerses, pathContentMatchesVersion, BibleFetchError } from "@/lib/bibleApiClient";
import { Button } from "@/components/ui/Button";

const DAY_KIND_LABELS: Record<string, string> = {
  chapter_review: "Time for a full review!",
  boss_battle: "Time for your boss battle!",
  chapter_boss_battle: "Time for your chapter boss battle!",
  weekly_review: "Time for your weekly review!",
  monthly_review: "Time for your monthly review!",
};

export function TodayVersesCard() {
  const activePathKey = useProgressStore((state) => state.activePathKey);
  const paths = useProgressStore((state) => state.paths);
  const plan = activePathKey ? paths[activePathKey] : undefined;

  // resolvePath() reads from the client-side content cache, which is empty on a fresh
  // load and, for ESV, can be permanently missing chapters this path needs even after a
  // fetch (the storage cap means the persistent cache can never hold a whole book at once —
  // see ensureChapterLoaded). Verses live in local state — seeded synchronously from cache
  // when already present, or from ensurePathVerses()'s own return value otherwise — instead
  // of being re-derived from resolvePath() on every render, mirroring DayLoader.tsx, so a
  // book-mode ESV path's "today" can still be computed from what was just fetched even once
  // the persistent cache evicts part of it again.
  const [verses, setVerses] = useState<VerseSegment[] | null>(() =>
    activePathKey && plan && pathContentMatchesVersion(activePathKey, plan.version)
      ? (resolvePath(activePathKey)?.verses ?? null)
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const versionCheckKey = `${activePathKey ?? ""}|${plan?.version ?? ""}`;
  const [lastVersionCheckKey, setLastVersionCheckKey] = useState(versionCheckKey);
  if (lastVersionCheckKey !== versionCheckKey) {
    setLastVersionCheckKey(versionCheckKey);
    if (verses && activePathKey && plan && !pathContentMatchesVersion(activePathKey, plan.version)) {
      setVerses(null);
    }
    setError(null);
  }

  useEffect(() => {
    if (verses || !activePathKey || !plan) return;
    let cancelled = false;
    ensurePathVerses(activePathKey, plan.version)
      .then((loaded) => {
        if (cancelled) return;
        if (loaded) setVerses(loaded);
        else setError("Couldn't load today's verses.");
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof BibleFetchError ? err.message : "Couldn't load today's verses.");
      });
    return () => {
      cancelled = true;
    };
  }, [activePathKey, plan, verses, retryToken]);

  const currentDay = activePathKey && plan && verses ? getCurrentDay(activePathKey, verses, plan) : undefined;
  const label = activePathKey ? resolvePathLabel(activePathKey) : undefined;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none ${currentDay ? "flex-1" : ""}`}
    >
      <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">Today&apos;s Verses</p>
      {currentDay && activePathKey && plan ? (
        <>
          <p className="text-sm text-ink-muted">{label}</p>
          {currentDay.newVerses.length > 0 ? (
            <div className="flex flex-col gap-2">
              {currentDay.newVerses.slice(0, 2).map((verse) => (
                <div key={verse.id}>
                  <p className="text-sm font-semibold text-ink-soft dark:text-zinc-300">{verse.reference}</p>
                  <p className="line-clamp-2 text-sm text-ink-muted">{verse.text}</p>
                </div>
              ))}
              {currentDay.newVerses.length > 2 && (
                <p className="text-xs text-ink-muted">+{currentDay.newVerses.length - 2} more today</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">{DAY_KIND_LABELS[currentDay.kind] ?? "Continue your path"}</p>
          )}
          <Button
            // The version query param is what the path overview page treats as the source
            // of truth (see app/path/[key]/page.tsx) — omitting it would default to KJV and
            // silently overwrite an already-selected translation via PathOverviewScreen's
            // sync effect.
            href={`/path/${encodeURIComponent(activePathKey)}?version=${encodeURIComponent(plan.version)}`}
            className="self-start"
          >
            Go to your path
          </Button>
        </>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <p className="text-sm text-heart-700 dark:text-heart-300">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setRetryToken((token) => token + 1);
            }}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : activePathKey && plan ? (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm text-ink-muted">Loading {label ?? "your path"}…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <Compass size={28} strokeWidth={1.5} className="text-brand-300 dark:text-brand-700" />
          <p className="text-sm text-ink-muted">You haven&apos;t chosen a path yet.</p>
          <Button href="/begin" className="mt-1">
            Choose your path
          </Button>
        </div>
      )}
    </div>
  );
}

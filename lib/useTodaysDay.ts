"use client";

import { useEffect, useState } from "react";
import type { MemorizationDay, PathProgress, VerseSegment } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { getCurrentDay, getLastCompletedDay } from "@/lib/progressSummary";
import { hasCompletedToday } from "@/lib/dayRollover";
import { resolvePath } from "@/lib/memorizationContent";
import { ensurePathVerses, pathContentMatchesVersion, BibleFetchError } from "@/lib/bibleApiClient";

export interface TodaysDay {
  activePathKey: string | null;
  plan: PathProgress | undefined;
  // The next NEW lesson to start — undefined once today's own lesson is already done (see
  // getCurrentDay's own doc comment), not just while still loading. Check restingUntilTomorrow
  // to tell those two "nothing here" cases apart.
  currentDay: MemorizationDay | undefined;
  // True once verses/plan are both resolved AND today's own lesson is already finished — the
  // one case currentDay is undefined for a reason OTHER than "still loading." TodayVersesCard
  // uses this to show "come back tomorrow" instead of a loading spinner.
  restingUntilTomorrow: boolean;
  // The lesson day most recently finished (today or earlier), gated by nothing — used by
  // VespersPromptCard to prompt recall of what was actually just learned, not a lesson that
  // hasn't been taught yet.
  lastCompletedDay: MemorizationDay | undefined;
  error: string | null;
  retry: () => void;
}

// The active path's own resolved "today" — pulled out of TodayVersesCard.tsx so a second
// surface (VespersPromptCard.tsx / VespersView.tsx) can read the very same day without
// duplicating its fetch/version-check logic. Verses live in local state — seeded synchronously
// from the client-side content cache when already present, or from ensurePathVerses()'s own
// return value otherwise — rather than re-derived from resolvePath() on every render, since a
// book-mode ESV path's cache slot can't hold a whole book at once (see ensureChapterLoaded).
export function useTodaysDay(): TodaysDay {
  const activePathKey = useProgressStore((state) => state.activePathKey);
  const paths = useProgressStore((state) => state.paths);
  const plan = activePathKey ? paths[activePathKey] : undefined;

  const [verses, setVerses] = useState<VerseSegment[] | null>(() =>
    activePathKey && plan && pathContentMatchesVersion(activePathKey, plan.version) ? (resolvePath(activePathKey)?.verses ?? null) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const versionCheckKey = `${activePathKey ?? ""}|${plan?.version ?? ""}`;
  const [lastVersionCheckKey, setLastVersionCheckKey] = useState(versionCheckKey);
  if (lastVersionCheckKey !== versionCheckKey) {
    setLastVersionCheckKey(versionCheckKey);
    if (verses && activePathKey && plan && !pathContentMatchesVersion(activePathKey, plan.version)) setVerses(null);
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
  const lastCompletedDay = activePathKey && plan && verses ? getLastCompletedDay(activePathKey, verses, plan) : undefined;
  const restingUntilTomorrow = Boolean(!currentDay && plan && verses && hasCompletedToday(plan, new Date()));
  return {
    activePathKey,
    plan,
    currentDay,
    restingUntilTomorrow,
    lastCompletedDay,
    error,
    retry: () => {
      setError(null);
      setRetryToken((token) => token + 1);
    },
  };
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useProgressStore } from "@/store/useProgressStore";
import { computeMemorizedStats } from "@/lib/progressSummary";
import { useMemorizedChaptersLoaded } from "@/lib/useMemorizedChaptersLoaded";
import { useHasMounted } from "@/lib/useHasMounted";
import { FetchLoading } from "@/components/ui/FetchStatus";
import { MemorizedCountHero } from "@/components/gamification/MemorizedCountHero";
import { MemorizedBooksList } from "@/components/gamification/MemorizedBooksList";
import { HomeDueButton } from "@/components/gamification/HomeDueButton";
import { MemorizedReviewArea } from "@/components/gamification/MemorizedReviewArea";

// The Memorized tab's count-first overview (design option 4b): the verse total and next milestone,
// then a button for what's due, your books (each opening its chapters), the review tools
// (MemorizedReviewArea.tsx), and a way
// into the Bible reader (MemorizedReaderScreen.tsx). Verse total comes from computeMemorizedStats, so a translation's gap verses
// (e.g. ESV Mark 11:26) aren't counted.
export function MemorizedOverviewScreen() {
  const mounted = useHasMounted();
  const entities = useProgressStore((state) => state.memorizedEntities);
  const catchUpMemorized = useProgressStore((state) => state.catchUpMemorized);
  // Verses learned before each stone counted on its own (a book path's part-done chapter) join now.
  useEffect(() => {
    if (mounted) catchUpMemorized();
  }, [mounted, catchUpMemorized]);
  useMemorizedChaptersLoaded(entities);
  if (!mounted) return <FetchLoading label="Loading…" />;

  const stats = computeMemorizedStats(entities);

  return (
    <div className="flex flex-col gap-[18px] px-[18px] pb-6 pt-1.5">
      <MemorizedCountHero verses={stats.verses} />
      {entities.length === 0 ? (
        <>
          <p className="text-sm text-ink-muted">
            Nothing here yet — a passage joins spaced review once you finish it on a path, or you add one you already know.
          </p>
          <Link href="/memorized?view=bible" className="text-sm font-black text-brand-700 dark:text-brand-300">
            Open your Bible
          </Link>
        </>
      ) : (
        <>
          <HomeDueButton quiet />
          <h2 className="-mb-3 text-base font-extrabold text-ink dark:text-zinc-100">Your books</h2>
          <MemorizedBooksList entities={entities} />
          <MemorizedReviewArea />
        </>
      )}
    </div>
  );
}

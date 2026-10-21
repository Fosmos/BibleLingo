"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { computeMemorizedStats } from "@/lib/progressSummary";
import { useMemorizedChaptersLoaded } from "@/lib/useMemorizedChaptersLoaded";
import { useHasMounted } from "@/lib/useHasMounted";
import { FetchLoading } from "@/components/ui/FetchStatus";
import { MemorizedCountHero } from "@/components/gamification/MemorizedCountHero";
import { MemorizedBooksList } from "@/components/gamification/MemorizedBooksList";
import { StrugglesCard } from "@/components/gamification/StrugglesCard";

// The Memorized tab's count-first overview (design option 4b): the verse total and next milestone,
// then your books (each opening its info page), the verses you struggle with most (StrugglesCard.tsx), and a way into the Bible reader (MemorizedReaderScreen.tsx, with its
// Recall quiz). Verse total comes from computeMemorizedStats, so a translation's gap verses
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
  const bookCount = new Set(entities.map((entity) => entity.book)).size;

  return (
    <div className="flex flex-col gap-[18px] px-[18px] pb-6 pt-1.5">
      <MemorizedCountHero verses={stats.verses} passages={entities.length} books={bookCount} />
      {entities.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nothing here yet — a passage joins spaced review once you finish it on a path, or you add one you already know.
        </p>
      ) : (
        <>
          <MemorizedBooksList entities={entities} />
          <StrugglesCard />
        </>
      )}
      <Link
        href="/memorized?view=bible"
        className="flex items-center gap-3 rounded-[22px] border-2 border-sand-300 bg-sand-100 px-4 py-3.5 shadow-[0_4px_0_#DCD3C4] transition-[transform,box-shadow] duration-75 active:translate-y-1 active:shadow-none dark:border-zinc-700 dark:bg-zinc-900"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-200 text-sage-800">
          <BookOpen size={20} strokeWidth={2.5} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-heading text-[17px] leading-tight text-ink dark:text-zinc-100">Open your Bible</span>
          <span className="text-xs font-extrabold text-ink-muted">Browse what you know, book by book · Recall quiz</span>
        </span>
        <ChevronRight size={18} strokeWidth={2.75} className="shrink-0 text-sand-500" />
      </Link>
    </div>
  );
}

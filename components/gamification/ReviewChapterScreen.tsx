"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProgressStore } from "@/store/useProgressStore";
import { useHasMounted } from "@/lib/useHasMounted";
import { formatVerseSpanLabel } from "@/lib/chapterContent";
import { ChapterPathScreen } from "@/components/gamification/ChapterPathScreen";
import { FetchLoading } from "@/components/ui/FetchStatus";

// The chapter path view for a spaced review of ranges no path covers (a verse added by hand):
// the same shelves and pericope cards as the Path tab, opened on the first range's own chapter in
// its own translation, without adding a path. `?review=<ids>&start=1` (lib/useReviewArrival.ts)
// starts the review in place, exactly as on a path.
export function ReviewChapterScreen() {
  const mounted = useHasMounted();
  const params = useSearchParams();
  const entities = useProgressStore((state) => state.memorizedEntities);
  const firstId = (params.get("review") ?? "").split(",")[0];
  const entity = entities.find((candidate) => candidate.id === firstId);

  if (!mounted) return <FetchLoading label="Loading your review…" />;
  if (!entity) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-ink-muted">That review isn&apos;t in your spaced review any more.</p>
        <Link href="/memorized" className="rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-paper">
          Back to Memorized
        </Link>
      </div>
    );
  }
  return (
    <ChapterPathScreen
      pathKey={`review:${entity.id}`}
      label={formatVerseSpanLabel(entity.book, entity.chapter, entity.startVerse, entity.endVerse)}
      days={[]}
      verses={[]}
      version={entity.version}
      completedDays={0}
      todaysDay={0}
      startAt={{ book: entity.book, chapter: entity.chapter }}
    />
  );
}

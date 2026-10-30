"use client";

import { useSearchParams } from "next/navigation";
import { useProgressStore } from "@/store/useProgressStore";
import { useHasMounted } from "@/lib/useHasMounted";
import { resolvePathLabel } from "@/lib/memorizationContent";
import { PathOverviewScreen } from "@/components/gamification/PathOverviewScreen";
import { ChapterPathScreen } from "@/components/gamification/ChapterPathScreen";
import { FetchLoading } from "@/components/ui/FetchStatus";

// The Memorized tab: the Bible → Book → chapter reader (ChapterPathScreen.tsx) for the path a
// link names (`?path=`, from the trail, Home or a review) or else your focused one — lessons and
// reviews run in it, in place — with "Where you stumble" under the Bible's books. With no path
// yet, the reader alone, opening on the whole Bible.
export function MemorizedReaderScreen() {
  const mounted = useHasMounted();
  const params = useSearchParams();
  const activePathKey = useProgressStore((state) => state.activePathKey);
  const paths = useProgressStore((state) => state.paths);
  const pathKey = params.get("path") ?? activePathKey;
  const label = pathKey ? resolvePathLabel(pathKey) : undefined;

  if (!mounted) return <FetchLoading label="Loading…" />;
  if (pathKey && label) {
    const version = params.get("version") ?? paths[pathKey]?.version ?? "KJV";
    return <PathOverviewScreen pathKey={pathKey} label={label} version={version} view="reader" />;
  }
  return <ChapterPathScreen pathKey="memorized" label="Your Bible" days={[]} verses={[]} version="KJV" completedDays={0} todaysDay={0} startAt={{ book: "Genesis", chapter: 1 }} startOnBible />;
}

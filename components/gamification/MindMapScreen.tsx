"use client";

import { useRouter } from "next/navigation";
import { useMindMapData } from "@/lib/useMindMapData";
import { MindMapCanvas } from "@/components/gamification/MindMapCanvas";
import { Button } from "@/components/ui/Button";
import { FetchLoading, FetchError } from "@/components/ui/FetchStatus";

// Testing-tab entry point (see components/ui/BottomTabBar.tsx) for the Mind Map — a free
// pan/zoom view of the currently active BOOK path's own chapter/pericope tree. All the real
// data work (loading verses, building the day plan, slicing it per chapter) lives in
// lib/useMindMapData.ts; this component only picks which state to show and wires the ready
// case's navigation callbacks through to the canvas.
export function MindMapScreen() {
  const router = useRouter();
  const data = useMindMapData();

  if (data.status === "loading") {
    return <FetchLoading label="Loading mind map…" />;
  }

  if (data.status === "error") {
    return <FetchError message={data.message} onRetry={data.retry} />;
  }

  if (data.status === "no-path") {
    return (
      <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-title text-ink dark:text-zinc-100">No book path active</h1>
        <p className="text-ink-muted">The Mind Map only works for a Book path — start or switch to one to see its chapter/pericope tree here.</p>
        <Button href="/begin">Choose a path</Button>
      </div>
    );
  }

  const basePath = `/path/${encodeURIComponent(data.pathKey)}`;

  return (
    // AuthGate.tsx's <main> wraps every page in flex-1 inside a body that's only min-h-full
    // (a floor, not a ceiling) — so a plain flex-1 chain here has no definite height to fill
    // and the SVG below falls back to its own intrinsic (viewBox aspect-ratio) size instead,
    // growing the whole page taller than the viewport. Sizing directly off 100dvh minus
    // that <main>'s own pb-20 (5rem) sidesteps the broken chain with a height that's
    // definite from the very first div, so the canvas below can actually fill it.
    <div className="flex h-[calc(100dvh-5rem)] w-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-2 dark:border-zinc-800">
        <p className="font-serif text-lg font-semibold text-ink dark:text-zinc-100">{data.label} — Mind Map</p>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Testing</p>
      </div>
      <div className="min-h-0 flex-1">
        <MindMapCanvas
          bookLabel={data.label}
          chapters={data.chapters}
          completedDays={data.completedDays}
          onSelectDay={(dayNumber) => router.push(`${basePath}/day/${dayNumber}`)}
          onPracticeDay={(dayNumber) => router.push(`${basePath}/day/${dayNumber}/practice`)}
        />
      </div>
    </div>
  );
}

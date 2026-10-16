"use client";

import { useSearchParams } from "next/navigation";
import { MemorizedReaderScreen } from "@/components/gamification/MemorizedReaderScreen";
import { MemorizedOverviewScreen } from "@/components/gamification/MemorizedOverviewScreen";

// The Memorized tab: the count-first overview (MemorizedOverviewScreen.tsx) when it's opened on
// its own; the Bible reader, where lessons and reviews run in place, when a link names a path
// (the trail, Home, a review's Review button) or asks for the Bible (`?view=bible`).
export function MemorizedTabScreen() {
  const params = useSearchParams();
  return params.get("path") || params.get("view") === "bible" ? <MemorizedReaderScreen /> : <MemorizedOverviewScreen />;
}

"use client";

import { useSearchParams } from "next/navigation";
import { MemorizedShelfScreen } from "@/components/gamification/MemorizedShelfScreen";
import { MemorizedReaderScreen } from "@/components/gamification/MemorizedReaderScreen";
import { MemorizedOverviewScreen } from "@/components/gamification/MemorizedOverviewScreen";

// The Memorized tab: the count-first overview (MemorizedOverviewScreen.tsx) when it's opened on
// its own; the Bible reader, where lessons and reviews run in place, when a link names a path
// (the trail, Home, a review's Review button) or asks for the Bible (`?view=bible`); a book, then a
// chapter, of what you've memorized when a link names one (`?book=`, `&chapter=`).
export function MemorizedTabScreen() {
  const params = useSearchParams();
  const book = params.get("book");
  const chapter = Number(params.get("chapter"));
  if (book) return <MemorizedShelfScreen key={`${book}|${chapter}`} book={book} chapter={chapter > 0 ? chapter : undefined} />;
  return params.get("path") || params.get("view") === "bible" ? <MemorizedReaderScreen /> : <MemorizedOverviewScreen />;
}

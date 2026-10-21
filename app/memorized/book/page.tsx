import { Suspense } from "react";
import { BookStatsScreen } from "@/components/gamification/BookStatsScreen";
import { FetchLoading } from "@/components/ui/FetchStatus";

// One book's memorized passages and stats (BookStatsScreen.tsx), from the Memorized tab's list.
export default function BookStatsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<FetchLoading label="Loading…" />}>
        <BookStatsScreen />
      </Suspense>
    </div>
  );
}

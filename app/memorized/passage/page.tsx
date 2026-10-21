import { Suspense } from "react";
import { PassageStatsScreen } from "@/components/gamification/PassageStatsScreen";
import { FetchLoading } from "@/components/ui/FetchStatus";

// One memorized passage's stats (PassageStatsScreen.tsx), from the Memorized tab's list.
export default function PassageStatsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<FetchLoading label="Loading…" />}>
        <PassageStatsScreen />
      </Suspense>
    </div>
  );
}

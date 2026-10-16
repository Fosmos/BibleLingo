import { Suspense } from "react";
import { MemorizedTabScreen } from "@/components/gamification/MemorizedTabScreen";
import { FetchLoading } from "@/components/ui/FetchStatus";

// The Memorized tab: its overview, or the Bible → Book → chapter reader (MemorizedTabScreen.tsx).
export default function MemorizedPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<FetchLoading label="Loading…" />}>
        <MemorizedTabScreen />
      </Suspense>
    </div>
  );
}

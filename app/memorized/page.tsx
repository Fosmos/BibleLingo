import { Suspense } from "react";
import { MemorizedReaderScreen } from "@/components/gamification/MemorizedReaderScreen";
import { FetchLoading } from "@/components/ui/FetchStatus";

// The Memorized tab: the Bible → Book → chapter reader, where lessons and reviews run in place.
export default function MemorizedPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<FetchLoading label="Loading…" />}>
        <MemorizedReaderScreen />
      </Suspense>
    </div>
  );
}

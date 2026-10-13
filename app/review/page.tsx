import { Suspense } from "react";
import { ReviewChapterScreen } from "@/components/gamification/ReviewChapterScreen";
import { FetchLoading } from "@/components/ui/FetchStatus";

// A spaced review in the chapter path view for ranges no path covers (ReviewChapterScreen.tsx).
export default function ReviewPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<FetchLoading label="Loading your review…" />}>
        <ReviewChapterScreen />
      </Suspense>
    </div>
  );
}

import type { ReactNode } from "react";
import { ParchmentCard } from "@/components/ui/ParchmentCard";

interface LessonParchmentCardProps {
  children: ReactNode;
}

// The "verse lives here" surface for every Learn/SRS drill stage — a thin pass-through to
// ParchmentCard.tsx, the ONE shared parchment shell the Path screen's own reading view
// (ChapterReadingView.tsx) also uses, so a lesson's own parchment is never a different size
// or position than the parchment the reader already knows from browsing. Every stage's own
// verse text, drawing canvas, clause cards, or prayer timer renders inside this card; the
// stage's own buttons/input live below it in a LessonControlBar instead, so tapping a stage's
// action never means reaching across the verse text itself.
export function LessonParchmentCard({ children }: LessonParchmentCardProps) {
  return <ParchmentCard>{children}</ParchmentCard>;
}

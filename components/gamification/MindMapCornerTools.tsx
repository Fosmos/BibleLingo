"use client";

import { MindMapReviewDueButton } from "@/components/gamification/MindMapReviewDueButton";
import { MindMapLeitnerButton } from "@/components/gamification/MindMapLeitnerButton";

interface MindMapCornerToolsProps {
  onStartReview: (entityIds: string[]) => void;
}

// The Mind Map's bottom-left corner: the review-due chip (only while something is due) and the
// Leitner boxes button, side by side.
export function MindMapCornerTools({ onStartReview }: MindMapCornerToolsProps) {
  return (
    <div className="absolute bottom-3 left-3 z-20 flex items-end gap-2">
      <MindMapReviewDueButton onStart={onStartReview} />
      <MindMapLeitnerButton />
    </div>
  );
}

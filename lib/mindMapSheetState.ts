import type { LessonFocusVerse } from "@/store/useLessonSessionStore";
import type { PathTarget } from "@/lib/mindMapPathTarget";
import type { RelearnTarget } from "@/lib/relearnTarget";

// What BookMindMapWithLessonSheet.tsx's sheet holds: a tapped verse (previewed, then its lesson),
// an SRS review run, a relearn, a verse pick, or a path setup.
export type SheetState =
  | {
      kind: "verse";
      tappedVerse: LessonFocusVerse;
      // Null while the sheet is just previewing the tapped verse; set once its action is taken.
      lesson: { dayNumber: number; mode: "select" | "practice" } | null;
    }
  | { kind: "srs"; entityIds: string[] }
  // Verses relearned with the full Learn flow (InPlaceRelearnSession.tsx).
  | { kind: "relearn"; target: RelearnTarget }
  // A verse tapped outside the active paths, shown with "Memorize" (MindMapVerseTargetPreview.tsx).
  | { kind: "versePick"; target: Extract<PathTarget, { kind: "verse" }> }
  // A new path's setup, picked on the map (see MindMapPathTab.tsx/MindMapPathSetup.tsx).
  | { kind: "setup"; target: PathTarget };

import type { BuiltPalace, VerseSegment } from "@/types";
import { findPlacement } from "@/lib/palacePlacement";
import { PalaceSpotEditor } from "@/components/gamification/PalaceSpotEditor";

interface PassageSpotsProps {
  palace: BuiltPalace;
  // The verse whose spot is open (from its sheet), and the path's verses a spot can hold.
  verse: VerseSegment;
  pathVerses: VerseSegment[];
  onSave: (palace: BuiltPalace) => void;
  onDone: () => void;
}

// The spot a verse is on in the reader's built palace, opened from its sheet
// (VerseSpotLink.tsx) and edited there (PalaceSpotEditor.tsx).
export function PassageSpots({ palace, verse, pathVerses, onSave, onDone }: PassageSpotsProps) {
  const placement = findPlacement([palace], verse);
  if (!placement) return null;
  return <PalaceSpotEditor key={placement.locus.id} palace={palace} roomId={placement.room.id} locus={placement.locus} verses={pathVerses} onSave={onSave} onDone={onDone} />;
}

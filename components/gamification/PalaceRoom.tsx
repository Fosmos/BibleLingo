import { useMemo } from "react";
import type { TrailStop } from "@/lib/trailStops";
import { ROOM, drawingOrder, furnitureScale, roomSpots, routePath } from "@/lib/palaceRoomLayout";
import type { RoomTheme } from "@/lib/palaceRoomThemes";
import { PalaceRoomShell } from "@/components/gamification/PalaceRoomShell";
import { PalaceRoomSpot } from "@/components/gamification/PalaceRoomSpot";

interface PalaceRoomProps {
  // The passage's verse lessons, in order, and each one's picture (lib/verseImages.ts).
  lessons: TrailStop[];
  pictures: string[];
  // The verse being read, by its place in `lessons`.
  selected: number;
  onSelect: (index: number) => void;
  // Which kind of room it is (lib/palaceRoomThemes.ts) — its look, furniture and route.
  theme: RoomTheme;
}

// A passage's room in the Palace (BookStructurePassage.tsx): a 2.5D isometric room — a library, a
// great hall, a garden, a kitchen, a chapel or an upper room — with each verse's picture set on its
// own piece of furniture, in order along a dotted walking route from the door — walk
// the room and meet the verses one after another. Tap one to read it under the room.
export function PalaceRoom({ lessons, pictures, selected, onSelect, theme }: PalaceRoomProps) {
  const spots = useMemo(() => roomSpots(lessons.length, theme), [lessons.length, theme]);
  const scale = furnitureScale(lessons.length);
  return (
    <svg viewBox={`0 0 ${ROOM.width} ${ROOM.height}`} className="w-full select-none" role="group" aria-label="The passage's room — tap a verse to read it">
      <PalaceRoomShell theme={theme} />
      <path d={routePath(spots)} fill="none" className="stroke-brand-500/50 dark:stroke-brand-400/50" strokeWidth={1.6} strokeDasharray="1 5" strokeLinecap="round" />
      {drawingOrder(spots).map(({ spot, index }) => (
        <PalaceRoomSpot
          key={lessons[index].key}
          spot={spot}
          pictureId={pictures[index]}
          verseNumber={lessons[index].verse!.verseNumber}
          learned={lessons[index].state === "done"}
          selected={index === selected}
          scale={scale}
          onSelect={() => onSelect(index)}
        />
      ))}
    </svg>
  );
}

import type { KeyboardEvent } from "react";
import { iso, type RoomSpot } from "@/lib/palaceRoomLayout";
import { HOLD, PalaceRoomFurniture } from "@/components/gamification/PalaceRoomFurniture";
import { pictureById } from "@/lib/verseImages";

interface PalaceRoomSpotProps {
  spot: RoomSpot;
  pictureId: string;
  verseNumber: number;
  learned: boolean;
  selected: boolean;
  scale: number;
  onSelect: () => void;
}

// One verse's spot in its room (PalaceRoom.tsx): a piece of furniture (PalaceRoomFurniture.tsx)
// holding the verse's picture (lib/verseImages.ts) in a round medallion, sage once learned, with its verse number on a small tag. Tap it to read the verse.
export function PalaceRoomSpot({ spot, pictureId, verseNumber, learned, selected, scale, onSelect }: PalaceRoomSpotProps) {
  const Icon = pictureById(pictureId)?.Icon;
  const half = 0.055 * scale;
  const hold = HOLD[spot.kind] * scale;
  const onBack = spot.wall === "back";
  const shelfAt = spot.kind === "shelf" ? (onBack ? iso(spot.gx, 0, hold) : iso(0, spot.gy, hold)) : null;
  const anchor = shelfAt ?? { x: spot.x, y: spot.y - hold };
  const radius = 11 * Math.max(scale, 0.8);
  const center = { x: anchor.x, y: anchor.y - radius - 2 };
  const onKey = (event: KeyboardEvent) => (event.key === "Enter" || event.key === " ") && (event.preventDefault(), onSelect());

  return (
    <g role="button" tabIndex={0} aria-label={`Verse ${verseNumber}`} aria-pressed={selected} onClick={onSelect} onKeyDown={onKey} className="cursor-pointer outline-none">
      <PalaceRoomFurniture spot={spot} half={half} hold={hold} scale={scale} />
      {selected && <circle cx={center.x} cy={center.y} r={radius + 4} className="fill-brand-500/25 stroke-brand-500" strokeWidth={1.5} />}
      <circle cx={center.x} cy={center.y} r={radius} className={learned ? "fill-sage-500 stroke-sage-700" : "fill-paper stroke-sand-400 dark:fill-zinc-900 dark:stroke-zinc-600"} strokeWidth={1.5} />
      {Icon && <Icon x={center.x - radius * 0.6} y={center.y - radius * 0.6} width={radius * 1.2} height={radius * 1.2} strokeWidth={2.2} className={learned ? "text-white" : "text-sand-600 dark:text-zinc-400"} />}
      <g transform={`translate(${center.x + radius * 0.8} ${center.y - radius * 0.8})`}>
        <circle r={5.5} className="fill-paper stroke-sand-300 dark:fill-zinc-800 dark:stroke-zinc-600" strokeWidth={1} />
        <text textAnchor="middle" dominantBaseline="central" className="fill-sand-700 text-[7px] font-extrabold dark:fill-zinc-300">
          {verseNumber}
        </text>
      </g>
    </g>
  );
}

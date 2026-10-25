import type { KeyboardEvent } from "react";
import { box, iso, toPoints, type RoomSpot } from "@/lib/palaceRoomLayout";
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

// How high each piece of furniture holds its picture above the floor (before scaling).
const HOLD: Record<RoomSpot["kind"], number> = { table: 15, pedestal: 24, chest: 10, rug: 2, shelf: 34 };

// One verse's spot in its room (PalaceRoom.tsx): a piece of furniture — a table, a pedestal, a chest, a
// rug or a shelf on the wall — holding the verse's picture (lib/verseImages.ts) in a round medallion,
// sage once learned, with its verse number on a small tag. Tap it to read the verse.
export function PalaceRoomSpot({ spot, pictureId, verseNumber, learned, selected, scale, onSelect }: PalaceRoomSpotProps) {
  const Icon = pictureById(pictureId)?.Icon;
  const half = 0.055 * scale;
  const hold = HOLD[spot.kind] * scale;
  const onBack = spot.wall === "back";
  const shelfAt = spot.kind === "shelf" ? (onBack ? iso(spot.gx, 0, hold) : iso(0, spot.gy, hold)) : null;
  // A shelf's board, along whichever wall it hangs on: [along the wall, out from it].
  const board = (along: number, out: number) => (onBack ? iso(spot.gx + along, out, hold) : iso(out, spot.gy + along, hold));
  const anchor = shelfAt ?? { x: spot.x, y: spot.y - hold };
  const radius = 11 * Math.max(scale, 0.8);
  const center = { x: anchor.x, y: anchor.y - radius - 2 };
  const onKey = (event: KeyboardEvent) => (event.key === "Enter" || event.key === " ") && (event.preventDefault(), onSelect());

  return (
    <g role="button" tabIndex={0} aria-label={`Verse ${verseNumber}`} aria-pressed={selected} onClick={onSelect} onKeyDown={onKey} className="cursor-pointer outline-none">
      {spot.kind === "rug" && (
        <>
          <polygon points={toPoints([iso(spot.gx - half * 2, spot.gy - half * 1.4), iso(spot.gx + half * 2, spot.gy - half * 1.4), iso(spot.gx + half * 2, spot.gy + half * 1.4), iso(spot.gx - half * 2, spot.gy + half * 1.4)])} className="fill-brand-300 dark:fill-brand-900" />
          <polygon points={toPoints([iso(spot.gx - half * 1.4, spot.gy - half * 0.8), iso(spot.gx + half * 1.4, spot.gy - half * 0.8), iso(spot.gx + half * 1.4, spot.gy + half * 0.8), iso(spot.gx - half * 1.4, spot.gy + half * 0.8)])} className="fill-none stroke-brand-500/60" strokeWidth={1} />
        </>
      )}
      {spot.kind === "shelf" && shelfAt && (
        <polygon points={toPoints([board(-half * 1.6, 0), board(half * 1.6, 0), board(half * 1.6, 0.05), board(-half * 1.6, 0.05)])} className="fill-brand-500 stroke-brand-700 dark:fill-brand-800" strokeWidth={0.8} />
      )}
      {spot.kind === "table" && <Furniture {...box(spot.gx, spot.gy, half * 1.3, 3 * scale, hold - 3 * scale)} legs={{ spot, half: half * 1.1, hold: hold - 3 * scale }} />}
      {spot.kind === "pedestal" && <Furniture {...box(spot.gx, spot.gy, half * 0.8, hold)} stone />}
      {spot.kind === "chest" && <Furniture {...box(spot.gx, spot.gy, half * 1.2, hold)} />}
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

interface FurnitureProps {
  top: string;
  left: string;
  right: string;
  stone?: boolean;
  legs?: { spot: RoomSpot; half: number; hold: number };
}

// A box-shaped piece — wood, or pale stone for a pedestal — with legs for a table.
function Furniture({ top, left, right, stone = false, legs }: FurnitureProps) {
  return (
    <>
      {legs &&
        [
          [-1, 1],
          [1, 1],
          [1, -1],
        ].map(([dx, dy]) => {
          const foot = iso(legs.spot.gx + dx * legs.half, legs.spot.gy + dy * legs.half);
          return <line key={`${dx}${dy}`} x1={foot.x} y1={foot.y} x2={foot.x} y2={foot.y - legs.hold} className="stroke-brand-700 dark:stroke-brand-800" strokeWidth={1.6} />;
        })}
      <polygon points={left} className={stone ? "fill-sand-500 dark:fill-zinc-600" : "fill-brand-600 dark:fill-brand-800"} />
      <polygon points={right} className={stone ? "fill-sand-400 dark:fill-zinc-500" : "fill-brand-500 dark:fill-brand-700"} />
      <polygon points={top} className={stone ? "fill-sand-300 dark:fill-zinc-400" : "fill-brand-400 dark:fill-brand-600"} />
    </>
  );
}

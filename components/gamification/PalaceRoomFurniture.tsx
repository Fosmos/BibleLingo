import { box, iso, toPoints, type RoomSpot } from "@/lib/palaceRoomLayout";
import type { FurnitureKind } from "@/lib/palaceRoomThemes";

interface PalaceRoomFurnitureProps {
  spot: RoomSpot;
  // Its size on the floor (in floor units) and how high it holds its picture (on screen), both scaled.
  half: number;
  hold: number;
  scale: number;
}

// How high each piece of furniture holds its picture above the floor (before scaling).
export const HOLD: Record<FurnitureKind, number> = { table: 15, pedestal: 24, chest: 10, rug: 2, shelf: 34, plant: 26, barrel: 16, lectern: 22, bench: 8, candle: 26, crate: 12 };

type Material = "wood" | "stone" | "dark" | "pot";
const FACES: Record<Material, [string, string, string]> = {
  wood: ["fill-brand-600 dark:fill-brand-800", "fill-brand-500 dark:fill-brand-700", "fill-brand-400 dark:fill-brand-600"],
  stone: ["fill-sand-500 dark:fill-zinc-600", "fill-sand-400 dark:fill-zinc-500", "fill-sand-300 dark:fill-zinc-400"],
  dark: ["fill-brand-800 dark:fill-brand-900", "fill-brand-700 dark:fill-brand-800", "fill-brand-600 dark:fill-brand-700"],
  pot: ["fill-brand-600", "fill-brand-500", "fill-brand-700"],
};

// A box in a material: its two sides and its top.
function Block({ faces, material }: { faces: ReturnType<typeof box>; material: Material }) {
  const [left, right, top] = FACES[material];
  return (
    <>
      <polygon points={faces.left} className={left} />
      <polygon points={faces.right} className={right} />
      <polygon points={faces.top} className={top} />
    </>
  );
}

// The piece of furniture a verse's picture rests on in its room (PalaceRoomSpot.tsx) — a table, a
// pedestal, a chest, a rug, a shelf on the wall, a potted plant, a barrel, a lectern, a bench, a
// candlestand or a crate (lib/palaceRoomThemes.ts picks which, by kind of room).
export function PalaceRoomFurniture({ spot, half, hold, scale }: PalaceRoomFurnitureProps) {
  const { gx, gy, kind } = spot;
  const line = (a: { x: number; y: number }, b: { x: number; y: number }, className: string, width = 1.2) => <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={className} strokeWidth={width} />;
  const rect = (spread: number, depth: number) => toPoints([iso(gx - spread, gy - depth), iso(gx + spread, gy - depth), iso(gx + spread, gy + depth), iso(gx - spread, gy + depth)]);

  if (kind === "rug")
    return (
      <>
        <polygon points={rect(half * 2, half * 1.4)} className="fill-brand-300 dark:fill-brand-900" />
        <polygon points={rect(half * 1.4, half * 0.8)} className="fill-none stroke-brand-500/60" strokeWidth={1} />
      </>
    );
  if (kind === "shelf") {
    const onBack = spot.wall === "back";
    const board = (along: number, out: number) => (onBack ? iso(gx + along, out, hold) : iso(out, gy + along, hold));
    return <polygon points={toPoints([board(-half * 1.6, 0), board(half * 1.6, 0), board(half * 1.6, 0.05), board(-half * 1.6, 0.05)])} className="fill-brand-500 stroke-brand-700 dark:fill-brand-800" strokeWidth={0.8} />;
  }
  if (kind === "table") {
    const legs = [[-1, 1], [1, 1], [1, -1]].map(([dx, dy]) => iso(gx + dx * half * 1.1, gy + dy * half * 1.1));
    return (
      <>
        {legs.map((foot, index) => (
          <g key={index}>{line(foot, { x: foot.x, y: foot.y - (hold - 3 * scale) }, "stroke-brand-700 dark:stroke-brand-800", 1.6)}</g>
        ))}
        <Block faces={box(gx, gy, half * 1.3, 3 * scale, hold - 3 * scale)} material="wood" />
      </>
    );
  }
  if (kind === "pedestal") return <Block faces={box(gx, gy, half * 0.8, hold)} material="stone" />;
  if (kind === "chest" || kind === "crate") {
    const size = half * (kind === "chest" ? 1.2 : 1);
    const at = (dx: number, dy: number, up: number) => iso(gx + dx * size, gy + dy * size, up);
    return (
      <>
        <Block faces={box(gx, gy, size, hold)} material={kind === "chest" ? "dark" : "wood"} />
        {kind === "chest" && line(at(-1, 1, hold * 0.62), at(1, 1, hold * 0.62), "stroke-sand-300/80")}
        {kind === "crate" && (
          <>
            {line(at(-1, 1, hold), at(1, 1, 0), "stroke-brand-700")}
            {line(at(1, -1, hold), at(1, 1, 0), "stroke-brand-700")}
          </>
        )}
      </>
    );
  }
  if (kind === "barrel") {
    const size = half * 0.9;
    const band = (up: number) => toPoints([iso(gx - size, gy + size, up), iso(gx + size, gy + size, up), iso(gx + size, gy - size, up)]);
    return (
      <>
        <Block faces={box(gx, gy, size, hold)} material="wood" />
        {[0.25, 0.75].map((share) => (
          <polyline key={share} points={band(hold * share)} fill="none" className="stroke-sand-700 dark:stroke-zinc-500" strokeWidth={1.4} />
        ))}
      </>
    );
  }
  if (kind === "bench") return <Block faces={box(gx, gy, half * 0.7, hold, 0, half * 1.8)} material="wood" />;
  if (kind === "plant") {
    const top = iso(gx, gy, hold - 4 * scale);
    return (
      <>
        <Block faces={box(gx, gy, half * 0.6, 8 * scale)} material="pot" />
        {[[-5, 2], [5, 2], [0, -4]].map(([dx, dy], index) => (
          <circle key={index} cx={top.x + dx * scale} cy={top.y + dy * scale} r={7 * scale} className="fill-sage-500 dark:fill-sage-700" />
        ))}
      </>
    );
  }
  const base = iso(gx, gy);
  const top = iso(gx, gy, hold);
  if (kind === "lectern")
    return (
      <>
        {line(base, top, "stroke-brand-700 dark:stroke-brand-800", 3)}
        <polygon points={toPoints([iso(gx - half, gy - half * 0.7, hold - 2), iso(gx + half, gy - half * 0.7, hold + 3), iso(gx + half, gy + half * 0.7, hold + 3), iso(gx - half, gy + half * 0.7, hold - 2)])} className="fill-brand-500 stroke-brand-700 dark:fill-brand-700" strokeWidth={0.8} />
      </>
    );
  // A candlestand: a stem on a little foot, a candle, and its flame beside the picture.
  return (
    <>
      <Block faces={box(gx, gy, half * 0.45, 2 * scale)} material="stone" />
      {line(base, top, "stroke-sand-600 dark:stroke-zinc-400", 2)}
      <path d={`M${top.x + 9 * scale} ${top.y - 2} q-3 -5 0 -9 q3 4 0 9 z`} className="fill-brand-400" />
    </>
  );
}

import { DOOR, ROOM, iso, toPoints } from "@/lib/palaceRoomLayout";

const PLANKS = [1, 2, 3, 4, 5, 6, 7].map((step) => step / 8);

// The empty room a passage's verses stand in (PalaceRoom.tsx): a plank floor, two walls with a
// skirting board, a window on the back wall and the door on the left wall the route starts from.
export function PalaceRoomShell() {
  const wall = (from: [number, number], to: [number, number], low: number, high: number) =>
    toPoints([iso(from[0], from[1], low), iso(to[0], to[1], low), iso(to[0], to[1], high), iso(from[0], from[1], high)]);
  const { wallHeight } = ROOM;
  return (
    <g>
      <polygon points={toPoints([iso(0, 0), iso(1, 0), iso(1, 1), iso(0, 1)])} className="fill-sand-300 dark:fill-zinc-800" />
      {PLANKS.map((step) => {
        const from = iso(0, step);
        const to = iso(1, step);
        return <line key={step} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="stroke-sand-400/50 dark:stroke-zinc-700" strokeWidth={1} />;
      })}
      <polygon points={wall([0, 1], [0, 0], 0, wallHeight)} className="fill-sand-200 dark:fill-zinc-900" />
      <polygon points={wall([0, 0], [1, 0], 0, wallHeight)} className="fill-sand-100 dark:fill-zinc-900/70" />
      <polygon points={wall([0, 1], [0, 0], 0, 5)} className="fill-sand-400/70 dark:fill-zinc-700" />
      <polygon points={wall([0, 0], [1, 0], 0, 5)} className="fill-sand-300 dark:fill-zinc-700" />
      <polygon points={wall([0, 1], [0, 0], wallHeight - 3, wallHeight)} className="fill-sand-400/60 dark:fill-zinc-700" />
      <polygon points={wall([0, 0], [1, 0], wallHeight - 3, wallHeight)} className="fill-sand-300 dark:fill-zinc-700" />
      {/* The window, with its panes. */}
      <polygon points={wall([0.38, 0], [0.62, 0], 24, 56)} className="fill-sage-200 stroke-sand-400 dark:fill-sage-900 dark:stroke-zinc-600" strokeWidth={2} />
      <polyline points={toPoints([iso(0.5, 0, 24), iso(0.5, 0, 56)])} className="stroke-sand-400 dark:stroke-zinc-600" strokeWidth={1.5} fill="none" />
      <polyline points={toPoints([iso(0.38, 0, 40), iso(0.62, 0, 40)])} className="stroke-sand-400 dark:stroke-zinc-600" strokeWidth={1.5} fill="none" />
      {/* The door you come in by. */}
      <polygon points={wall([0, DOOR.gy1], [0, DOOR.gy0], 0, 50)} className="fill-brand-600 dark:fill-brand-800" />
      <polygon points={wall([0, DOOR.gy1 - 0.025], [0, DOOR.gy0 + 0.025], 3, 46)} className="fill-brand-500 dark:fill-brand-700" />
      <circle cx={iso(0, DOOR.gy0 + 0.05, 24).x} cy={iso(0, DOOR.gy0 + 0.05, 24).y} r={1.8} className="fill-sand-100" />
    </g>
  );
}

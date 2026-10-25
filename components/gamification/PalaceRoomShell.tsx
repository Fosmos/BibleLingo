import { DOOR, iso, toPoints, wallQuad } from "@/lib/palaceRoomLayout";
import type { RoomTheme } from "@/lib/palaceRoomThemes";
import { PalaceRoomDecor } from "@/components/gamification/PalaceRoomDecor";

interface PalaceRoomShellProps {
  theme: RoomTheme;
}

const STEPS = [1, 2, 3, 4, 5].map((step) => step / 6);
const CELLS = [0, 1, 2, 3, 4, 5].flatMap((row) => [0, 1, 2, 3, 4, 5].map((col) => [row, col] as const));
// Where tufts grow on a garden's lawn — fixed, so the lawn doesn't change between visits.
const TUFTS: [number, number][] = [[0.3, 0.62], [0.58, 0.3], [0.72, 0.58], [0.4, 0.9], [0.9, 0.4], [0.62, 0.78], [0.25, 0.35], [0.85, 0.85], [0.5, 0.12], [0.12, 0.55]];

// The empty room a passage's verses stand in (PalaceRoom.tsx), dressed as its kind of room
// (lib/palaceRoomThemes.ts): its floor — planks, stone tiles, a checkerboard or a lawn — its two
// walls with a skirting board, what hangs on them (PalaceRoomDecor.tsx), and the door the route
// starts from.
export function PalaceRoomShell({ theme }: PalaceRoomShellProps) {
  const { floor, walls } = theme;
  const line = (from: [number, number], to: [number, number], key: string) => {
    const a = iso(...from);
    const b = iso(...to);
    return <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={floor.line} strokeWidth={1} />;
  };
  const doorTop = Math.min(50, walls.height + 12);
  return (
    <g>
      <polygon points={toPoints([iso(0, 0), iso(1, 0), iso(1, 1), iso(0, 1)])} className={floor.base} />
      {floor.pattern === "planks" && [...STEPS, 1 / 12, 3 / 12, 5 / 12, 7 / 12, 9 / 12, 11 / 12].map((step) => line([0, step], [1, step], `p${step}`))}
      {floor.pattern === "tiles" && STEPS.flatMap((step) => [line([0, step], [1, step], `r${step}`), line([step, 0], [step, 1], `c${step}`)])}
      {floor.pattern === "checker" &&
        CELLS.filter(([row, col]) => (row + col) % 2).map(([row, col]) => (
          <polygon key={`${row}-${col}`} points={toPoints([iso(col / 6, row / 6), iso((col + 1) / 6, row / 6), iso((col + 1) / 6, (row + 1) / 6), iso(col / 6, (row + 1) / 6)])} className={floor.alt} />
        ))}
      {floor.pattern === "grass" &&
        TUFTS.map(([gx, gy]) => {
          const { x, y } = iso(gx, gy);
          return <path key={`${gx}-${gy}`} d={`M${x - 3} ${y} l1.5 -4 l1.5 4 l1.5 -5 l1.5 5`} fill="none" className={floor.line} strokeWidth={1.2} strokeLinejoin="round" />;
        })}
      <polygon points={wallQuad([0, 1], [0, 0], 0, walls.height)} className={walls.left} />
      <polygon points={wallQuad([0, 0], [1, 0], 0, walls.height)} className={walls.back} />
      <polygon points={wallQuad([0, 1], [0, 0], 0, 5)} className={walls.trim} />
      <polygon points={wallQuad([0, 0], [1, 0], 0, 5)} className={walls.trim} />
      <polygon points={wallQuad([0, 1], [0, 0], walls.height - 3, walls.height)} className={walls.trim} />
      <polygon points={wallQuad([0, 0], [1, 0], walls.height - 3, walls.height)} className={walls.trim} />
      <PalaceRoomDecor theme={theme} />
      {/* The door you come in by. */}
      <polygon points={wallQuad([0, DOOR.gy1], [0, DOOR.gy0], 0, doorTop)} className="fill-brand-600 dark:fill-brand-800" />
      <polygon points={wallQuad([0, DOOR.gy1 - 0.025], [0, DOOR.gy0 + 0.025], 3, doorTop - 4)} className="fill-brand-500 dark:fill-brand-700" />
      <circle cx={iso(0, DOOR.gy0 + 0.05, doorTop / 2).x} cy={iso(0, DOOR.gy0 + 0.05, doorTop / 2).y} r={1.8} className="fill-sand-100" />
    </g>
  );
}

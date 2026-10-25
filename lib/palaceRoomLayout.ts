// The geometry of a passage's room in the Palace (PalaceRoom.tsx): a 2.5D isometric room seen from
// its open front corner, its floor a unit square (gx along the right-hand back wall, gy along the
// left-hand one), and its verses' spots set along its walking route (lib/palaceRoomThemes.ts — each
// kind of room has its own), in at the door on the left wall (the method of loci: walk the room,
// meet the verses in order).

import type { FurnitureKind, RoomTheme } from "@/lib/palaceRoomThemes";

export const ROOM = { width: 320, height: 240, originX: 160, originY: 84, floorWidth: 288, floorHeight: 144 };

export interface RoomSpot {
  gx: number;
  gy: number;
  // Its point on the floor, on screen.
  x: number;
  y: number;
  kind: FurnitureKind;
  // The wall it stands against, if it's close to one — where a shelf hangs.
  wall?: "left" | "back";
}

export interface Point {
  x: number;
  y: number;
}

export function iso(gx: number, gy: number, lift = 0): Point {
  return { x: ROOM.originX + ((gx - gy) * ROOM.floorWidth) / 2, y: ROOM.originY + ((gx + gy) * ROOM.floorHeight) / 2 - lift };
}

export const toPoints = (points: Point[]) => points.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

// The door, on the left wall near the front — where the route starts.
export const DOOR = { gy0: 0.7, gy1: 0.92 };

// A room with many verses fills its floor instead: rows from the front (by the door) to the back,
// walked back and forth, each row set half a step over from the last so no picture hides another.
function gridSpots(count: number, theme: RoomTheme): RoomSpot[] {
  const rows = Math.ceil(Math.sqrt(count / 1.3));
  const cols = Math.ceil(count / rows);
  const step = 0.78 / (cols - 0.5);
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / cols);
    const along = index % cols;
    const col = row % 2 ? cols - 1 - along : along;
    const gx = 0.1 + (col + (row % 2) * 0.5) * step;
    const gy = 0.88 - row * (0.76 / Math.max(1, rows - 1));
    const kind = theme.inTheRoom[(row + col) % theme.inTheRoom.length];
    return { gx, gy, ...iso(gx, gy), kind };
  });
}

// `count` spots spaced evenly along the route, in verse order.
// The first two legs run along the walls (in at the door, so the route's first point is by the left wall).
export function roomSpots(count: number, theme: RoomTheme): RoomSpot[] {
  if (count > 9) return gridSpots(count, theme);
  const { route } = theme;
  const lengths = route.slice(1).map(([gx, gy], at) => Math.hypot(gx - route[at][0], gy - route[at][1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  return Array.from({ length: count }, (_, index) => {
    let along = ((index + 0.5) / count) * total;
    let leg = 0;
    while (leg < lengths.length - 1 && along > lengths[leg]) along -= lengths[leg++];
    const [ax, ay] = route[leg];
    const [bx, by] = route[leg + 1];
    const t = Math.min(1, along / lengths[leg]);
    const gx = ax + (bx - ax) * t;
    const gy = ay + (by - ay) * t;
    // Against a wall when it's close to one — where a shelf can hang.
    const side: RoomSpot["wall"] = gx < 0.22 ? "left" : gy < 0.22 ? "back" : undefined;
    const pool = side ? theme.againstWall : theme.inTheRoom;
    const kind = pool[index % pool.length];
    return { gx, gy, ...iso(gx, gy), kind, wall: side };
  });
}

// Back of the room first, so nearer furniture overlaps what's behind it.
export const drawingOrder = (spots: RoomSpot[]) => spots.map((spot, index) => ({ spot, index })).sort((a, b) => a.spot.gx + a.spot.gy - (b.spot.gx + b.spot.gy));

// The dotted walking route, from the door through every spot in order.
export function routePath(spots: RoomSpot[]): string {
  const door = iso(0.08, (DOOR.gy0 + DOOR.gy1) / 2);
  return [door, ...spots].map(({ x, y }, index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
}

// An isometric box standing on the floor at (gx, gy): its top and two visible faces.
// `halfY` makes it longer one way than the other (a bench).
export function box(gx: number, gy: number, half: number, height: number, lift = 0, halfY = half) {
  const corner = (dx: number, dy: number, up: number) => iso(gx + dx * half, gy + dy * halfY, lift + up);
  return {
    top: toPoints([corner(-1, -1, height), corner(1, -1, height), corner(1, 1, height), corner(-1, 1, height)]),
    left: toPoints([corner(-1, 1, height), corner(1, 1, height), corner(1, 1, 0), corner(-1, 1, 0)]),
    right: toPoints([corner(1, -1, height), corner(1, 1, height), corner(1, 1, 0), corner(1, -1, 0)]),
  };
}

// How big the furniture is — smaller in a room with many verses, so they don't crowd.
export const furnitureScale = (count: number) => Math.max(0.6, Math.min(1, 1.35 - count * 0.04));

// A flat patch of wall between two floor points, from `low` to `high` above the floor.
export const wallQuad = (from: [number, number], to: [number, number], low: number, high: number) =>
  toPoints([iso(from[0], from[1], low), iso(to[0], to[1], low), iso(to[0], to[1], high), iso(from[0], from[1], high)]);

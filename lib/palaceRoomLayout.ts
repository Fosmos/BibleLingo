// The geometry of a passage's room in the Palace (PalaceRoom.tsx): a 2.5D isometric room seen from
// its open front corner, its floor a unit square (gx along the right-hand back wall, gy along the
// left-hand one), and its verses' spots set along a walking route — in at the door on the left wall,
// along that wall to the back corner, along the back wall, then down the right side and into the
// middle (the method of loci: walk the room, meet the verses in order).

export const ROOM = { width: 320, height: 240, originX: 160, originY: 84, floorWidth: 288, floorHeight: 144, wallHeight: 70 };

export type FurnitureKind = "table" | "pedestal" | "chest" | "rug" | "shelf";

export interface RoomSpot {
  gx: number;
  gy: number;
  // Its point on the floor, on screen.
  x: number;
  y: number;
  kind: FurnitureKind;
  // The wall it stands against, on the route's first two legs — where a shelf hangs.
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

const ROUTE: [number, number][] = [
  [0.17, 0.8],
  [0.17, 0.17],
  [0.83, 0.17],
  [0.83, 0.83],
  [0.5, 0.83],
  [0.46, 0.4],
];

const AGAINST_WALL: FurnitureKind[] = ["table", "shelf", "pedestal", "shelf"];
const IN_THE_ROOM: FurnitureKind[] = ["rug", "table", "chest", "pedestal"];

// A room with many verses fills its floor instead: rows from the front (by the door) to the back,
// walked back and forth, each row set half a step over from the last so no picture hides another.
function gridSpots(count: number): RoomSpot[] {
  const rows = Math.ceil(Math.sqrt(count / 1.3));
  const cols = Math.ceil(count / rows);
  const step = 0.78 / (cols - 0.5);
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / cols);
    const along = index % cols;
    const col = row % 2 ? cols - 1 - along : along;
    const gx = 0.1 + (col + (row % 2) * 0.5) * step;
    const gy = 0.88 - row * (0.76 / Math.max(1, rows - 1));
    const kind: FurnitureKind = (row + col) % 2 ? "chest" : "rug";
    return { gx, gy, ...iso(gx, gy), kind };
  });
}

// `count` spots spaced evenly along the route, in verse order.
export function roomSpots(count: number): RoomSpot[] {
  if (count > 9) return gridSpots(count);
  const lengths = ROUTE.slice(1).map(([gx, gy], at) => Math.hypot(gx - ROUTE[at][0], gy - ROUTE[at][1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  return Array.from({ length: count }, (_, index) => {
    let along = ((index + 0.5) / count) * total;
    let leg = 0;
    while (leg < lengths.length - 1 && along > lengths[leg]) along -= lengths[leg++];
    const [ax, ay] = ROUTE[leg];
    const [bx, by] = ROUTE[leg + 1];
    const t = Math.min(1, along / lengths[leg]);
    const gx = ax + (bx - ax) * t;
    const gy = ay + (by - ay) * t;
    const wall = leg < 2;
    const kind = wall ? AGAINST_WALL[index % AGAINST_WALL.length] : IN_THE_ROOM[index % IN_THE_ROOM.length];
    const side: RoomSpot["wall"] = wall ? (leg === 0 ? "left" : "back") : undefined;
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
export function box(gx: number, gy: number, half: number, height: number, lift = 0) {
  const corner = (dx: number, dy: number, up: number) => iso(gx + dx, gy + dy, lift + up);
  return {
    top: toPoints([corner(-half, -half, height), corner(half, -half, height), corner(half, half, height), corner(-half, half, height)]),
    left: toPoints([corner(-half, half, height), corner(half, half, height), corner(half, half, 0), corner(-half, half, 0)]),
    right: toPoints([corner(half, -half, height), corner(half, half, height), corner(half, half, 0), corner(half, -half, 0)]),
  };
}

// How big the furniture is — smaller in a room with many verses, so they don't crowd.
export const furnitureScale = (count: number) => Math.max(0.6, Math.min(1, 1.35 - count * 0.04));

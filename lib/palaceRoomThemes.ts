// The kinds of room a passage can be in the Palace (PalaceRoom.tsx) — each its own floor, walls,
// things on the walls, furniture and walking route, so a book's passages are a string of different
// rooms rather than the same one over and over (a memory palace works best when every room is
// distinct). Next-door passages always get different rooms (roomThemeFor).

export type FurnitureKind = "table" | "pedestal" | "chest" | "rug" | "shelf" | "plant" | "barrel" | "lectern" | "bench" | "candle" | "crate";
export type FloorPattern = "planks" | "tiles" | "checker" | "grass";
export type DecorKind = "window" | "arches" | "bookcase" | "fireplace" | "banners" | "columns" | "painting";

export interface RoomTheme {
  id: string;
  // What the room's called, under it.
  name: string;
  floor: { pattern: FloorPattern; base: string; line: string; alt?: string };
  walls: { left: string; back: string; trim: string; height: number };
  decor: DecorKind[];
  // Furniture for spots along the walls, and out in the room — taken in turn.
  againstWall: FurnitureKind[];
  inTheRoom: FurnitureKind[];
  // The walking route from the door, as floor points (gx along the back wall, gy along the left).
  route: [number, number][];
}

const ROUTES = {
  around: [[0.17, 0.8], [0.17, 0.17], [0.83, 0.17], [0.83, 0.83], [0.5, 0.83], [0.46, 0.4]],
  // Across the middle of the room to the far side, then back along the front.
  zigzag: [[0.14, 0.72], [0.72, 0.14], [0.88, 0.45], [0.45, 0.88]],
  spiral: [[0.16, 0.82], [0.16, 0.16], [0.84, 0.16], [0.84, 0.84], [0.42, 0.84], [0.42, 0.42], [0.62, 0.45]],
  loop: [[0.16, 0.8], [0.28, 0.3], [0.72, 0.18], [0.84, 0.66], [0.5, 0.86], [0.5, 0.52]],
  snake: [[0.16, 0.84], [0.18, 0.18], [0.5, 0.2], [0.5, 0.82], [0.84, 0.82], [0.84, 0.18]],
} satisfies Record<string, [number, number][]>;

export const ROOM_THEMES: RoomTheme[] = [
  {
    id: "library",
    name: "The library",
    floor: { pattern: "planks", base: "fill-sand-300 dark:fill-zinc-800", line: "stroke-sand-400/50 dark:stroke-zinc-700" },
    walls: { left: "fill-sand-200 dark:fill-zinc-900", back: "fill-sand-100 dark:fill-zinc-900/70", trim: "fill-sand-400/70 dark:fill-zinc-700", height: 70 },
    decor: ["bookcase", "window", "painting"],
    againstWall: ["lectern", "shelf", "table", "shelf"],
    inTheRoom: ["rug", "table", "chest", "plant"],
    route: ROUTES.around,
  },
  {
    id: "hall",
    name: "The great hall",
    floor: { pattern: "tiles", base: "fill-sand-200 dark:fill-zinc-800", line: "stroke-sand-400/60 dark:stroke-zinc-700" },
    walls: { left: "fill-brand-200 dark:fill-brand-900/60", back: "fill-brand-100 dark:fill-brand-900/40", trim: "fill-brand-500/70 dark:fill-brand-800", height: 78 },
    decor: ["columns", "banners"],
    againstWall: ["pedestal", "candle"],
    inTheRoom: ["pedestal", "rug", "candle", "pedestal"],
    route: ROUTES.snake,
  },
  {
    id: "garden",
    name: "The garden",
    floor: { pattern: "grass", base: "fill-sage-300 dark:fill-sage-900", line: "stroke-sage-500/60 dark:stroke-sage-700" },
    walls: { left: "fill-sage-500 dark:fill-sage-800", back: "fill-sage-400 dark:fill-sage-800/80", trim: "fill-sage-600 dark:fill-sage-700", height: 30 },
    decor: [],
    againstWall: ["plant", "bench"],
    inTheRoom: ["plant", "pedestal", "bench", "crate"],
    route: ROUTES.loop,
  },
  {
    id: "kitchen",
    name: "The kitchen",
    floor: { pattern: "checker", base: "fill-sand-100 dark:fill-zinc-800", line: "stroke-sand-300 dark:stroke-zinc-700", alt: "fill-sand-400 dark:fill-zinc-700" },
    walls: { left: "fill-sage-200 dark:fill-zinc-900", back: "fill-sage-100 dark:fill-zinc-900/70", trim: "fill-sage-500/70 dark:fill-zinc-700", height: 70 },
    decor: ["fireplace", "window"],
    againstWall: ["barrel", "shelf", "crate"],
    inTheRoom: ["table", "barrel", "bench", "crate"],
    route: ROUTES.zigzag,
  },
  {
    id: "chapel",
    name: "The chapel",
    floor: { pattern: "tiles", base: "fill-sand-300 dark:fill-zinc-800", line: "stroke-sand-500/40 dark:stroke-zinc-700" },
    walls: { left: "fill-sand-200 dark:fill-zinc-900", back: "fill-sand-100 dark:fill-zinc-900/70", trim: "fill-sand-500/60 dark:fill-zinc-700", height: 84 },
    decor: ["arches"],
    againstWall: ["candle", "lectern"],
    inTheRoom: ["bench", "candle", "pedestal", "bench"],
    route: ROUTES.snake,
  },
  {
    id: "upper-room",
    name: "The upper room",
    floor: { pattern: "planks", base: "fill-brand-200 dark:fill-brand-900/50", line: "stroke-brand-400/50 dark:stroke-brand-800" },
    walls: { left: "fill-sand-200 dark:fill-zinc-900", back: "fill-paper dark:fill-zinc-900/70", trim: "fill-brand-400/60 dark:fill-brand-800", height: 66 },
    decor: ["window", "painting"],
    againstWall: ["chest", "shelf", "candle"],
    inTheRoom: ["rug", "table", "plant", "chest"],
    route: ROUTES.spiral,
  },
];

const hash = (text: string) => [...text].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);

// A passage's room: its order in the book picks it, offset by the book, so the rooms run differently
// in each book but two passages in a row are never the same room.
export const roomThemeFor = (book: string, order: number): RoomTheme => ROOM_THEMES[(order + hash(book)) % ROOM_THEMES.length];

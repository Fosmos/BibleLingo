import type { Palace3DRoomStyle } from "@/types";
import type { SurfacePattern } from "@/lib/palaceTab/palace3d/textures";

export interface RoomStyle {
  label: string;
  blurb: string;
  floor: { pattern: SurfacePattern; color: string; roughness: number };
  wall: { pattern: SurfacePattern; color: string; roughness: number };
  trim: string;
  // No ceiling: open to the sky, lit by the sun.
  open: boolean;
  ambient: { sky: string; ground: string; intensity: number };
  fog: { color: string; density: number };
  // The overhead shadow-casting light, and how strong the sun is here.
  key: { color: string; intensity: number };
  sun: number;
  // Fittings along its closed walls.
  fitting: "niches" | "bookshelves" | "topiary" | "stainedGlass";
  flame: string;
}

export const ROOM_STYLES: Record<Palace3DRoomStyle, RoomStyle> = {
  atrium: {
    label: "Marble atrium",
    blurb: "Warm stone, columns and an open skylight",
    floor: { pattern: "marble", color: "#efe6d4", roughness: 0.22 },
    wall: { pattern: "plaster", color: "#dccbaf", roughness: 0.85 },
    trim: "#a98f63",
    open: false,
    ambient: { sky: "#fff1d8", ground: "#9a8263", intensity: 0.85 },
    fog: { color: "#b9a587", density: 0.008 },
    key: { color: "#fff0d0", intensity: 13 },
    sun: 0,
    fitting: "niches",
    flame: "#ffb060",
  },
  library: {
    label: "Candlelit library",
    blurb: "Dark wood, tall shelves and warm lanterns",
    floor: { pattern: "wood", color: "#7b5233", roughness: 0.42 },
    wall: { pattern: "wood", color: "#5c3b24", roughness: 0.7 },
    trim: "#2e1c10",
    open: false,
    ambient: { sky: "#8a6340", ground: "#2a1a0e", intensity: 1 },
    fog: { color: "#21150c", density: 0.03 },
    key: { color: "#ffc98a", intensity: 34 },
    sun: 0,
    fitting: "bookshelves",
    flame: "#ff9a3c",
  },
  garden: {
    label: "Walled garden",
    blurb: "Open sky, clipped hedges and soft grass",
    floor: { pattern: "grass", color: "#6f9a4d", roughness: 1 },
    wall: { pattern: "hedge", color: "#74ad5d", roughness: 1 },
    trim: "#b9ae97",
    open: true,
    ambient: { sky: "#e4f1ff", ground: "#7f9a5a", intensity: 2 },
    fog: { color: "#c4dbe0", density: 0.008 },
    key: { color: "#fff6e2", intensity: 0 },
    sun: 2.6,
    fitting: "topiary",
    flame: "#ffd28a",
  },
  sanctum: {
    label: "Stained-glass sanctum",
    blurb: "Cold stone, torches and coloured light",
    floor: { pattern: "stone", color: "#5b6478", roughness: 0.5 },
    wall: { pattern: "stone", color: "#454d61", roughness: 0.8 },
    trim: "#b0914f",
    open: false,
    ambient: { sky: "#5a6c9a", ground: "#10131c", intensity: 0.55 },
    fog: { color: "#121828", density: 0.032 },
    key: { color: "#a9bdff", intensity: 30 },
    sun: 0,
    fitting: "stainedGlass",
    flame: "#ff8a3a",
  },
};

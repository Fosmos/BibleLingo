import type { Palace3D, Palace3DObjectKind, Palace3DRoom, Palace3DRoomStyle } from "@/types";
import { EYE_HEIGHT, ROOM_SIZE, SIDES, type RoomSide } from "@/lib/palace3d/layout";

// The Palace tab's Walk view: one ready-made building, every wall of it a page. Its stills are painted
// ahead of time from this same layout by the 3D engine (public/palace-book/), so a page needs no 3D
// on the phone, and where an object sits on a still is worked out from the camera below. Pure.
const ROOMS: { room: Palace3DRoom; name: string }[] = [
  { room: { id: "atrium", style: "atrium", gridX: 0, gridZ: 0 }, name: "The Atrium" },
  { room: { id: "library", style: "library", gridX: 0, gridZ: -1 }, name: "The Library" },
  { room: { id: "sanctum", style: "sanctum", gridX: 1, gridZ: -1 }, name: "The Sanctum" },
  { room: { id: "garden", style: "garden", gridX: 1, gridZ: 0 }, name: "The Garden" },
];

const WALLS: RoomSide[] = ["north", "east", "south", "west"];
const WALL_NAMES: Record<RoomSide, string> = { north: "North wall", east: "East wall", south: "South wall", west: "West wall" };

// Each wall's objects, left to right: `across` the wall, and how far `out` from it, in metres.
const SPOTS = [
  { across: -3.2, out: 1 },
  { across: -1.8, out: 1.7 },
  { across: 0, out: 2.3 },
  { across: 1.8, out: 1.7 },
  { across: 3.2, out: 1 },
];

const OBJECTS: Record<Palace3DRoomStyle, Palace3DObjectKind[]> = {
  atrium: ["statue", "urn", "pedestal", "lantern", "statue", "lantern", "pedestal", "fountain", "urn", "statue", "urn", "statue", "globe", "chest", "lantern", "pedestal", "lantern", "crystal", "throne", "urn"],
  library: ["globe", "lectern", "chest", "lantern", "urn", "lantern", "chest", "globe", "lectern", "statue", "urn", "lectern", "crystal", "globe", "chest", "statue", "chest", "lectern", "lantern", "globe"],
  sanctum: ["lantern", "crystal", "throne", "pedestal", "lantern", "urn", "statue", "lectern", "crystal", "urn", "crystal", "pedestal", "chest", "lantern", "statue", "lantern", "urn", "crystal", "statue", "pedestal"],
  garden: ["tree", "urn", "fountain", "lantern", "tree", "lantern", "tree", "statue", "urn", "tree", "tree", "pedestal", "chest", "crystal", "tree", "urn", "tree", "throne", "lantern", "tree"],
};

const STAND_BACK = 2;
const VERTICAL_FOV = 82;
const ASPECT = 3 / 4;
const OBJECT_SCALE = 0.8;
// Its number sits on the floor at its foot, so the object itself stays in view.
const MARK_HEIGHT = -0.12;

export interface BookObject {
  id: string;
  kind: Palace3DObjectKind;
  x: number;
  z: number;
  rotation: number;
  // Where it is on the still, in percent.
  left: number;
  top: number;
}

export interface BookWall {
  id: string;
  room: string;
  roomId: string;
  wall: string;
  side: RoomSide;
  camera: { x: number; z: number; yaw: number };
  objects: BookObject[];
}

function buildWall(room: Palace3DRoom, name: string, side: RoomSide, wallAt: number): BookWall {
  const { dx, dz } = SIDES[side];
  const centre = { x: room.gridX * ROOM_SIZE, z: room.gridZ * ROOM_SIZE };
  // Facing the wall: its direction, and your right.
  const [rightX, rightZ] = [-dz, dx];
  const camera = { x: centre.x - dx * STAND_BACK, z: centre.z - dz * STAND_BACK, yaw: Math.atan2(-dx, -dz) };
  const halfHeight = Math.tan((VERTICAL_FOV * Math.PI) / 360);
  const objects = SPOTS.map(({ across, out }, at): BookObject => {
    const fromCentre = ROOM_SIZE / 2 - out;
    const x = centre.x + dx * fromCentre + rightX * across;
    const z = centre.z + dz * fromCentre + rightZ * across;
    const depth = (x - camera.x) * dx + (z - camera.z) * dz;
    const sideways = (x - camera.x) * rightX + (z - camera.z) * rightZ;
    return {
      id: `${room.id}-${side}-${at}`,
      kind: OBJECTS[room.style][wallAt * SPOTS.length + at],
      x,
      z,
      rotation: camera.yaw,
      left: 50 + (50 * sideways) / depth / (halfHeight * ASPECT),
      top: 50 - (50 * (MARK_HEIGHT - EYE_HEIGHT)) / depth / halfHeight,
    };
  });
  return { id: `${room.id}-${side}`, room: name, roomId: room.id, wall: WALL_NAMES[side], side, camera, objects };
}

export const BOOK_WALLS: BookWall[] = ROOMS.flatMap(({ room, name }) => WALLS.map((side, at) => buildWall(room, name, side, at)));

export const BOOK_PALACE: Palace3D = {
  pathKey: "palace-book",
  rooms: ROOMS.map(({ room }) => room),
  objects: BOOK_WALLS.flatMap((wall) => wall.objects.map(({ id, kind, x, z, rotation }) => ({ id, roomId: wall.roomId, kind, x, z, rotation, scale: OBJECT_SCALE, visual: "words" as const }))),
};

export const SPOTS_PER_WALL = SPOTS.length;
export const stillOf = (wall: BookWall) => `/palace-book/${wall.id}.jpg`;

export interface BookPage<Verse> {
  wall: BookWall;
  // How many times round the building, from 1: a long path goes round again.
  round: number;
  verses: Verse[];
}

// Verses onto the objects in order, a wall to a page.
export function buildBookPages<Verse>(verses: Verse[]): BookPage<Verse>[] {
  const pages: BookPage<Verse>[] = [];
  for (let at = 0; at < verses.length; at += SPOTS_PER_WALL) {
    const page = pages.length;
    pages.push({ wall: BOOK_WALLS[page % BOOK_WALLS.length], round: Math.floor(page / BOOK_WALLS.length) + 1, verses: verses.slice(at, at + SPOTS_PER_WALL) });
  }
  return pages;
}

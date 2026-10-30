import type { Palace3DRoom } from "@/types";

// The 3D palace's floor plan, in metres. Rooms sit on a grid; side-by-side rooms join through a door
// in the middle of their shared wall. Pure — no Three.js — so the walking routes can be tested alone.
export const ROOM_SIZE = 10;
export const WALL_HEIGHT = 4.6;
export const WALL_THICKNESS = 0.3;
export const DOOR_WIDTH = 2.4;
export const DOOR_HEIGHT = 3.2;
export const EYE_HEIGHT = 1.6;
// How far from a wall you can stand, or an object can sit.
export const ROOM_MARGIN = 0.7;
export const MAX_ROOMS = 12;

export type RoomSide = "north" | "south" | "east" | "west";
export const SIDES: Record<RoomSide, { dx: number; dz: number }> = {
  north: { dx: 0, dz: -1 },
  south: { dx: 0, dz: 1 },
  east: { dx: 1, dz: 0 },
  west: { dx: -1, dz: 0 },
};
const SIDE_NAMES = Object.keys(SIDES) as RoomSide[];

export interface Point {
  x: number;
  z: number;
}

export function roomCentre(room: Palace3DRoom): Point {
  return { x: room.gridX * ROOM_SIZE, z: room.gridZ * ROOM_SIZE };
}

export function roomAtPoint(rooms: Palace3DRoom[], point: Point): Palace3DRoom | undefined {
  const [gridX, gridZ] = [Math.round(point.x / ROOM_SIZE), Math.round(point.z / ROOM_SIZE)];
  return rooms.find((room) => room.gridX === gridX && room.gridZ === gridZ);
}

export function neighbour(rooms: Palace3DRoom[], room: Palace3DRoom, side: RoomSide): Palace3DRoom | undefined {
  return rooms.find((other) => other.gridX === room.gridX + SIDES[side].dx && other.gridZ === room.gridZ + SIDES[side].dz);
}

export function openSides(rooms: Palace3DRoom[], room: Palace3DRoom): RoomSide[] {
  return SIDE_NAMES.filter((side) => neighbour(rooms, room, side));
}

export interface RoomAnchor {
  room: Palace3DRoom;
  side: RoomSide;
  gridX: number;
  gridZ: number;
}

// Every wall a new room could be added behind.
export function roomAnchors(rooms: Palace3DRoom[]): RoomAnchor[] {
  if (rooms.length >= MAX_ROOMS) return [];
  return rooms.flatMap((room) => SIDE_NAMES.filter((side) => !neighbour(rooms, room, side)).map((side) => ({ room, side, gridX: room.gridX + SIDES[side].dx, gridZ: room.gridZ + SIDES[side].dz })));
}

// A point kept inside a room, clear of its walls.
export function clampToRoom(room: Palace3DRoom, point: Point): Point {
  const centre = roomCentre(room);
  const reach = ROOM_SIZE / 2 - ROOM_MARGIN;
  return {
    x: Math.min(centre.x + reach, Math.max(centre.x - reach, point.x)),
    z: Math.min(centre.z + reach, Math.max(centre.z - reach, point.z)),
  };
}

// Where to stop when walking up to something: a little short of it, on the side you came from.
export function standBeside(room: Palace3DRoom, target: Point, from: Point): Point {
  const distance = Math.hypot(from.x - target.x, from.z - target.z) || 1;
  return clampToRoom(room, { x: target.x + ((from.x - target.x) / distance) * 1.9, z: target.z + ((from.z - target.z) / distance) * 1.9 });
}

function roomPath(rooms: Palace3DRoom[], from: Palace3DRoom, to: Palace3DRoom): Palace3DRoom[] {
  const cameFrom = new Map<string, Palace3DRoom>();
  const queue = [from];
  const seen = new Set([from.id]);
  while (queue.length) {
    const room = queue.shift()!;
    if (room.id === to.id) break;
    for (const side of SIDE_NAMES) {
      const next = neighbour(rooms, room, side);
      if (!next || seen.has(next.id)) continue;
      seen.add(next.id);
      cameFrom.set(next.id, room);
      queue.push(next);
    }
  }
  if (!seen.has(to.id)) return [];
  const path = [to];
  while (path[0].id !== from.id) path.unshift(cameFrom.get(path[0].id)!);
  return path;
}

// The points to walk through: each door on the way, then the destination. Empty if there's no way there.
export function walkRoute(rooms: Palace3DRoom[], from: Point, to: Point): Point[] {
  const [start, end] = [roomAtPoint(rooms, from), roomAtPoint(rooms, to)];
  if (!start || !end) return [];
  const path = roomPath(rooms, start, end);
  if (!path.length) return [];
  const doors: Point[] = [];
  path.slice(1).forEach((room, at) => {
    const [a, b] = [roomCentre(path[at]), roomCentre(room)];
    const door = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
    // Line up square to the door, so the walk never clips its frame.
    const inward = { x: Math.sign(a.x - b.x) * 1.2, z: Math.sign(a.z - b.z) * 1.2 };
    doors.push({ x: door.x + inward.x, z: door.z + inward.z }, { x: door.x - inward.x, z: door.z - inward.z });
  });
  return [...doors, clampToRoom(end, to)];
}

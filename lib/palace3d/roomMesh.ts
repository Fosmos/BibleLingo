import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import type { Palace3DRoom } from "@/types";
import { DOOR_HEIGHT, DOOR_WIDTH, ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS, roomCentre, type RoomSide } from "@/lib/palace3d/layout";
import { mesh, plain, surfaceMaterial, worldBox } from "@/lib/palace3d/meshes";
import { ROOM_STYLES, type RoomStyle } from "@/lib/palace3d/roomStyles";
import { fitWall, skylight, type Fitted, type RoomLight } from "@/lib/palace3d/roomFittings";

const WALLS: Record<RoomSide, { x: number; z: number; rotation: number }> = {
  north: { x: 0, z: -1, rotation: 0 },
  south: { x: 0, z: 1, rotation: Math.PI },
  east: { x: 1, z: 0, rotation: -Math.PI / 2 },
  west: { x: -1, z: 0, rotation: Math.PI / 2 },
};

export interface BuiltRoom {
  room: Palace3DRoom;
  group: Group;
  // What a tap can land on.
  floor: Mesh;
  walls: Mesh[];
  lights: RoomLight[];
  flames: Mesh[];
}

// A wall with a door stands inside its own room, so each room of a pair shows its own wall, not its neighbour's.
const DOOR_WALL_Z = WALL_THICKNESS / 2;

function solidWall(group: Group, material: MeshStandardMaterial, walls: Mesh[], width: number, height: number, x: number, y: number, z = -WALL_THICKNESS / 2) {
  const wall = mesh(worldBox(width, height, WALL_THICKNESS), material, x, y, z, false);
  group.add(wall);
  walls.push(wall);
}

function doorFrame(group: Group, style: RoomStyle) {
  const trim = plain(style.trim, 0.45, 0.25);
  const half = DOOR_WIDTH / 2;
  group.add(mesh(new BoxGeometry(0.22, DOOR_HEIGHT, WALL_THICKNESS + 0.1), trim, -half - 0.11, DOOR_HEIGHT / 2, DOOR_WALL_Z));
  group.add(mesh(new BoxGeometry(0.22, DOOR_HEIGHT, WALL_THICKNESS + 0.1), trim, half + 0.11, DOOR_HEIGHT / 2, DOOR_WALL_Z));
  group.add(mesh(new BoxGeometry(DOOR_WIDTH + 0.66, 0.26, WALL_THICKNESS + 0.14), trim, 0, DOOR_HEIGHT + 0.13, DOOR_WALL_Z));
}

function wallFor(style: RoomStyle, material: MeshStandardMaterial, side: RoomSide, hasDoor: boolean, fitted: Fitted, walls: Mesh[]): Group {
  const group = new Group();
  const { x, z, rotation } = WALLS[side];
  group.position.set((x * ROOM_SIZE) / 2, 0, (z * ROOM_SIZE) / 2);
  group.rotation.y = rotation;
  if (hasDoor) {
    const piece = (ROOM_SIZE - DOOR_WIDTH) / 2;
    solidWall(group, material, walls, piece, WALL_HEIGHT, -(DOOR_WIDTH + piece) / 2, WALL_HEIGHT / 2, DOOR_WALL_Z);
    solidWall(group, material, walls, piece, WALL_HEIGHT, (DOOR_WIDTH + piece) / 2, WALL_HEIGHT / 2, DOOR_WALL_Z);
    solidWall(group, material, walls, DOOR_WIDTH, WALL_HEIGHT - DOOR_HEIGHT, 0, (WALL_HEIGHT + DOOR_HEIGHT) / 2, DOOR_WALL_Z);
    doorFrame(group, style);
  } else {
    solidWall(group, material, walls, ROOM_SIZE, WALL_HEIGHT, 0, WALL_HEIGHT / 2);
    fitWall(group, fitted, style);
  }
  const trim = plain(style.trim, 0.55);
  const skirting = hasDoor ? [-(DOOR_WIDTH + (ROOM_SIZE - DOOR_WIDTH) / 2) / 2, (DOOR_WIDTH + (ROOM_SIZE - DOOR_WIDTH) / 2) / 2] : [0];
  const skirtWidth = hasDoor ? (ROOM_SIZE - DOOR_WIDTH) / 2 : ROOM_SIZE;
  skirting.forEach((at) => group.add(mesh(new BoxGeometry(skirtWidth, 0.22, 0.08), trim, at, 0.11, hasDoor ? WALL_THICKNESS + 0.04 : 0.04, false)));
  if (!style.open) group.add(mesh(new BoxGeometry(ROOM_SIZE, 0.26, 0.16), trim, 0, WALL_HEIGHT - 0.13, hasDoor ? WALL_THICKNESS + 0.08 : 0.08, false));
  return group;
}

// One whole room: floor, walls with a door toward each neighbour, its fittings, roof and lights.
export function buildRoom(room: Palace3DRoom, doors: RoomSide[]): BuiltRoom {
  const style = ROOM_STYLES[room.style];
  const group = new Group();
  const centre = roomCentre(room);
  group.position.set(centre.x, 0, centre.z);
  const fitted: Fitted = { lights: [], flames: [] };
  const walls: Mesh[] = [];
  const floor = mesh(worldBox(ROOM_SIZE, 0.2, ROOM_SIZE), surfaceMaterial(style.floor.pattern, style.floor.color, style.floor.roughness), 0, -0.1, 0, false);
  group.add(floor);
  const wallMaterial = surfaceMaterial(style.wall.pattern, style.wall.color, style.wall.roughness);
  const lightsByWall: RoomLight[][] = [];
  (Object.keys(WALLS) as RoomSide[]).forEach((side) => {
    const wallFitted: Fitted = { lights: [], flames: fitted.flames };
    const wall = wallFor(style, wallMaterial, side, doors.includes(side), wallFitted, walls);
    group.add(wall);
    wallFitted.lights.forEach((light) => {
      light.position.applyAxisAngle(new Vector3(0, 1, 0), wall.rotation.y).add(wall.position).add(group.position);
    });
    lightsByWall.push(wallFitted.lights);
  });
  if (!style.open) group.add(mesh(worldBox(ROOM_SIZE, 0.2, ROOM_SIZE), wallMaterial, 0, WALL_HEIGHT + 0.1, 0, false));
  if (room.style === "atrium") skylight(group);
  return { room, group, floor, walls, lights: lightsByWall.flat(), flames: fitted.flames };
}

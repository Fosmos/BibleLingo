import { Group, type Object3D } from "three";
import type { Palace3DRoom } from "@/types";
import { openSides } from "@/lib/palace3d/layout";
import { disposeTree } from "@/lib/palace3d/meshes";
import type { RoomLight } from "@/lib/palace3d/roomFittings";
import { buildRoom, type BuiltRoom } from "@/lib/palace3d/roomMesh";

// The palace's rooms, built afresh when the floor plan changes.
export class RoomSet {
  readonly group = new Group();
  private rooms: BuiltRoom[] = [];
  private signature = "";

  // True when the rooms were rebuilt.
  sync(rooms: Palace3DRoom[]): boolean {
    const signature = rooms.map((room) => `${room.id}:${room.style}:${room.gridX}:${room.gridZ}`).join();
    if (signature === this.signature) return false;
    this.signature = signature;
    this.rooms.forEach((built) => {
      this.group.remove(built.group);
      disposeTree(built.group);
    });
    this.rooms = rooms.map((room) => buildRoom(room, openSides(rooms, room)));
    this.rooms.forEach((built) => this.group.add(built.group));
    return true;
  }

  get tapTargets(): Object3D[] {
    return this.rooms.flatMap((built) => [built.floor, ...built.walls]);
  }

  isFloor(node: Object3D): boolean {
    return this.rooms.some((built) => built.floor === node);
  }

  get lights(): RoomLight[] {
    return this.rooms.flatMap((built) => built.lights);
  }

  tick(time: number) {
    this.rooms.forEach((built) => built.flames.forEach((flame, at) => (flame.scale.y = 1.6 + Math.sin(time * 12 + at * 1.7) * 0.2)));
  }
}

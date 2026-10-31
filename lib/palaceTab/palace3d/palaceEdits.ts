import type { Palace3D, Palace3DObject, Palace3DObjectKind, Palace3DRoomStyle } from "@/types";

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// A new palace: one atrium, with a pedestal to put the first verse on.
export function createPalace(pathKey: string): Palace3D {
  const room = { id: newId("room"), style: "atrium" as const, gridX: 0, gridZ: 0 };
  return { pathKey, rooms: [room], objects: [{ id: newId("object"), roomId: room.id, kind: "pedestal", x: 0, z: -2.5, rotation: 0, scale: 1, visual: "words" }] };
}

export function addRoom(palace: Palace3D, style: Palace3DRoomStyle, gridX: number, gridZ: number): Palace3D {
  return { ...palace, rooms: [...palace.rooms, { id: newId("room"), style, gridX, gridZ }] };
}

export function addObject(palace: Palace3D, kind: Palace3DObjectKind, roomId: string, x: number, z: number): { palace: Palace3D; id: string } {
  const object: Palace3DObject = { id: newId("object"), roomId, kind, x, z, rotation: 0, scale: 1, visual: "words" };
  return { palace: { ...palace, objects: [...palace.objects, object] }, id: object.id };
}

export function updateObject(palace: Palace3D, id: string, change: Partial<Palace3DObject>): Palace3D {
  return { ...palace, objects: palace.objects.map((object) => (object.id === id ? { ...object, ...change } : object)) };
}

export function removeObject(palace: Palace3D, id: string): Palace3D {
  return { ...palace, objects: palace.objects.filter((object) => object.id !== id) };
}

// A verse sits on one object at a time: placing it here takes it off any other.
export function placeVerse(palace: Palace3D, id: string, verseId: string | undefined): Palace3D {
  return {
    ...palace,
    objects: palace.objects.map((object) => {
      if (object.id === id) return { ...object, verseId };
      return object.verseId === verseId ? { ...object, verseId: undefined } : object;
    }),
  };
}

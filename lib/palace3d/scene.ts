import { Plane, Raycaster, Scene, Vector2, Vector3, type Object3D } from "three";
import type { Palace3D } from "@/types";
import { CameraRig } from "@/lib/palace3d/cameraRig";
import { AnchorMarks } from "@/lib/palace3d/anchorMarks";
import { clampToRoom, roomAtPoint, roomCentre, standBeside, walkRoute } from "@/lib/palace3d/layout";
import { PointerInput } from "@/lib/palace3d/pointerInput";
import { Atmosphere } from "@/lib/palace3d/atmosphere";
import { disposeTree } from "@/lib/palace3d/meshes";
import { RoomSet } from "@/lib/palace3d/roomSet";
import { ObjectLayer, type VerseLabel } from "@/lib/palace3d/objectLayer";
import { RenderPipeline } from "@/lib/palace3d/renderPipeline";
import { ROOM_STYLES } from "@/lib/palace3d/roomStyles";
import { disposeSurfaces } from "@/lib/palace3d/textures";

export interface PalaceSceneEvents {
  onSelect: (objectId: string | null) => void;
  onAddRoom: (gridX: number, gridZ: number) => void;
  onMoveObject: (objectId: string, x: number, z: number) => void;
}

// The 3D palace itself: everything Three.js, nothing React. It takes the palace to show and reports
// taps and drags; the screen (Palace3DScreen.tsx) owns the saved palace and the buttons around it.
export class PalaceScene {
  private readonly scene = new Scene();
  private readonly rig: CameraRig;
  private readonly pipeline: RenderPipeline;
  private readonly atmosphere: Atmosphere;
  private readonly objects = new ObjectLayer();
  private readonly rooms = new RoomSet();
  private readonly anchors = new AnchorMarks();
  private readonly raycaster = new Raycaster();
  private readonly observer: ResizeObserver;
  private readonly input: PointerInput;
  private palace: Palace3D;
  private building = false;
  private selected: string | null = null;
  private dragging: string | null = null;
  private grabOffset = { x: 0, z: 0 };
  private currentRoom: string | null = null;
  private frame = 0;
  private lastTime = 0;
  private sinceLights = 1;

  constructor(private readonly canvas: HTMLCanvasElement, palace: Palace3D, labelOf: (verseId: string) => VerseLabel | undefined, private readonly events: PalaceSceneEvents) {
    this.palace = palace;
    const start = roomCentre(palace.rooms[0]);
    this.rig = new CameraRig({ x: start.x, z: start.z + 3 }, window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    this.atmosphere = new Atmosphere(this.scene);
    this.pipeline = new RenderPipeline(canvas, this.scene, this.rig.camera);
    this.pipeline.onSlow = () => this.atmosphere.setShadows(false);
    this.scene.add(this.rooms.group, this.objects.group, this.anchors.group);
    this.setPalace(palace, labelOf);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    this.input = new PointerInput(canvas, { grab: (event) => this.grab(event), drag: (event) => this.dragObject(event), drop: () => this.drop(), look: (dx, dy) => this.rig.look(dx, dy), tap: (event) => this.tap(event) });
    this.frame = requestAnimationFrame(this.tick);
  }

  setPalace(palace: Palace3D, labelOf: (verseId: string) => VerseLabel | undefined) {
    this.palace = palace;
    if (this.rooms.sync(palace.rooms)) {
      this.anchors.sync(palace.rooms);
      this.sinceLights = 1;
      this.currentRoom = null;
    }
    this.objects.sync(palace.objects, labelOf, this.dragging);
  }

  setBuilding(building: boolean) {
    this.anchors.group.visible = this.building = building;
  }

  setSelected(id: string | null) {
    this.selected = id;
    this.objects.select(id);
  }

  readonly setPicture = (verseId: string, url: string) => this.objects.setPicture(verseId, url);

  placementSpot(): { roomId: string; x: number; z: number } | null {
    const room = roomAtPoint(this.palace.rooms, this.rig.position);
    return room ? { roomId: room.id, ...clampToRoom(room, this.rig.ahead(2.6)) } : null;
  }

  walkToObject(id: string) {
    const place = this.objects.place(id);
    const room = this.roomOf(id);
    if (!place || !room) return;
    this.rig.walk(walkRoute(this.palace.rooms, this.rig.position, standBeside(room, place, this.rig.position)), place);
  }

  private roomOf(objectId: string) {
    const object = this.objects.find(objectId);
    return object && this.palace.rooms.find((room) => room.id === object.roomId);
  }

  private castFrom(event: PointerEvent) {
    const box = this.canvas.getBoundingClientRect();
    const ndc = new Vector2(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.rig.camera);
  }

  private objectIdOf(node: Object3D | null): string | null {
    for (let at = node; at; at = at.parent) if (typeof at.userData.objectId === "string") return at.userData.objectId;
    return null;
  }

  private grab(event: PointerEvent): boolean {
    this.dragging = null;
    if (!this.building || !this.selected) return false;
    this.castFrom(event);
    const [hit] = this.raycaster.intersectObject(this.objects.group, true);
    this.dragging = hit && this.objectIdOf(hit.object) === this.selected ? this.selected : null;
    const [floor, place] = [this.floorPoint(event), this.dragging && this.objects.place(this.dragging)];
    if (floor && place) this.grabOffset = { x: place.x - floor.x, z: place.z - floor.z };
    return this.dragging !== null;
  }

  private dragObject(event: PointerEvent) {
    const room = this.dragging ? this.roomOf(this.dragging) : undefined;
    if (!this.dragging || !room) return;
    const floor = this.floorPoint(event);
    if (!floor) return;
    const { x, z } = clampToRoom(room, { x: floor.x + this.grabOffset.x, z: floor.z + this.grabOffset.z });
    this.objects.moveTo(this.dragging, x, z);
  }

  private floorPoint(event: PointerEvent): Vector3 | null {
    this.castFrom(event);
    return this.raycaster.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), 0), new Vector3());
  }

  private drop() {
    const place = this.dragging ? this.objects.place(this.dragging) : undefined;
    if (this.dragging && place) this.events.onMoveObject(this.dragging, place.x, place.z);
    this.dragging = null;
  }

  private tap(event: PointerEvent) {
    this.castFrom(event);
    const targets: Object3D[] = [this.objects.group, ...this.rooms.tapTargets];
    if (this.building) targets.unshift(this.anchors.group);
    const [hit] = this.raycaster.intersectObjects(targets, true);
    if (!hit) return;
    const anchor = hit.object.userData.anchor as { gridX: number; gridZ: number } | undefined;
    if (anchor) return this.events.onAddRoom(anchor.gridX, anchor.gridZ);
    const objectId = this.objectIdOf(hit.object);
    if (objectId) {
      this.events.onSelect(objectId);
      if (!this.building) this.walkToObject(objectId);
      return;
    }
    if (this.rooms.isFloor(hit.object)) {
      this.events.onSelect(null);
      this.rig.walk(walkRoute(this.palace.rooms, this.rig.position, { x: hit.point.x, z: hit.point.z }), null);
    }
  }

  private resize() {
    const { clientWidth: width, clientHeight: height } = this.canvas;
    if (!width || !height) return;
    this.rig.setAspect(width / height);
    this.pipeline.resize(width, height);
  }

  private tick = (now: number) => {
    this.frame = requestAnimationFrame(this.tick);
    const time = now / 1000;
    const delta = Math.min(0.2, time - this.lastTime || 0.016);
    this.lastTime = time;
    this.rig.tick(delta);
    const room = roomAtPoint(this.palace.rooms, this.rig.position);
    if (room && room.id !== this.currentRoom) {
      this.currentRoom = room.id;
      this.atmosphere.enterRoom(ROOM_STYLES[room.style], roomCentre(room));
    }
    this.sinceLights += delta;
    if (this.sinceLights > 0.4) {
      this.sinceLights = 0;
      this.atmosphere.assignLights(this.rooms.lights, this.rig.camera.position);
    }
    this.atmosphere.tick(time, delta, this.rig.camera.position);
    this.objects.tick(time, delta);
    this.rooms.tick(time);
    this.pipeline.render(delta);
  };

  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.input.dispose();
    disposeTree(this.scene);
    this.objects.dispose();
    this.anchors.dispose();
    this.pipeline.dispose();
    disposeSurfaces();
  }
}

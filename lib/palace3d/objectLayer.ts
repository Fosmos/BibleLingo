import { Color, Group, Mesh, MeshBasicMaterial, RingGeometry } from "three";
import type { Palace3DObject } from "@/types";
import { disposeTree } from "@/lib/palace3d/meshes";
import { buildObjectModel, type ObjectModel } from "@/lib/palace3d/objectModels";
import { buildVerseMark, type VerseMark } from "@/lib/palace3d/verseMarks";

export interface VerseLabel {
  opening: string;
}

interface Entry {
  object: Palace3DObject;
  root: Group;
  model: ObjectModel;
  mark: VerseMark | null;
  // Rebuilt only when this changes; moving, turning and resizing just update it in place.
  look: string;
}

// The objects standing in the palace, kept in step with the saved palace without rebuilding what
// hasn't changed — so dragging a size slider stays smooth.
export class ObjectLayer {
  readonly group = new Group();
  private readonly entries = new Map<string, Entry>();
  private readonly pictures = new Map<string, string>();
  // The ring on the floor around the selected object.
  private readonly ring = new Mesh(new RingGeometry(0.7, 0.8, 48), new MeshBasicMaterial({ color: new Color("#ffc765").multiplyScalar(2), toneMapped: false, transparent: true, opacity: 0.9 }));
  private selected: string | null = null;

  constructor() {
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;
    this.ring.visible = false;
    this.group.add(this.ring);
  }

  select(id: string | null) {
    this.selected = id;
    this.placeRing();
  }

  private placeRing() {
    const place = this.selected ? this.place(this.selected) : undefined;
    this.ring.visible = Boolean(place);
    if (place) this.ring.position.set(place.x, 0.02, place.z);
  }

  private build(object: Palace3DObject, label: VerseLabel | undefined, look: string): Entry {
    const root = new Group();
    root.userData.objectId = object.id;
    const model = buildObjectModel(object.kind);
    root.add(model.group);
    const mark = object.verseId && label ? buildVerseMark(object.visual, label.opening, this.pictures.get(object.verseId)) : null;
    if (mark) root.add(mark.group);
    this.group.add(root);
    return { object, root, model, mark, look };
  }

  sync(objects: Palace3DObject[], labelOf: (verseId: string) => VerseLabel | undefined, skipMove: string | null) {
    const wanted = new Set(objects.map((object) => object.id));
    this.entries.forEach((entry, id) => {
      if (wanted.has(id)) return;
      this.remove(id, entry);
    });
    for (const object of objects) {
      const label = object.verseId ? labelOf(object.verseId) : undefined;
      const look = `${object.kind}|${object.verseId ?? ""}|${object.visual}|${label?.opening ?? ""}`;
      let entry = this.entries.get(object.id);
      if (entry && entry.look !== look) {
        this.remove(object.id, entry);
        entry = undefined;
      }
      if (!entry) {
        entry = this.build(object, label, look);
        this.entries.set(object.id, entry);
      }
      entry.object = object;
      if (object.id !== skipMove) entry.root.position.set(object.x, 0, object.z);
      entry.model.group.rotation.y = object.rotation;
      entry.model.group.scale.setScalar(object.scale);
    }
    this.placeRing();
  }

  private remove(id: string, entry: Entry) {
    this.group.remove(entry.root);
    disposeTree(entry.root);
    this.entries.delete(id);
  }

  // A verse's picture, ready to draw (Palace3DVerseIcons.tsx).
  setPicture(verseId: string, url: string) {
    if (this.pictures.get(verseId) === url) return;
    this.pictures.set(verseId, url);
    this.entries.forEach((entry) => {
      if (entry.object.verseId === verseId) entry.mark?.setPicture?.(url);
    });
  }

  moveTo(id: string, x: number, z: number) {
    this.entries.get(id)?.root.position.set(x, 0, z);
    this.placeRing();
  }

  find(id: string): Palace3DObject | undefined {
    return this.entries.get(id)?.object;
  }

  place(id: string): { x: number; z: number } | undefined {
    const root = this.entries.get(id)?.root;
    return root && { x: root.position.x, z: root.position.z };
  }

  tick(time: number, delta: number) {
    this.entries.forEach(({ model, mark, object }, id) => {
      if (model.spin) model.spin.rotation.y += delta * 0.5;
      if (model.flame) model.flame.scale.y = 1.5 + Math.sin(time * 13 + object.x) * 0.16;
      if (mark) {
        mark.group.position.y = model.top * object.scale + 0.42 + Math.sin(time * 1.5 + id.length) * 0.035;
        if (mark.pulse) mark.pulse.scale.setScalar(1 + Math.sin(time * 2.4) * 0.14);
      }
    });
  }

  dispose() {
    disposeTree(this.group);
    this.entries.clear();
  }
}

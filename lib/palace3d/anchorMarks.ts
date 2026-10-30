import { CanvasTexture, Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import type { Palace3DRoom } from "@/types";
import { ROOM_SIZE, roomAnchors, roomCentre, SIDES } from "@/lib/palace3d/layout";

function plusTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "#ffd98a";
  ctx.lineWidth = 9;
  ctx.setLineDash([26, 15]);
  ctx.beginPath();
  ctx.roundRect(14, 14, 228, 228, 26);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(128, 72);
  ctx.lineTo(128, 184);
  ctx.moveTo(72, 128);
  ctx.lineTo(184, 128);
  ctx.stroke();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// The + on each wall a new room could open from, seen only while building.
export class AnchorMarks {
  readonly group = new Group();
  private readonly plus = plusTexture();

  constructor() {
    this.group.visible = false;
  }

  sync(rooms: Palace3DRoom[]) {
    this.group.children.slice().forEach((child) => {
      this.group.remove(child);
      const mark = child as Mesh;
      mark.geometry.dispose();
      (mark.material as MeshBasicMaterial).dispose();
    });
    for (const anchor of roomAnchors(rooms)) {
      const centre = roomCentre(anchor.room);
      const { dx, dz } = SIDES[anchor.side];
      const inset = ROOM_SIZE / 2 - 0.08;
      const mark = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: this.plus, transparent: true, toneMapped: false, depthWrite: false }));
      mark.position.set(centre.x + dx * inset, 1.25, centre.z + dz * inset);
      mark.rotation.y = Math.atan2(-dx, -dz);
      mark.userData.anchor = { gridX: anchor.gridX, gridZ: anchor.gridZ };
      this.group.add(mark);
    }
  }

  dispose() {
    this.plus.dispose();
  }
}

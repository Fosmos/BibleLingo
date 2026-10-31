import { CanvasTexture, ConeGeometry, CylinderGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SphereGeometry, SRGBColorSpace, BoxGeometry, Color, Vector3, AdditiveBlending, DoubleSide } from "three";
import { WALL_HEIGHT } from "@/lib/palaceTab/palace3d/layout";
import { mesh, plain } from "@/lib/palaceTab/palace3d/meshes";
import type { RoomStyle } from "@/lib/palaceTab/palace3d/roomStyles";

export interface RoomLight {
  position: Vector3;
  color: string;
  intensity: number;
  flicker: boolean;
}

export interface Fitted {
  lights: RoomLight[];
  flames: Mesh[];
}

// A wall-mounted flame, in a wall's own space (its room side is +z). Bright enough to bloom.
export function flame(group: Group, fitted: Fitted, style: RoomStyle, x: number, y: number, z: number, strength = 9) {
  const bracket = mesh(new CylinderGeometry(0.05, 0.08, 0.32, 8), plain("#2a2118", 0.5, 0.7), x, y - 0.22, z);
  const glow = new Mesh(new SphereGeometry(0.09, 10, 10), new MeshBasicMaterial({ color: new Color(style.flame).multiplyScalar(4), toneMapped: false }));
  glow.position.set(x, y, z);
  glow.scale.y = 1.6;
  group.add(bracket, glow);
  fitted.flames.push(glow);
  fitted.lights.push({ position: new Vector3(x, y, z + 0.4), color: style.flame, intensity: strength, flicker: true });
}

function column(group: Group, x: number, z: number, style: RoomStyle) {
  const stone = plain("#e5d9c2", 0.45);
  group.add(mesh(new CylinderGeometry(0.26, 0.31, WALL_HEIGHT - 0.5, 20), stone, x, WALL_HEIGHT / 2, z));
  group.add(mesh(new BoxGeometry(0.78, 0.25, 0.78), plain(style.trim, 0.5), x, 0.13, z));
  group.add(mesh(new CylinderGeometry(0.46, 0.27, 0.28, 20), plain(style.trim, 0.5), x, WALL_HEIGHT - 0.3, z));
}

const BOOK_COLOURS = ["#6e2a22", "#254a3d", "#2c3c63", "#7a5a1d", "#4d2a4d", "#8a7450", "#3a2418"];

function shelves(group: Group, fitted: Fitted, style: RoomStyle) {
  const wood = plain("#3a2415", 0.6);
  for (let row = 0; row < 6; row++) group.add(mesh(new BoxGeometry(8.6, 0.09, 0.42), wood, 0, 0.35 + row * 0.62, 0.22));
  for (let post = -4; post <= 4; post += 2) group.add(mesh(new BoxGeometry(0.1, 3.5, 0.44), wood, post * 1.07, 1.75, 0.22));
  const books = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ roughness: 0.75 }), 270);
  const [matrix, color] = [new Matrix4(), new Color()];
  let count = 0;
  for (let row = 0; row < 5; row++) {
    let x = -4.15;
    while (x < 4.1 && count < 270) {
      const [width, height] = [0.07 + Math.random() * 0.09, 0.36 + Math.random() * 0.17];
      if (Math.random() > 0.08) {
        matrix.makeScale(width, height, 0.28);
        matrix.setPosition(x + width / 2, 0.4 + row * 0.62 + height / 2, 0.24);
        books.setMatrixAt(count, matrix);
        books.setColorAt(count, color.set(BOOK_COLOURS[Math.floor(Math.random() * BOOK_COLOURS.length)]));
        count++;
      }
      x += width + 0.012;
    }
  }
  books.count = count;
  books.castShadow = true;
  group.add(books);
  flame(group, fitted, style, 0, 3.85, 0.3, 8);
}

function stainedWindow(group: Group, fitted: Fitted) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const glass = ["#2f62e0", "#c7263a", "#e7ad25", "#159a7b", "#7d38c9"];
  ctx.fillStyle = "#0b0b10";
  ctx.fillRect(0, 0, 256, 512);
  // An arched window of coloured panes, joined by dark lead.
  ctx.beginPath();
  ctx.moveTo(6, 506);
  ctx.lineTo(6, 128);
  ctx.arc(128, 128, 122, Math.PI, 0);
  ctx.lineTo(250, 506);
  ctx.closePath();
  ctx.clip();
  for (let row = 0; row < 9; row++) {
    for (let cell = 0; cell < 4; cell++) {
      ctx.fillStyle = glass[Math.floor(Math.random() * glass.length)];
      ctx.fillRect(cell * 64, row * 57, 64, 57);
      ctx.strokeStyle = "#0b0b10";
      ctx.lineWidth = 5;
      ctx.strokeRect(cell * 64, row * 57, 64, 57);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  group.add(new Mesh(new PlaneGeometry(1.5, 2.9), new MeshBasicMaterial({ map: texture, color: new Color(1.25, 1.25, 1.25), toneMapped: false })));
  const pane = group.children[group.children.length - 1];
  pane.position.set(0, 2.55, 0.02);
  fitted.lights.push({ position: new Vector3(0, 2.6, 1), color: "#7da0ff", intensity: 10, flicker: false });
}

function topiary(group: Group, x: number) {
  group.add(mesh(new CylinderGeometry(0.26, 0.2, 0.42, 14), plain("#a9755a", 0.9), x, 0.21, 0.6));
  group.add(mesh(new ConeGeometry(0.55, 1.9, 14), plain("#37612f", 1), x, 1.35, 0.6));
}

// What lines a closed wall, in the wall's own space.
export function fitWall(group: Group, fitted: Fitted, style: RoomStyle) {
  if (style.fitting === "niches") {
    column(group, -3.2, 0.45, style);
    column(group, 3.2, 0.45, style);
    flame(group, fitted, style, 0, 2.6, 0.22, 7);
  } else if (style.fitting === "bookshelves") {
    shelves(group, fitted, style);
  } else if (style.fitting === "topiary") {
    topiary(group, -3.2);
    topiary(group, 3.2);
  } else {
    stainedWindow(group, fitted);
    flame(group, fitted, style, -3.2, 2.5, 0.22, 11);
    flame(group, fitted, style, 3.2, 2.5, 0.22, 11);
  }
}

// The atrium's opening in the roof, with its shaft of light falling through the dust.
export function skylight(group: Group) {
  const disc = new Mesh(new CylinderGeometry(1.1, 1.1, 0.04, 40), new MeshBasicMaterial({ color: new Color(1.5, 1.45, 1.3), toneMapped: false }));
  disc.position.y = WALL_HEIGHT - 0.03;
  const shaft = new Mesh(
    new CylinderGeometry(1.1, 2.3, WALL_HEIGHT, 40, 1, true),
    new MeshBasicMaterial({ color: "#ffe9c0", transparent: true, opacity: 0.018, blending: AdditiveBlending, side: DoubleSide, depthWrite: false }),
  );
  shaft.position.y = WALL_HEIGHT / 2;
  group.add(disc, shaft);
}

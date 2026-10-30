import { AdditiveBlending, CanvasTexture, Group, Mesh, MeshBasicMaterial, SphereGeometry, SRGBColorSpace, Sprite, SpriteMaterial, Color } from "three";
import type { Palace3DVerseVisual } from "@/types";

export interface VerseMark {
  group: Group;
  // Pulses in the scene's frame loop.
  pulse?: Mesh;
  // The picture's sprite, filled in when its image has loaded.
  setPicture?: (url: string) => void;
}

function spriteFrom(canvas: HTMLCanvasElement, width: number): Sprite {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const sprite = new Sprite(new SpriteMaterial({ map: texture, transparent: true, toneMapped: false, depthWrite: false }));
  sprite.scale.set(width, (width * canvas.height) / canvas.width, 1);
  return sprite;
}

function wordsSprite(words: string): Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  ctx.font = "600 56px Georgia, serif";
  const width = Math.min(600, ctx.measureText(words).width + 64);
  const left = (640 - width) / 2;
  ctx.fillStyle = "rgba(18,14,10,.78)";
  ctx.strokeStyle = "#d9b566";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(left, 30, width, 100, 28);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff4dc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(words, 320, 82, 560);
  return spriteFrom(canvas, 2.1);
}

function pictureDisc(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(18,14,10,.82)";
  ctx.strokeStyle = "#d9b566";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(128, 128, 118, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  return { canvas, ctx };
}

function pictureMark(url: string | undefined): VerseMark {
  const group = new Group();
  const { canvas, ctx } = pictureDisc();
  const sprite = spriteFrom(canvas, 0.85);
  group.add(sprite);
  const setPicture = (next: string) => {
    const image = new Image();
    image.onload = () => {
      ctx.drawImage(image, 58, 58, 140, 140);
      if (sprite.material.map) sprite.material.map.needsUpdate = true;
    };
    image.src = next;
  };
  if (url) setPicture(url);
  return { group, setPicture };
}

function orbMark(): VerseMark {
  const group = new Group();
  const pulse = new Mesh(new SphereGeometry(0.11, 20, 16), new MeshBasicMaterial({ color: new Color("#ffd98a").multiplyScalar(2), toneMapped: false }));
  const halo = new Mesh(new SphereGeometry(0.2, 20, 16), new MeshBasicMaterial({ color: "#ffbf60", transparent: true, opacity: 0.1, blending: AdditiveBlending, depthWrite: false }));
  group.add(pulse, halo);
  return { group, pulse };
}

// A verse above its object: its first words, its picture, or just an orb, which keeps the words
// hidden until it's tapped.
export function buildVerseMark(visual: Palace3DVerseVisual, opening: string, picture: string | undefined): VerseMark {
  if (visual === "picture") return pictureMark(picture);
  if (visual === "orb") return orbMark();
  const group = new Group();
  group.add(wordsSprite(opening));
  return { group };
}

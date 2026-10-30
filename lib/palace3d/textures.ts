import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";

// Surfaces painted in code at startup — pale patterns the room's materials tint with their colour, so
// one marble serves every room. Each is used as both colour and bump.
export type SurfacePattern = "marble" | "plaster" | "wood" | "stone" | "grass" | "hedge";

const SIZE = 512;

function speckle(ctx: CanvasRenderingContext2D, count: number, spread: number, alpha: number, max: number) {
  for (let at = 0; at < count; at++) {
    const shade = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${Math.random() * alpha})`;
    const size = Math.random() * max + spread;
    ctx.fillRect(Math.random() * SIZE, Math.random() * SIZE, size, size);
  }
}

function veins(ctx: CanvasRenderingContext2D, count: number) {
  for (let at = 0; at < count; at++) {
    ctx.strokeStyle = `rgba(70,60,50,${0.04 + Math.random() * 0.1})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.2;
    ctx.beginPath();
    let [x, y] = [Math.random() * SIZE, Math.random() * SIZE];
    ctx.moveTo(x, y);
    for (let step = 0; step < 14; step++) {
      const [nextX, nextY] = [x + (Math.random() - 0.3) * 60, y + (Math.random() - 0.5) * 34];
      ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, nextX, nextY);
      [x, y] = [nextX, nextY];
    }
    ctx.stroke();
  }
}

function blocks(ctx: CanvasRenderingContext2D, rows: number, columns: number, gap: string) {
  const [w, h] = [SIZE / columns, SIZE / rows];
  for (let row = 0; row < rows; row++) {
    for (let column = -1; column < columns; column++) {
      const x = column * w + (row % 2) * (w / 2);
      const tone = 205 + Math.random() * 45;
      ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      ctx.fillRect(x, row * h, w, h);
      ctx.strokeStyle = gap;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, row * h, w, h);
    }
  }
}

const PAINTERS: Record<SurfacePattern, (ctx: CanvasRenderingContext2D) => void> = {
  marble: (ctx) => {
    blocks(ctx, 2, 2, "rgba(60,50,40,.45)");
    veins(ctx, 26);
    speckle(ctx, 2500, 0.5, 0.05, 2);
  },
  plaster: (ctx) => {
    ctx.fillStyle = "#e6e6e6";
    ctx.fillRect(0, 0, SIZE, SIZE);
    speckle(ctx, 9000, 1, 0.05, 7);
  },
  wood: (ctx) => {
    for (let plank = 0; plank < 6; plank++) {
      const tone = 150 + Math.random() * 70;
      ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      ctx.fillRect(0, (plank * SIZE) / 6, SIZE, SIZE / 6);
      for (let grain = 0; grain < 60; grain++) {
        ctx.fillStyle = `rgba(30,20,10,${Math.random() * 0.14})`;
        ctx.fillRect(Math.random() * SIZE, (plank * SIZE) / 6 + Math.random() * (SIZE / 6), 60 + Math.random() * 240, 1 + Math.random() * 2);
      }
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(0, (plank * SIZE) / 6, SIZE, 3);
    }
  },
  stone: (ctx) => {
    blocks(ctx, 5, 3, "rgba(15,15,20,.75)");
    speckle(ctx, 7000, 1, 0.09, 5);
  },
  grass: (ctx) => {
    ctx.fillStyle = "#c8c8c8";
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let blade = 0; blade < 9000; blade++) {
      const tone = 120 + Math.random() * 135;
      ctx.strokeStyle = `rgba(${tone},${tone},${tone},.55)`;
      const [x, y] = [Math.random() * SIZE, Math.random() * SIZE];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 7, y - 4 - Math.random() * 9);
      ctx.stroke();
    }
  },
  hedge: (ctx) => {
    ctx.fillStyle = "#6c6c6c";
    ctx.fillRect(0, 0, SIZE, SIZE);
    for (let leaf = 0; leaf < 7000; leaf++) {
      const tone = 90 + Math.random() * 165;
      ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * SIZE, Math.random() * SIZE, 2 + Math.random() * 6, 1 + Math.random() * 3, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};

const cache = new Map<SurfacePattern, { map: Texture; bump: Texture }>();

export function surface(pattern: SurfacePattern): { map: Texture; bump: Texture } {
  const cached = cache.get(pattern);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  PAINTERS[pattern](ctx);
  const map = new CanvasTexture(canvas);
  map.wrapS = map.wrapT = RepeatWrapping;
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  const bump = new CanvasTexture(canvas);
  bump.wrapS = bump.wrapT = RepeatWrapping;
  const made = { map, bump };
  cache.set(pattern, made);
  return made;
}

export function disposeSurfaces() {
  cache.forEach(({ map, bump }) => {
    map.dispose();
    bump.dispose();
  });
  cache.clear();
}

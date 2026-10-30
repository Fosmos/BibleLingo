import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, CanvasTexture, Color, DirectionalLight, FogExp2, HemisphereLight, Mesh, MeshBasicMaterial, PointLight, Points, PointsMaterial, type Scene, SphereGeometry, SpotLight, SRGBColorSpace, Vector3 } from "three";
import type { RoomLight } from "@/lib/palace3d/roomFittings";
import { ROOM_SIZE, WALL_HEIGHT, type Point } from "@/lib/palace3d/layout";
import type { RoomStyle } from "@/lib/palace3d/roomStyles";

const POOL = 4;
const DUST = 260;
const DUST_REACH = 7;

function skyDome(): Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#3f7fc7");
  gradient.addColorStop(0.42, "#a6d2ee");
  gradient.addColorStop(0.5, "#f6e8cf");
  gradient.addColorStop(1, "#6d7a55");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 8, 256);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return new Mesh(new SphereGeometry(400, 24, 16), new MeshBasicMaterial({ map, side: BackSide, fog: false, toneMapped: false }));
}

function dustMote(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  return new CanvasTexture(canvas);
}

// What fills the air: sky, fog and dust; and the lights, which change with the room you're in. Only the
// nearest few of the palace's flames are really lit, so a big palace costs the same as a small one.
export class Atmosphere {
  private readonly hemi = new HemisphereLight("#ffffff", "#444444", 0.5);
  private readonly sun = new DirectionalLight("#fff1d6", 0);
  private readonly key = new SpotLight("#ffffff", 0, 14, 1.05, 0.65, 1.4);
  private readonly pool = Array.from({ length: POOL }, () => new PointLight("#ffffff", 0, 11, 1.6));
  private readonly dust: Points;
  private readonly fog = new FogExp2("#000000", 0.02);
  private assigned: (RoomLight | null)[] = Array(POOL).fill(null);
  private readonly targets = { sky: new Color(), ground: new Color(), fog: new Color(), key: new Color() };
  private target = { hemi: 0.5, fog: 0.02, key: 0, sun: 0 };

  constructor(scene: Scene) {
    scene.fog = this.fog;
    scene.add(skyDome(), this.hemi, this.sun, this.sun.target, this.key, this.key.target, ...this.pool);
    this.sun.position.set(8, 26, 6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0006;
    Object.assign(this.sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 60 });
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    this.key.shadow.bias = -0.0008;
    const positions = new Float32Array(DUST * 3).map(() => (Math.random() - 0.5) * DUST_REACH * 2);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    this.dust = new Points(geometry, new PointsMaterial({ color: "#ffe9c4", size: 0.03, map: dustMote(), transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false }));
    this.dust.frustumCulled = false;
    scene.add(this.dust);
  }

  enterRoom(style: RoomStyle, centre: Point) {
    this.targets.sky.set(style.ambient.sky);
    this.targets.ground.set(style.ambient.ground);
    this.targets.fog.set(style.fog.color);
    this.targets.key.set(style.key.color);
    this.target = { hemi: style.ambient.intensity, fog: style.fog.density, key: style.key.intensity, sun: style.sun };
    this.key.position.set(centre.x, WALL_HEIGHT - 0.25, centre.z);
    this.key.target.position.set(centre.x, 0, centre.z);
    this.sun.position.set(centre.x + 8, 26, centre.z + 6);
    this.sun.target.position.set(centre.x, 0, centre.z);
  }

  // Lights the nearest flames, called now and then rather than every frame.
  assignLights(lights: RoomLight[], eye: Vector3) {
    const nearest = [...lights].sort((a, b) => a.position.distanceToSquared(eye) - b.position.distanceToSquared(eye)).slice(0, POOL);
    this.assigned = this.pool.map((light, at) => {
      const source = nearest[at] ?? null;
      if (source) {
        light.position.copy(source.position);
        light.color.set(source.color);
      }
      return source;
    });
  }

  setShadows(on: boolean) {
    this.sun.castShadow = on;
    this.key.castShadow = on;
  }

  tick(time: number, delta: number, eye: Vector3) {
    const ease = Math.min(1, delta * 2.5);
    this.hemi.color.lerp(this.targets.sky, ease);
    this.hemi.groundColor.lerp(this.targets.ground, ease);
    this.hemi.intensity += (this.target.hemi - this.hemi.intensity) * ease;
    this.fog.color.lerp(this.targets.fog, ease);
    this.fog.density += (this.target.fog - this.fog.density) * ease;
    this.key.color.lerp(this.targets.key, ease);
    this.key.intensity += (this.target.key - this.key.intensity) * ease;
    this.sun.intensity += (this.target.sun - this.sun.intensity) * ease;
    this.pool.forEach((light, at) => {
      const source = this.assigned[at];
      const wave = source?.flicker ? 0.86 + Math.sin(time * 11 + at * 2.1) * 0.07 + Math.sin(time * 23 + at) * 0.05 : 1;
      light.intensity = (source?.intensity ?? 0) * wave;
    });
    // The dust stays in a box around you, wrapping as it drifts.
    const position = this.dust.geometry.getAttribute("position");
    for (let at = 0; at < DUST; at++) {
      const y = position.getY(at) + delta * 0.03;
      position.setY(at, y > DUST_REACH ? -DUST_REACH : y);
      position.setX(at, position.getX(at) + Math.sin(time * 0.3 + at) * delta * 0.02);
    }
    position.needsUpdate = true;
    this.dust.position.set(Math.round(eye.x / ROOM_SIZE) * ROOM_SIZE, 2, Math.round(eye.z / ROOM_SIZE) * ROOM_SIZE);
  }
}

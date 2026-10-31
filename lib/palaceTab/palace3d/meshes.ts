import { BoxGeometry, Color, Mesh, MeshStandardMaterial, type BufferGeometry, type Material, type Object3D } from "three";
import { surface, type SurfacePattern } from "@/lib/palaceTab/palace3d/textures";

// The texture repeats every this many metres, whatever size the box.
const TEXTURE_METRES = 2.5;

// A box whose texture keeps its real-world scale instead of stretching to fit.
export function worldBox(width: number, height: number, depth: number): BoxGeometry {
  const geometry = new BoxGeometry(width, height, depth);
  const [position, normal, uv] = [geometry.getAttribute("position"), geometry.getAttribute("normal"), geometry.getAttribute("uv")];
  for (let at = 0; at < position.count; at++) {
    const [x, y, z] = [position.getX(at), position.getY(at), position.getZ(at)];
    if (Math.abs(normal.getX(at)) > 0.5) uv.setXY(at, z / TEXTURE_METRES, y / TEXTURE_METRES);
    else if (Math.abs(normal.getY(at)) > 0.5) uv.setXY(at, x / TEXTURE_METRES, z / TEXTURE_METRES);
    else uv.setXY(at, x / TEXTURE_METRES, y / TEXTURE_METRES);
  }
  return geometry;
}

export function surfaceMaterial(pattern: SurfacePattern, color: string, roughness: number): MeshStandardMaterial {
  const { map, bump } = surface(pattern);
  return new MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 1.2, color, roughness });
}

export function plain(color: string, roughness = 0.7, metalness = 0, emissive?: string, emissiveIntensity = 1): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, roughness, metalness, emissive: new Color(emissive ?? "#000000"), emissiveIntensity: emissive ? emissiveIntensity : 0 });
}

export function mesh(geometry: BufferGeometry, material: Material, x = 0, y = 0, z = 0, shadow = true): Mesh {
  const made = new Mesh(geometry, material);
  made.position.set(x, y, z);
  made.castShadow = shadow;
  made.receiveShadow = true;
  return made;
}

// Frees everything under an object, except textures shared through lib/palace3d/textures.ts.
export function disposeTree(root: Object3D) {
  root.traverse((node) => {
    const held = node as Mesh;
    held.geometry?.dispose();
    const materials = held.material ? (Array.isArray(held.material) ? held.material : [held.material]) : [];
    materials.forEach((material) => material.dispose());
  });
}

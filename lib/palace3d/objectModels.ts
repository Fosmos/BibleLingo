import { BoxGeometry, ConeGeometry, CylinderGeometry, DodecahedronGeometry, Group, IcosahedronGeometry, LatheGeometry, Mesh, MeshBasicMaterial, OctahedronGeometry, SphereGeometry, TorusGeometry, Vector2, Color, type MeshStandardMaterial } from "three";
import type { Palace3DObjectKind } from "@/types";
import { mesh, plain } from "@/lib/palace3d/meshes";

export interface ObjectModel {
  group: Group;
  // Where a verse floats above it.
  top: number;
  // Turns gently, or flickers, in the scene's frame loop.
  spin?: Mesh;
  flame?: Mesh;
}

const lathe = (points: [number, number][]) => new LatheGeometry(points.map(([r, y]) => new Vector2(r, y)), 32);
const glow = (color: string, strength = 4) => new MeshBasicMaterial({ color: new Color(color).multiplyScalar(strength), toneMapped: false });

const BUILDERS: Record<Palace3DObjectKind, () => ObjectModel> = {
  pedestal: () => {
    const group = new Group();
    group.add(mesh(lathe([[0, 0], [0.5, 0], [0.5, 0.12], [0.34, 0.2], [0.24, 0.32], [0.2, 0.75], [0.24, 0.92], [0.42, 1.02], [0.42, 1.1], [0, 1.1]]), plain("#d9cfbd", 0.32)));
    return { group, top: 1.1 };
  },
  statue: () => {
    const group = new Group();
    const stone = plain("#cfc8ba", 0.55);
    group.add(mesh(new BoxGeometry(0.9, 0.3, 0.9), plain("#8d8678", 0.6), 0, 0.15));
    group.add(mesh(lathe([[0.38, 0], [0.33, 0.6], [0.24, 1.05], [0.22, 1.25], [0.12, 1.35], [0, 1.37]]), stone, 0, 0.3));
    group.add(mesh(new SphereGeometry(0.15, 20, 16), stone, 0, 1.8));
    const arm = mesh(new CylinderGeometry(0.05, 0.065, 0.72, 10), stone, 0.27, 1.62);
    arm.rotation.z = -0.9;
    group.add(arm, mesh(new SphereGeometry(0.075, 12, 10), plain("#c7a14f", 0.3, 0.8), 0.57, 1.86));
    return { group, top: 2 };
  },
  lantern: () => {
    const group = new Group();
    const iron = plain("#28231e", 0.45, 0.8);
    group.add(mesh(new CylinderGeometry(0.2, 0.26, 0.08, 12), iron, 0, 0.04));
    group.add(mesh(new CylinderGeometry(0.035, 0.035, 1.5, 8), iron, 0, 0.8));
    group.add(mesh(new CylinderGeometry(0.2, 0.14, 0.04, 6), iron, 0, 1.56));
    group.add(mesh(new ConeGeometry(0.25, 0.2, 6), iron, 0, 2.02));
    for (let bar = 0; bar < 6; bar++) group.add(mesh(new BoxGeometry(0.02, 0.36, 0.02), iron, Math.cos((bar * Math.PI) / 3) * 0.18, 1.74, Math.sin((bar * Math.PI) / 3) * 0.18));
    const flame = new Mesh(new SphereGeometry(0.085, 12, 12), glow("#ffa750", 5));
    flame.position.y = 1.74;
    flame.scale.y = 1.5;
    group.add(flame);
    return { group, top: 2.15, flame };
  },
  fountain: () => {
    const group = new Group();
    const stone = plain("#bdb5a4", 0.5);
    group.add(mesh(lathe([[0, 0], [1.05, 0], [1.1, 0.4], [1, 0.45], [0.92, 0.2], [0, 0.2]]), stone));
    group.add(mesh(lathe([[0.2, 0.2], [0.12, 0.8], [0.45, 1], [0.47, 1.1], [0.1, 1.04], [0, 1.04]]), stone));
    const water = plain("#6fb7d6", 0.06, 0.1, "#1c5f80", 0.4);
    group.add(mesh(new CylinderGeometry(0.93, 0.93, 0.02, 32), water, 0, 0.34, 0, false));
    group.add(mesh(new CylinderGeometry(0.4, 0.4, 0.02, 24), water, 0, 1.05, 0, false));
    group.add(mesh(new SphereGeometry(0.11, 14, 12), plain("#d9f1fb", 0.05, 0, "#7fc8ea", 0.8), 0, 1.2, 0, false));
    return { group, top: 1.35 };
  },
  tree: () => {
    const group = new Group();
    group.add(mesh(new CylinderGeometry(0.13, 0.24, 1.8, 10), plain("#54391f", 0.95), 0, 0.9));
    const leaves = plain("#4f8a3c", 0.95);
    ([[0, 2.25, 0, 0.95], [0.55, 1.95, 0.2, 0.6], [-0.5, 2, -0.25, 0.65], [0.05, 2.75, 0.2, 0.55]] as const).forEach(([x, y, z, size]) => group.add(mesh(new DodecahedronGeometry(size, 1), leaves, x, y, z)));
    return { group, top: 3.3 };
  },
  chest: () => {
    const group = new Group();
    const wood = plain("#6d4525", 0.7);
    const brass = plain("#c29a45", 0.32, 0.85);
    group.add(mesh(new BoxGeometry(1.05, 0.5, 0.65), wood, 0, 0.25));
    const lid = mesh(new CylinderGeometry(0.325, 0.325, 1.05, 18, 1, false, 0, Math.PI), wood, 0, 0.5);
    lid.rotation.set(0, 0, Math.PI / 2);
    group.add(lid);
    [-0.38, 0.38].forEach((x) => group.add(mesh(new BoxGeometry(0.08, 0.53, 0.67), brass, x, 0.26)));
    group.add(mesh(new BoxGeometry(0.15, 0.17, 0.03), brass, 0, 0.5, 0.33));
    return { group, top: 0.9 };
  },
  lectern: () => {
    const group = new Group();
    const wood = plain("#4e2f19", 0.5);
    group.add(mesh(new CylinderGeometry(0.34, 0.42, 0.08, 16), wood, 0, 0.04));
    group.add(mesh(lathe([[0.1, 0.08], [0.06, 0.5], [0.1, 0.85], [0.07, 1.05]]), wood));
    const board = mesh(new BoxGeometry(0.72, 0.05, 0.52), wood, 0, 1.12);
    board.rotation.x = 0.42;
    group.add(board);
    const page = mesh(new BoxGeometry(0.62, 0.05, 0.44), plain("#efe6d0", 0.85), 0, 1.16, 0.02);
    page.rotation.x = 0.42;
    group.add(page);
    return { group, top: 1.3 };
  },
  crystal: () => {
    const group = new Group();
    group.add(mesh(new CylinderGeometry(0.42, 0.55, 0.3, 7), plain("#3d3a48", 0.65), 0, 0.15));
    const gem = mesh(new OctahedronGeometry(0.42), plain("#a578ff", 0.08, 0.2, "#6c3cff", 1.1) as MeshStandardMaterial, 0, 1.05);
    gem.scale.y = 1.5;
    group.add(gem);
    return { group, top: 1.8, spin: gem };
  },
  urn: () => {
    const group = new Group();
    group.add(mesh(lathe([[0, 0], [0.3, 0], [0.32, 0.08], [0.17, 0.2], [0.42, 0.62], [0.42, 0.85], [0.22, 1.16], [0.31, 1.3], [0.27, 1.3], [0.16, 1.18], [0, 1.15]]), plain("#315f7e", 0.2, 0.15)));
    const band = mesh(new TorusGeometry(0.425, 0.022, 8, 40), plain("#d0a94f", 0.3, 0.9), 0, 0.72);
    band.rotation.x = Math.PI / 2;
    group.add(band);
    return { group, top: 1.35 };
  },
  throne: () => {
    const group = new Group();
    const gold = plain("#c7a14f", 0.28, 0.9);
    const velvet = plain("#7a1e2c", 0.85);
    group.add(mesh(new BoxGeometry(1, 0.2, 1), plain("#57524a", 0.6), 0, 0.1));
    group.add(mesh(new BoxGeometry(0.76, 0.55, 0.7), gold, 0, 0.47));
    group.add(mesh(new BoxGeometry(0.68, 0.12, 0.62), velvet, 0, 0.8));
    group.add(mesh(new BoxGeometry(0.76, 1.7, 0.12), gold, 0, 1.45, -0.32));
    group.add(mesh(new BoxGeometry(0.58, 1.3, 0.04), velvet, 0, 1.4, -0.25));
    [-0.38, 0.38].forEach((x) => group.add(mesh(new BoxGeometry(0.1, 0.42, 0.62), gold, x, 0.98), mesh(new SphereGeometry(0.09, 12, 10), gold, x, 2.32, -0.32)));
    return { group, top: 2.45 };
  },
  globe: () => {
    const group = new Group();
    const brass = plain("#b08d3f", 0.3, 0.9);
    group.add(mesh(lathe([[0, 0], [0.34, 0], [0.34, 0.05], [0.09, 0.14], [0.06, 0.65], [0, 0.65]]), brass));
    const world = mesh(new IcosahedronGeometry(0.42, 3), plain("#2f6f8f", 0.45), 0, 1.05);
    group.add(world);
    const ring = mesh(new TorusGeometry(0.5, 0.022, 8, 48), brass, 0, 1.05);
    ring.rotation.y = Math.PI / 2;
    group.add(ring);
    return { group, top: 1.6, spin: world };
  },
};

export function buildObjectModel(kind: Palace3DObjectKind): ObjectModel {
  return BUILDERS[kind]();
}

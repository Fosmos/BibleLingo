import { PerspectiveCamera } from "three";
import { EYE_HEIGHT, type Point } from "@/lib/palaceTab/palace3d/layout";

const WALK_SPEED = 3.1;
const LOOK_SPEED = 0.0042;
const PITCH_LIMIT = 1.25;

// You, in first person: drag to look, and walking along a route of points with a slight step in it,
// turning toward where you're headed — or at what you walked up to.
export class CameraRig {
  readonly camera = new PerspectiveCamera(68, 1, 0.05, 900);
  private yaw = 0;
  private pitch = 0;
  private route: Point[] = [];
  private faceAtEnd: Point | null = null;
  private stride = 0;
  private motionless: boolean;

  constructor(start: Point, motionless: boolean) {
    this.motionless = motionless;
    this.camera.rotation.order = "YXZ";
    this.camera.position.set(start.x, EYE_HEIGHT, start.z);
  }

  // A wider lens on a tall phone screen, so a room still fits across it.
  setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 1 ? 82 : 68;
    this.camera.updateProjectionMatrix();
  }

  look(dx: number, dy: number) {
    this.faceAtEnd = null;
    this.yaw += dx * LOOK_SPEED;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch + dy * LOOK_SPEED));
  }

  walk(route: Point[], faceAtEnd: Point | null) {
    this.route = route;
    this.faceAtEnd = faceAtEnd;
  }

  get walking(): boolean {
    return this.route.length > 0;
  }

  get position(): Point {
    return { x: this.camera.position.x, z: this.camera.position.z };
  }

  // A point this far ahead of you on the floor.
  ahead(distance: number): Point {
    return { x: this.camera.position.x - Math.sin(this.yaw) * distance, z: this.camera.position.z - Math.cos(this.yaw) * distance };
  }

  private turnToward(point: Point, delta: number) {
    const wanted = Math.atan2(this.camera.position.x - point.x, this.camera.position.z - point.z);
    let difference = wanted - this.yaw;
    while (difference > Math.PI) difference -= Math.PI * 2;
    while (difference < -Math.PI) difference += Math.PI * 2;
    this.yaw += difference * Math.min(1, delta * 4.5);
    this.pitch += (-0.06 - this.pitch) * Math.min(1, delta * 2);
  }

  tick(delta: number) {
    const next = this.route[0];
    if (next) {
      const [dx, dz] = [next.x - this.camera.position.x, next.z - this.camera.position.z];
      const distance = Math.hypot(dx, dz);
      const step = WALK_SPEED * delta;
      if (distance <= step) {
        this.camera.position.x = next.x;
        this.camera.position.z = next.z;
        this.route.shift();
      } else {
        this.camera.position.x += (dx / distance) * step;
        this.camera.position.z += (dz / distance) * step;
        this.stride += step * 3.4;
      }
      this.turnToward(this.route.length || !this.faceAtEnd ? next : this.faceAtEnd, delta);
    } else if (this.faceAtEnd) {
      this.turnToward(this.faceAtEnd, delta);
    }
    const bob = this.motionless || !next ? 0 : Math.sin(this.stride) * 0.028;
    this.camera.position.y = EYE_HEIGHT + bob;
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}

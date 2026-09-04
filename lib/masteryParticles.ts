// Framework-agnostic particle simulation for Mastery Mode's canvas scene — pure spawn/step
// functions with no canvas or DOM access, mirroring lib/masteryPhysics.ts's pattern.
// MasteryTrack.tsx owns the actual drawing and keeps the live particle list in a ref (not
// React state), since nothing outside the canvas needs to react to individual particles.
export interface MasteryParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: "foam" | "dust";
}

const GRAVITY = 60;
const DRAG = 0.94;
const MAX_PARTICLES = 200;

export function spawnParticles(x: number, y: number, count: number, hue: MasteryParticle["hue"]): MasteryParticle[] {
  const particles: MasteryParticle[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 35 + Math.random() * 65;
    const maxLife = 0.3 + Math.random() * 0.35;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: maxLife,
      maxLife,
      size: hue === "foam" ? 1.6 + Math.random() * 2.2 : 1.3 + Math.random() * 1.8,
      hue,
    });
  }
  return particles;
}

// A footstep "lands" every half stride cycle (stridePhase wrapping mod PI) — spawning a
// burst here, rather than on a random per-frame chance, ties the splash/dust directly to the
// running motion instead of an arbitrary timer.
export function footstepParticles(
  stridePhase: number,
  prevWrappedPhase: number,
  x: number,
  y: number,
  isFast: boolean,
): { particles: MasteryParticle[]; wrappedPhase: number } {
  const wrappedPhase = stridePhase % Math.PI;
  if (wrappedPhase >= prevWrappedPhase) return { particles: [], wrappedPhase };
  const hue: MasteryParticle["hue"] = isFast ? "foam" : "dust";
  return { particles: spawnParticles(x, y, hue === "foam" ? 8 : 4, hue), wrappedPhase };
}

export function stepParticles(particles: MasteryParticle[], dtSeconds: number): MasteryParticle[] {
  const next: MasteryParticle[] = [];
  for (const particle of particles) {
    const life = particle.life - dtSeconds;
    if (life <= 0) continue;
    const vx = particle.vx * DRAG;
    const vy = (particle.vy + GRAVITY * dtSeconds) * DRAG;
    next.push({ ...particle, x: particle.x + vx * dtSeconds, y: particle.y + vy * dtSeconds, vx, vy, life });
  }
  return next.length > MAX_PARTICLES ? next.slice(next.length - MAX_PARTICLES) : next;
}

// Throttled position-history sampler used for the chariot's motion-blur ghost trail — pure,
// so MasteryTrack.tsx's frame loop can call it without owning the sampling-interval logic.
export interface TrailPoint {
  x: number;
  y: number;
}

export function sampleTrail(
  trail: TrailPoint[],
  ts: number,
  lastSampleTs: number,
  sampleEveryMs: number,
  maxLength: number,
  point: TrailPoint,
): { trail: TrailPoint[]; lastSampleTs: number } {
  if (ts - lastSampleTs <= sampleEveryMs) return { trail, lastSampleTs };
  return { trail: [...trail, point].slice(-maxLength), lastSampleTs: ts };
}

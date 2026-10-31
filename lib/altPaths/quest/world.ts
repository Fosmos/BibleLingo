import type { MemorizedEntity } from "@/types";
import { boxDisplayNumber } from "@/lib/srs";
import type { TrailSection, TrailStop } from "@/lib/trailStops";
import { QUEST_BIOMES, type QuestBiome } from "@/lib/altPaths/quest/biomes";

export type QuestNodeKind = "verse" | "boss";

export interface QuestNode {
  key: string;
  kind: QuestNodeKind;
  stop: TrailStop;
  number?: number;
  stars: number;
  cracked: boolean;
  // The percent across the land, and pixels down it.
  x: number;
  y: number;
}

export interface QuestDecor {
  x: number;
  y: number;
  size: number;
}

export interface QuestLand {
  id: string;
  title: string;
  ref: string;
  biome: QuestBiome;
  previousGround: string;
  state: "cleared" | "current" | "fogged";
  nodes: QuestNode[];
  decor: QuestDecor[];
  height: number;
  entryX: number;
  exitX: number;
}

export interface QuestWorld {
  lands: QuestLand[];
  heroKey: string | null;
}

const BAND = 250;
const STEP = 118;
const TAIL = 60;

// The road's swing across the land, by how far along the whole journey it is.
const swing = (at: number) => 50 + 26 * Math.sin(at * 0.85) + 6 * Math.sin(at * 0.37 + 1);
// The same scenery every visit: a repeatable random number from a seed.
const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

// A verse's stars come from spaced review, read fresh each time: one for learning it, two once a
// review has moved it up a box, three once it's held to box 4.
export function starsOf(stop: TrailStop, entities: MemorizedEntity[]): number {
  if (stop.state !== "done") return 0;
  const verse = stop.verse;
  if (!verse) return 3;
  const box = entities.find((entity) => entity.book === verse.book && entity.chapter === verse.chapter && entity.startVerse <= verse.verseNumber && entity.endVerse >= verse.verseNumber)?.srs.box ?? 1;
  const rung = boxDisplayNumber(box);
  return rung >= 4 ? 3 : rung >= 2 ? 2 : 1;
}

// A lesson section with the review sections after it.
export function groupBySection(sections: TrailSection[]): TrailSection[][] {
  const groups: TrailSection[][] = [];
  for (const section of sections) {
    if (section.review && groups.length) groups[groups.length - 1].push(section);
    else groups.push([section]);
  }
  return groups;
}

// The path's sections as lands to cross. Each lesson section starts a land and its reviews are the
// bosses at the far end. Only the first stop that's up next is open, so the journey runs in order.
export function buildQuestWorld(sections: TrailSection[], entities: MemorizedEntity[]): QuestWorld {
  const groups = groupBySection(sections);
  let along = 0;
  let heroKey: string | null = null;
  const lands = groups.map((group, index): QuestLand => {
    const biome = QUEST_BIOMES[index % QUEST_BIOMES.length];
    const stops = group.flatMap((section) => section.stops);
    const entryX = swing(along - 0.5);
    const nodes: QuestNode[] = stops.map((source, at) => {
      const first = source.state === "current" && heroKey === null;
      const stop = source.state === "current" && !first ? { ...source, state: "locked" as const } : source;
      if (first) heroKey = stop.key;
      const boss = !stop.verse && !stop.key.startsWith("stage-");
      return { key: stop.key, kind: boss ? "boss" : "verse", stop, number: stop.verse?.verseNumber ?? (boss ? undefined : at + 1), stars: starsOf(stop, entities), cracked: stop.dueIds.length > 0, x: swing(along++), y: BAND + at * STEP };
    });
    const allDone = stops.every((stop) => stop.state === "done");
    const id = stops[0]?.key ?? `land-${index}`;
    const height = BAND + Math.max(stops.length - 1, 0) * STEP + TAIL + 50;
    // Scenery at the edges only, beside every other stop, on the side the road has swung away from.
    const decor = nodes.flatMap((node, at) => {
      if (at % 2) return [];
      const seed = index * 100 + at;
      return [{ x: node.x > 50 ? 8 + seeded(seed) * 8 : 84 + seeded(seed) * 8, y: node.y + (seeded(seed + 0.2) - 0.5) * 30, size: 34 + seeded(seed + 0.3) * 12 }];
    });
    return {
      id,
      title: group[0].title,
      ref: group[0].ref,
      biome,
      previousGround: QUEST_BIOMES[(index + QUEST_BIOMES.length - 1) % QUEST_BIOMES.length].groundLow,
      state: allDone ? "cleared" : stops.some((stop) => stop.state !== "locked") ? "current" : "fogged",
      nodes,
      decor,
      height,
      entryX,
      exitX: swing(along - 0.5),
    };
  });
  return { lands, heroKey };
}

// A winding road through points, in the land's own space (x in percent, y in pixels).
export function roadPath(points: { x: number; y: number }[]): string {
  return points.reduce((path, point, at) => {
    if (at === 0) return `M${point.x} ${point.y}`;
    const before = points[at - 1];
    const middle = (before.y + point.y) / 2;
    return `${path} C${before.x} ${middle} ${point.x} ${middle} ${point.x} ${point.y}`;
  }, "");
}

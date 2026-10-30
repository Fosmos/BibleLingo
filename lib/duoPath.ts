import type { MemorizedEntity } from "@/types";
import { groupBySection, starsOf } from "@/lib/quest/world";
import type { TrailSection, TrailStop } from "@/lib/trailStops";

export interface DuoNode {
  stop: TrailStop;
  boss: boolean;
  number?: number;
  stars: number;
  due: boolean;
  isNext: boolean;
}

export interface DuoUnit {
  id: string;
  index: number;
  title: string;
  ref: string;
  nodes: DuoNode[];
  done: number;
  chest: "locked" | "ready" | "open";
}

// The path's sections as units: a node per verse, its reviews as bosses, then a chest. Only the first
// stop that's up next is open, so the path runs in order.
export function buildDuoPath(sections: TrailSection[], entities: MemorizedEntity[], chests: string[] = []): DuoUnit[] {
  let found = false;
  return groupBySection(sections).map((group, index) => {
    const nodes = group.flatMap((section) => section.stops).map((source, at): DuoNode => {
      const isNext = source.state === "current" && !found;
      if (isNext) found = true;
      const stop = source.state === "current" && !isNext ? { ...source, state: "locked" as const } : source;
      const boss = !stop.verse && !stop.key.startsWith("stage-");
      return { stop, boss, number: stop.verse?.verseNumber ?? (boss ? undefined : at + 1), stars: starsOf(stop, entities), due: stop.dueIds.length > 0, isNext };
    });
    const id = nodes[0]?.stop.key ?? `unit-${index}`;
    const done = nodes.filter((node) => node.stop.state === "done").length;
    return { id, index, title: group[0].title, ref: group[0].ref, nodes, done, chest: chests.includes(id) ? "open" : done === nodes.length ? "ready" : "locked" };
  });
}

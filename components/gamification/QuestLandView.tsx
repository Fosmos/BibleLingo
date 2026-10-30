"use client";

import { useMemo, type CSSProperties } from "react";
import { roadPath, type QuestLand, type QuestNode } from "@/lib/quest/world";
import { QuestDecorSprite, QuestHorizon } from "@/components/gamification/QuestScenery";
import { QuestHero } from "@/components/gamification/QuestHero";
import { QuestStone } from "@/components/gamification/QuestStone";

interface QuestLandViewProps {
  land: QuestLand;
  index: number;
  heroKey: string | null;
  // Back from a lesson: the pilgrim walks on from the stop before.
  walked: boolean;
  onTapNode: (node: QuestNode, land: QuestLand) => void;
}

const place = (x: number, y: number, size?: number) => ({ "--x": `${x}%`, "--y": `${y}px`, "--size": size ? `${size}px` : undefined }) as CSSProperties;
const AT = "absolute left-[var(--x)] top-[var(--y)] -translate-x-1/2 -translate-y-1/2";

// One land of the Quest map: its horizon, then the road winding down through its scenery. A land you
// haven't reached yet lies under fog.
export function QuestLandView({ land, index, heroKey, walked, onTapNode }: QuestLandViewProps) {
  const { biome, nodes, height } = land;
  const heroAt = nodes.findIndex((node) => node.key === heroKey);
  const points = useMemo(() => [{ x: land.entryX, y: 200 }, ...nodes.map(({ x, y }) => ({ x, y })), { x: land.exitX, y: height }], [land.entryX, land.exitX, nodes, height]);
  // The road you've walked shines: up to the pilgrim here, or all of it in a cleared land.
  const walkedPoints = land.state === "cleared" ? points : heroAt >= 0 ? points.slice(0, heroAt + 2) : [];
  const vars = {
    "--sky-top": biome.skyTop,
    "--sky-low": biome.skyLow,
    "--ground": biome.ground,
    "--ground-low": biome.groundLow,
    "--road": biome.road,
    "--land-h": `${height}px`,
  } as CSSProperties;

  return (
    <section data-biome={index} style={vars} className="relative h-[var(--land-h)] overflow-hidden bg-gradient-to-b from-[var(--ground)] to-[var(--ground-low)] [contain-intrinsic-size:auto_var(--land-h)] [content-visibility:auto]">
      <QuestHorizon biome={biome} seed={index} previousGround={land.previousGround} />
      {land.decor.map((item, at) => (
        <div key={at} style={place(item.x, item.y, item.size)} className={`${AT} h-[var(--size)] w-[var(--size)]`}>
          <QuestDecorSprite kind={biome.decor} />
        </div>
      ))}
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <path d={roadPath(points)} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="30" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d={roadPath(points)} fill="none" stroke={biome.road} strokeWidth="24" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {walkedPoints.length > 1 && <path d={roadPath(walkedPoints)} fill="none" stroke="#F5B83D" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 14" vectorEffect="non-scaling-stroke" />}
      </svg>
      <header className="absolute inset-x-5 top-14 z-10 mx-auto flex max-w-sm flex-col items-center gap-1 rounded-[22px] bg-black/45 px-4 py-3 text-center text-white shadow-organic-md">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/75">{land.ref}</span>
        <h2 className="font-heading text-[22px] leading-tight">{land.title}</h2>
      </header>
      {nodes.map((node) => {
        const isHero = node.key === heroKey;
        return (
          <div key={node.key} style={place(node.x, node.y)} className={`${AT} z-10`}>
            <QuestStone node={node} isHero={isHero} onTap={() => onTapNode(node, land)} />
          </div>
        );
      })}
      {heroAt >= 0 && <QuestHero x={nodes[heroAt].x} y={nodes[heroAt].y} from={walked && heroAt > 0 ? nodes[heroAt - 1] : undefined} />}
      {land.state === "fogged" && <div className="pointer-events-none absolute inset-0 z-[15] bg-gradient-to-b from-slate-200/55 via-slate-500/55 to-slate-600/60" />}
    </section>
  );
}

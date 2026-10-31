"use client";

import type { CSSProperties } from "react";
import type { DuoUnit } from "@/lib/altPaths/duoPath";
import type { TrailStop } from "@/lib/trailStops";
import { DuoMascot } from "@/components/gamification/altPaths/DuoMascot";
import { DuoChest, DuoPathNode, UNIT_COLOURS } from "@/components/gamification/altPaths/DuoPathNode";

interface DuoPathUnitProps {
  unit: DuoUnit;
  onTapStop: (stop: TrailStop) => void;
  onTapChest: () => void;
}

// How far each node sits from the middle, in pixels: the zigzag.
const ZIGZAG = [0, 46, 72, 46, 0, -46, -72, -46];

// A unit: its banner, pinned while you're in it, then the zigzag of nodes ending in a chest.
export function DuoPathUnit({ unit, onTapStop, onTapChest }: DuoPathUnitProps) {
  const colour = UNIT_COLOURS[unit.index % UNIT_COLOURS.length];
  const shift = (at: number) => ZIGZAG[at % ZIGZAG.length];
  const place = (at: number) => ({ "--dx": `${shift(at)}px` }) as CSSProperties;
  return (
    <section className="flex flex-col items-center gap-7 pb-10">
      <header className={`sticky top-0 z-20 flex w-full flex-col rounded-[18px] px-4 py-2.5 text-white ${colour.banner}`}>
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/85">
          Unit {unit.index + 1} · {unit.ref}
        </span>
        <h2 className="font-heading text-[19px] leading-tight">{unit.title}</h2>
      </header>
      {unit.nodes.map((node, at) => (
        <div key={node.stop.key} data-next={node.isNext || undefined} style={place(at)} className={`relative translate-x-[var(--dx)] ${node.isNext ? "mt-7" : ""}`}>
          {node.isNext && (
            <div className={`absolute top-1 ${shift(at) > 0 ? "right-[calc(100%+14px)]" : "left-[calc(100%+14px)]"}`}>
              <DuoMascot />
            </div>
          )}
          <DuoPathNode node={node} colour={colour} progress={unit.done / unit.nodes.length} onTap={() => onTapStop(node.stop)} />
        </div>
      ))}
      <div style={place(unit.nodes.length)} className="translate-x-[var(--dx)]">
        <DuoChest chest={unit.chest} onTap={onTapChest} />
      </div>
    </section>
  );
}

"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import type { BookMovement } from "@/lib/bookMovements";

interface BibleChapterWheelProps {
  movements: BookMovement[];
  // The path's chapter in this book (0 if the path isn't here) — larger, filled, and every chapter
  // before it shaded as walked.
  pathChapter: number;
  themeOf: (chapter: number) => string;
  onOpen: (chapter: number, event: MouseEvent<HTMLElement>) => void;
}

const SIZE = 338;
const C = SIZE / 2;
const RING_R = 138;
const WEDGE_FILLS = ["fill-brand-200", "fill-brand-100", "fill-sage-200", "fill-brand-300", "fill-sage-100"];
const WEDGE_INKS = ["text-brand-800", "text-brand-800", "text-sage-800", "text-brand-900", "text-sage-800"];

const point = (angle: number, radius: number) => [C + Math.cos(angle) * radius, C + Math.sin(angle) * radius];

function wedgePath(a: number, b: number, inner: number, outer: number): string {
  const [x1, y1] = point(a, outer), [x2, y2] = point(b, outer), [x3, y3] = point(b, inner), [x4, y4] = point(a, inner);
  const large = b - a > Math.PI ? 1 : 0;
  return `M${x1},${y1}A${outer},${outer} 0 ${large} 1 ${x2},${y2}L${x3},${y3}A${inner},${inner} 0 ${large} 0 ${x4},${y4}Z`;
}

// The Path tab's level 2 for an outlined book of up to 30 chapters: its chapters round a ring,
// grouped into movement wedges with a gap between each. Tapping a wedge picks that movement (its
// chapter in the hub); tapping a chapter goes straight to its chapter path view.
export function BibleChapterWheel({ movements, pathChapter, themeOf, onOpen }: BibleChapterWheelProps) {
  const [selected, setSelected] = useState(Math.max(0, movements.findIndex((movement) => movement.chapters.includes(pathChapter))));
  const total = movements.reduce((sum, movement) => sum + movement.chapters.length, 0);
  const step = (2 * Math.PI) / (total + movements.length);
  const start = -Math.PI / 2 + step / 2;
  const angles = new Map<number, number>();
  const spans: [number, number][] = [];
  let slot = 0;
  for (const movement of movements) {
    const first = slot;
    for (const chapter of movement.chapters) angles.set(chapter, start + slot++ * step);
    spans.push([start + (first - 0.5) * step, start + (slot - 0.5) * step]);
    slot++;
  }
  const hubChapter = pathChapter || movements[selected].chapters[0];

  return (
    <div className="relative mx-auto h-[338px] w-[338px]">
      <svg width={SIZE} height={SIZE} className="absolute inset-0" aria-hidden="true">
        {spans.map(([a, b], index) => (
          <path
            key={index}
            d={wedgePath(a + 0.02, b - 0.02, 62, 168)}
            onClick={() => setSelected(index)}
            className={`cursor-pointer transition-opacity ${WEDGE_FILLS[index % WEDGE_FILLS.length]} ${index === selected ? "opacity-100" : "opacity-[.55]"}`}
          />
        ))}
      </svg>
      {spans.map(([a, b], index) => {
        const [x, y] = point((a + b) / 2, 96);
        return (
          <span
            key={index}
            style={{ "--x": `${x}px`, "--y": `${y}px` } as CSSProperties}
            className={`pointer-events-none absolute left-[var(--x)] top-[var(--y)] line-clamp-2 w-[84px] -translate-x-1/2 -translate-y-1/2 text-center text-[11px] font-extrabold leading-tight ${WEDGE_INKS[index % WEDGE_INKS.length]}`}
          >
            {movements[index].title}
          </span>
        );
      })}
      <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-[120px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center text-ink dark:text-zinc-100">
        <span className="font-heading text-[28px] leading-none">{hubChapter}</span>
        <span className="line-clamp-3 text-xs">{themeOf(hubChapter)}</span>
      </div>
      {[...angles.entries()].map(([chapter, angle]) => {
        const [x, y] = point(angle, RING_R);
        const onPath = chapter === pathChapter;
        const walked = pathChapter > 0 && chapter < pathChapter;
        const inSelected = movements[selected].chapters.includes(chapter);
        return (
          <button
            key={chapter}
            type="button"
            aria-label={`Chapter ${chapter}`}
            onClick={(event) => onOpen(chapter, event)}
            style={{ "--x": `${x}px`, "--y": `${y}px` } as CSSProperties}
            className={`absolute left-[var(--x)] top-[var(--y)] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-heading shadow-organic-sm ${
              onPath ? "h-10 w-10 bg-sage-600 text-base text-white" : `h-8 w-8 text-[13px] text-ink ${walked ? "bg-sage-300" : "border-2 border-sand-300 bg-paper"}`
            } ${inSelected ? "" : "opacity-60"}`}
          >
            {chapter}
          </button>
        );
      })}
    </div>
  );
}

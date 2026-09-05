"use client";

import { BOOK_CIRCLE_RADIUS } from "@/lib/mindMapLayout";
import { wrapLabel } from "@/lib/mindMapShape";
import { fullBookTitle } from "@/lib/bibleBookTitles";

interface MindMapBookNodeProps {
  bookLabel: string;
}

const LINE_HEIGHT = 17;
const MAX_CHARS_PER_LINE = 13;

// The book itself, sitting at the mind map's own center (always world origin — see
// lib/mindMapShape.ts) — a circle, unlike every other node's pill, sized to comfortably hold
// its full ceremonial title (see lib/bibleBookTitles.ts) wrapped across a few centered
// lines, with a soft halo behind it for the same "this is the one thing everything else
// grows from" emphasis a mind map's own central topic always gets.
export function MindMapBookNode({ bookLabel }: MindMapBookNodeProps) {
  const lines = wrapLabel(fullBookTitle(bookLabel), MAX_CHARS_PER_LINE);
  const firstLineDy = -((lines.length - 1) / 2) * LINE_HEIGHT;

  return (
    <g>
      <circle r={BOOK_CIRCLE_RADIUS + 10} className="fill-brand-500/25" />
      <circle r={BOOK_CIRCLE_RADIUS} filter="url(#mm-pill-shadow)" className="fill-brand-600 stroke-brand-700 stroke-2" />
      <text textAnchor="middle" className="select-none fill-white font-serif text-base font-semibold">
        {lines.map((line, index) => (
          <tspan key={index} x={0} dy={index === 0 ? firstLineDy : LINE_HEIGHT}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

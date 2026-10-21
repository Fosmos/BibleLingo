"use client";

import { useState } from "react";
import type { SrsReviewResult } from "@/types";

interface ReviewAccuracyChartProps {
  history: SrsReviewResult[];
  // The pass mark a review needs to move the passage up a box (UserProgress.srsPromotionThreshold).
  threshold: number;
}

const W = 320;
const H = 140;
const PAD = { left: 30, right: 34, top: 14, bottom: 22 };
const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;
const y = (accuracy: number) => PAD.top + plotH * (1 - accuracy / 100);
const dateLabel = (at: string) => new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });

// A passage's review accuracy over its past reviews (PassageStatsScreen.tsx): one terracotta line,
// oldest at the left, a faint 0/50/100 grid, its pass mark dashed, the latest result labelled, and
// any point tapped (or hovered) shows its date and score. One series, so no legend — the
// heading names it; the points' values are in each one's label for screen readers.
export function ReviewAccuracyChart({ history, threshold }: ReviewAccuracyChartProps) {
  const [picked, setPicked] = useState<number | null>(null);
  if (!history.length) return <p className="rounded-2xl bg-sand-200/60 px-4 py-6 text-center text-sm font-semibold text-ink-muted dark:bg-zinc-800">No reviews yet — your scores show here after each one.</p>;
  const x = (index: number) => PAD.left + (history.length === 1 ? plotW / 2 : (plotW * index) / (history.length - 1));
  const points = history.map((result, index) => ({ ...result, cx: x(index), cy: y(result.accuracy) }));
  const last = points[points.length - 1];
  const shown = picked !== null ? points[picked] : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-manipulation select-none" role="img" aria-label={`Review accuracy over ${history.length} reviews, latest ${last.accuracy}%`}>
      {[0, 50, 100].map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-sand-300 dark:stroke-zinc-700" strokeWidth={1} />
          <text x={PAD.left - 6} y={y(tick)} textAnchor="end" dominantBaseline="middle" className="fill-ink-muted text-[10px] font-semibold dark:fill-zinc-500">
            {tick}
          </text>
        </g>
      ))}
      <line x1={PAD.left} x2={W - PAD.right} y1={y(threshold)} y2={y(threshold)} className="stroke-sage-600 dark:stroke-sage-400" strokeWidth={1.5} strokeDasharray="4 4" />
      <text x={W - PAD.right + 4} y={y(threshold)} dominantBaseline="middle" className="fill-sage-800 text-[9.5px] font-bold dark:fill-sage-300">
        Pass
      </text>
      {points.length > 1 && <polyline points={points.map((point) => `${point.cx},${point.cy}`).join(" ")} fill="none" className="stroke-brand-500" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((point, index) => (
        <g key={point.at + index} onPointerEnter={() => setPicked(index)} onPointerLeave={() => setPicked(null)} onClick={() => setPicked(picked === index ? null : index)} className="cursor-pointer">
          <title>{`${dateLabel(point.at)}: ${point.accuracy}%`}</title>
          <circle cx={point.cx} cy={point.cy} r={12} fill="transparent" />
          <circle cx={point.cx} cy={point.cy} r={4} className={`stroke-parchment dark:stroke-zinc-900 ${picked === index ? "fill-brand-700" : "fill-brand-500"}`} strokeWidth={2} />
        </g>
      ))}
      {!shown && (
        <text x={last.cx + 7} y={last.cy - 8} className="fill-ink text-[11px] font-black dark:fill-zinc-100">
          {last.accuracy}%
        </text>
      )}
      {shown && (
        <text x={Math.min(Math.max(shown.cx, PAD.left + 30), W - PAD.right - 30)} y={Math.max(shown.cy - 10, 10)} textAnchor="middle" className="fill-ink text-[11px] font-black dark:fill-zinc-100">
          {dateLabel(shown.at)} · {shown.accuracy}%
        </text>
      )}
      <text x={PAD.left} y={H - 6} className="fill-ink-muted text-[9.5px] font-semibold dark:fill-zinc-500">
        {dateLabel(points[0].at)}
      </text>
      {points.length > 1 && (
        <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-ink-muted text-[9.5px] font-semibold dark:fill-zinc-500">
          {dateLabel(last.at)}
        </text>
      )}
    </svg>
  );
}

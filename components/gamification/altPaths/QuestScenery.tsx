"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { QuestBiome, QuestDecorKind, QuestRidge } from "@/lib/altPaths/quest/biomes";

// One line of a land's skyline, as a filled shape down to the bottom of the 400×250 scene.
function ridgePath(ridge: QuestRidge, seed: number, base: number, height: number): string {
  const points: string[] = [];
  for (let x = 0; x <= 400; x += ridge === "peaks" ? 25 : 10) {
    const a = Math.sin(x * 0.018 + seed);
    const b = Math.sin(x * 0.047 + seed * 2.3);
    const shape = ridge === "peaks" ? (x / 25) % 2 === 0 ? -height * (0.55 + 0.45 * Math.abs(a)) : height * 0.25 * b : ridge === "waves" ? height * 0.14 * Math.sin(x * 0.09 + seed) : height * (0.6 * a + 0.3 * b);
    points.push(`${x} ${(base + shape).toFixed(1)}`);
  }
  return `M0 250 L${points.join(" L")} L400 250 Z`;
}

interface QuestHorizonProps {
  biome: QuestBiome;
  seed: number;
  previousGround: string;
}

// The view opening a land: its sky and sun with three skylines that slide at their own speeds as you scroll.
export function QuestHorizon({ biome, seed, previousGround }: QuestHorizonProps) {
  const band = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: band, offset: ["start end", "end start"] });
  const sunY = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [-30, 50]);
  const farY = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [-22, 22]);
  const midY = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [-10, 10]);
  const layer = "absolute inset-0 h-full w-full";
  return (
    <div ref={band} aria-hidden="true" className="absolute inset-x-0 top-0 h-[250px] overflow-hidden bg-gradient-to-b from-[var(--sky-top)] to-[var(--sky-low)]">
      <motion.svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMax slice" className={layer} style={{ y: sunY }}>
        <circle cx={90 + (seed * 73) % 220} cy="88" r="44" fill={biome.sun} opacity="0.25" />
        <circle cx={90 + (seed * 73) % 220} cy="88" r="27" fill={biome.sun} />
      </motion.svg>
      <motion.svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMax slice" className={layer} style={{ y: farY }}>
        <path d={ridgePath(biome.ridge, seed + 1, 150, 46)} fill={biome.far} />
      </motion.svg>
      <motion.svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMax slice" className={layer} style={{ y: midY }}>
        <path d={ridgePath(biome.ridge, seed + 2.7, 190, 34)} fill={biome.mid} />
      </motion.svg>
      <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMax slice" className={layer}>
        <path d={ridgePath(biome.ridge === "peaks" ? "hills" : biome.ridge, seed + 4.1, 226, 16)} fill={biome.ground} />
      </svg>
      {seed > 0 && (
        <svg viewBox="0 0 400 30" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[30px] w-full">
          <path d="M0 0 H400 V12 C340 30 290 4 220 16 C150 28 90 6 0 20 Z" fill={previousGround} />
        </svg>
      )}
    </div>
  );
}

const SPRITES: Record<QuestDecorKind, React.ReactNode> = {
  tree: (
    <>
      <rect x="21" y="30" width="6" height="16" rx="2" fill="#6b4a2c" />
      <circle cx="24" cy="20" r="15" fill="#3f7f3c" />
      <circle cx="18" cy="16" r="6" fill="#57994f" />
    </>
  ),
  palm: (
    <>
      <path d="M24 46 C25 34 23 24 26 15" stroke="#7a5630" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M26 15 C16 7 8 11 4 20 C13 15 20 16 26 15 C34 6 42 9 45 19 C38 15 31 15 26 15 C22 5 28 2 33 2 C29 6 28 10 26 15" fill="#4f8a3f" />
    </>
  ),
  pine: (
    <>
      <rect x="22" y="38" width="4" height="8" fill="#4d3a29" />
      <path d="M24 3 L37 24 H30 L40 40 H8 L18 24 H11 Z" fill="#2c5249" />
      <path d="M24 3 L30 13 H18 Z" fill="#eef4f8" />
    </>
  ),
  island: (
    <>
      <ellipse cx="24" cy="39" rx="21" ry="6" fill="#e6d29b" />
      <path d="M23 38 C24 30 22 24 25 18" stroke="#7a5630" strokeWidth="3" fill="none" />
      <path d="M25 18 C17 12 11 15 9 22 C16 18 20 19 25 18 C32 11 38 14 40 21 C34 18 30 18 25 18" fill="#3f8a55" />
      <path d="M5 45 q5 -3 10 0 M30 46 q5 -3 10 0" stroke="#d3ecf2" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  ),
  cedar: (
    <>
      <rect x="21" y="26" width="6" height="20" fill="#3d2b1c" />
      <path d="M24 2 C34 8 44 14 46 21 C38 20 34 19 30 19 C38 24 42 28 43 33 C33 31 15 31 5 33 C6 28 10 24 18 19 C14 19 10 20 2 21 C4 14 14 8 24 2" fill="#173f2e" />
    </>
  ),
  vine: (
    <>
      <path d="M8 46 V12 M40 46 V12 M4 16 H44" stroke="#6b4a2c" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 16 C16 26 32 26 40 16" stroke="#4f7f3f" strokeWidth="3" fill="none" />
      <g fill="#4a2159">
        <circle cx="18" cy="27" r="3" />
        <circle cx="24" cy="27" r="3" />
        <circle cx="30" cy="27" r="3" />
        <circle cx="21" cy="32" r="3" />
        <circle cx="27" cy="32" r="3" />
        <circle cx="24" cy="37" r="3" />
      </g>
    </>
  ),
  star: (
    <>
      <path d="M24 46 L18 28 L30 28 Z" fill="#141a3d" />
      <path d="M24 4 L27 13 L36 13 L29 19 L32 28 L24 22 L16 28 L19 19 L12 13 L21 13 Z" fill="#f3e9a9" />
    </>
  ),
  column: (
    <>
      <rect x="14" y="40" width="20" height="6" rx="1" fill="#f3e2b0" />
      <rect x="18" y="10" width="12" height="30" fill="#fbeec7" />
      <path d="M21 10 V40 M27 10 V40" stroke="#d9bb78" strokeWidth="1.4" />
      <rect x="13" y="4" width="22" height="6" rx="1" fill="#f3e2b0" />
    </>
  ),
};

interface QuestDecorSpriteProps {
  kind: QuestDecorKind;
}

export function QuestDecorSprite({ kind }: QuestDecorSpriteProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-full w-full drop-shadow-[0_3px_2px_rgba(0,0,0,0.25)]">
      {SPRITES[kind]}
    </svg>
  );
}

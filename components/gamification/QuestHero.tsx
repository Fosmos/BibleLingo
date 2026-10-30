"use client";

import { motion, useReducedMotion } from "framer-motion";

interface QuestHeroProps {
  // Where they walk in from, back from a lesson; otherwise they're just there.
  from?: { x: number; y: number };
  x: number;
  y: number;
}

const HERO_LIFT = 62;

// The pilgrim, standing over the stop you're up to.
export function QuestHero({ from, x, y }: QuestHeroProps) {
  const still = useReducedMotion();
  const at = (point: { x: number; y: number }) => ({ left: `${point.x}%`, top: point.y - HERO_LIFT });
  return (
    <motion.div
      id="quest-hero"
      aria-hidden="true"
      initial={at(from && !still ? from : { x, y })}
      animate={at({ x, y })}
      transition={{ duration: 1.2, ease: "easeInOut", delay: 0.35 }}
      className="pointer-events-none absolute z-20 h-[58px] w-11 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="trail-bob h-full w-full drop-shadow-[0_5px_3px_rgba(0,0,0,0.35)]">
        <svg viewBox="0 0 44 58" className="h-full w-full">
          <path d="M36 8 V54" stroke="#6b4a2c" strokeWidth="3" strokeLinecap="round" />
          <path d="M36 8 C36 3 30 3 30 8" stroke="#6b4a2c" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M20 19 C10 22 8 40 7 54 H33 C32 40 30 22 20 19 Z" fill="#E0763A" />
          <path d="M20 19 C16 28 16 42 17 54 H23 C24 42 24 28 20 19 Z" fill="#F7E6C4" />
          <path d="M28 30 L36 28" stroke="#E0763A" strokeWidth="5" strokeLinecap="round" />
          <circle cx="20" cy="13" r="9" fill="#EFC6A0" />
          <path d="M10 15 C8 4 16 1 20 1 C25 1 32 4 30 15 C27 9 13 9 10 15 Z" fill="#8C491A" />
        </svg>
      </div>
    </motion.div>
  );
}

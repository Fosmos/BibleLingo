"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface ConfettiPiece {
  id: number;
  colorClass: string;
  xOffset: number;
  delay: number;
  duration: number;
  rotate: number;
}

const CONFETTI_COLOR_CLASSES = ["bg-brand-500", "bg-gold-500", "bg-mastery-500", "bg-heart-400", "bg-brand-300"];
const CONFETTI_COUNT = 24;

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, id) => ({
    id,
    colorClass: CONFETTI_COLOR_CLASSES[id % CONFETTI_COLOR_CLASSES.length],
    xOffset: (Math.random() - 0.5) * 320,
    delay: Math.random() * 0.3,
    duration: 1.1 + Math.random() * 0.7,
    rotate: Math.random() * 360 - 180,
  }));
}

export function Confetti() {
  // Generated once on mount — this only ever mounts client-side after a session finishes,
  // so there is no SSR pass to stay in sync with.
  const pieces = useMemo(() => generateConfetti(), []);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{ x: 0, y: -20, opacity: 1, rotate: 0 }}
          animate={{ x: piece.xOffset, y: 320, opacity: 0, rotate: piece.rotate }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: "easeIn" }}
          className={`absolute left-1/2 top-0 h-3 w-2 rounded-sm ${piece.colorClass}`}
        />
      ))}
    </div>
  );
}

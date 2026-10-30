"use client";

import type { CSSProperties } from "react";
import type { QuestWeather } from "@/lib/quest/biomes";

interface QuestAmbienceProps {
  weather: QuestWeather;
}

const COUNT = 7;
const LOOK: Record<QuestWeather, { motion: string; dot: string; seconds: number }> = {
  motes: { motion: "quest-rise", dot: "rounded-full bg-[#FFF6B0] shadow-[0_0_8px_#FFF6B0]", seconds: 14 },
  sand: { motion: "quest-drift", dot: "rounded-full bg-[#FFF3D6]/70", seconds: 8 },
  snow: { motion: "quest-fall", dot: "rounded-full bg-white/90", seconds: 11 },
  clouds: { motion: "quest-drift", dot: "h-8! w-28! rounded-full bg-white/25 blur-sm", seconds: 34 },
  embers: { motion: "quest-rise", dot: "rounded-full bg-[#FFD0A0] shadow-[0_0_8px_#FFB070]", seconds: 10 },
  stars: { motion: "quest-twinkle", dot: "rounded-full bg-white", seconds: 3 },
};

// The weather over the land you're looking at, drifting across the whole screen (app/globals.css).
export function QuestAmbience({ weather }: QuestAmbienceProps) {
  const look = LOOK[weather];
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {Array.from({ length: COUNT }, (_, at) => {
        const across = (at * 37) % 100;
        const down = (at * 61) % 100;
        const vars = { "--x": `${across}%`, "--y": `${down}%`, "--dur": `${look.seconds + (at % 5) * 1.3}s`, "--delay": `${-at * 1.7}s` } as CSSProperties;
        const moving = look.motion === "quest-drift" ? "left-0 top-[var(--y)]" : look.motion === "quest-twinkle" ? "left-[var(--x)] top-[var(--y)]" : "left-[var(--x)] top-0";
        return <span key={`${weather}-${at}`} style={vars} className={`absolute h-1 w-1 ${moving} ${look.motion} ${look.dot}`} />;
      })}
    </div>
  );
}

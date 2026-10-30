"use client";

import { motion } from "framer-motion";
import { Check, Lock, Package, PackageOpen, RotateCcw, Star, Swords } from "lucide-react";
import type { DuoNode } from "@/lib/duoPath";
import { TAP_SCALE } from "@/lib/motionTokens";

// A unit's colours: warm like the rest of the app, with more punch.
export const UNIT_COLOURS = [
  { banner: "bg-[#D9682B] shadow-[0_5px_0_#A34C1C]", node: "bg-[#E37A3D] shadow-[0_7px_0_#A34C1C]", ring: "text-[#D9682B]" },
  { banner: "bg-[#5F8A3C] shadow-[0_5px_0_#456629]", node: "bg-[#73A04A] shadow-[0_7px_0_#456629]", ring: "text-[#5F8A3C]" },
  { banner: "bg-[#1F8A8C] shadow-[0_5px_0_#156465]", node: "bg-[#2BA1A3] shadow-[0_7px_0_#156465]", ring: "text-[#1F8A8C]" },
  { banner: "bg-[#8A4A9E] shadow-[0_5px_0_#653574]", node: "bg-[#A15FB5] shadow-[0_7px_0_#653574]", ring: "text-[#8A4A9E]" },
  { banner: "bg-[#C2912A] shadow-[0_5px_0_#8F6A1C]", node: "bg-[#D6A63A] shadow-[0_7px_0_#8F6A1C]", ring: "text-[#C2912A]" },
];
export type UnitColour = (typeof UNIT_COLOURS)[number];

const LOCKED = "bg-sand-300 text-sand-600 shadow-[0_7px_0_#B9AE9B] dark:bg-zinc-700 dark:text-zinc-400 dark:shadow-[0_7px_0_#27272a]";

interface DuoPathNodeProps {
  node: DuoNode;
  colour: UnitColour;
  // How far through its unit, for the ring around the node you're up to.
  progress: number;
  onTap: () => void;
}

export function DuoPathNode({ node, colour, progress, onTap }: DuoPathNodeProps) {
  const { stop, boss, number, stars, due, isNext } = node;
  const done = stop.state === "done";
  const face = due ? "bg-brand-300 text-brand-950 shadow-[0_7px_0_#B0642F]" : done || isNext ? `${colour.node} text-white` : LOCKED;
  const state = isNext ? "up next" : due ? "due for review" : done ? `${stars} of 3 stars` : "locked";
  return (
    <div className="relative flex flex-col items-center gap-2.5">
      {isNext && (
        <>
          <span className="trail-bob absolute -top-11 z-10 rounded-xl bg-paper px-3 py-1.5 text-xs font-black uppercase tracking-wide text-brand-700 shadow-organic-md dark:bg-zinc-800 dark:text-brand-300">Start</span>
          <svg viewBox="0 0 100 100" aria-hidden="true" className={`absolute -top-[9px] ${boss ? "h-[106px] w-[106px]" : "h-[90px] w-[90px]"} -rotate-90`}>
            <circle cx="50" cy="50" r="46" fill="none" strokeWidth="7" className="stroke-sand-200 dark:stroke-zinc-800" />
            <circle cx="50" cy="50" r="46" fill="none" strokeWidth="7" pathLength="100" strokeDasharray={`${Math.round(progress * 100)} 100`} strokeLinecap="round" stroke="currentColor" className={colour.ring} />
          </svg>
        </>
      )}
      <motion.button type="button" whileTap={TAP_SCALE} onClick={onTap} aria-label={`${boss ? "Boss, " : ""}${stop.title}, ${state}`} className={`relative flex items-center justify-center rounded-full font-heading ${boss ? "h-[88px] w-[88px]" : "h-[72px] w-[72px] text-2xl"} ${face}`}>
        {boss ? <Swords size={38} strokeWidth={2.4} /> : due ? <RotateCcw size={28} strokeWidth={3} /> : !done && !isNext ? <Lock size={24} strokeWidth={2.75} /> : number === undefined ? <Check size={30} strokeWidth={3.5} /> : number}
      </motion.button>
      {done && (
        <span aria-hidden="true" className="flex gap-0.5">
          {[1, 2, 3].map((star) => (
            <Star key={star} size={12} strokeWidth={2.5} className={star <= stars ? "fill-[#F5B83D] text-[#C98A12]" : "text-sand-300 dark:text-zinc-700"} />
          ))}
        </span>
      )}
    </div>
  );
}

interface DuoChestProps {
  chest: "locked" | "ready" | "open";
  onTap: () => void;
}

// A unit's milestone: shut until the unit is done, then ready to open.
export function DuoChest({ chest, onTap }: DuoChestProps) {
  const Icon = chest === "open" ? PackageOpen : Package;
  const face = chest === "ready" ? "bg-[#F5B83D] text-[#4A3205] shadow-[0_7px_0_#A8730D]" : chest === "open" ? "bg-sand-200 text-sand-600 shadow-[0_7px_0_#CFC5B4] dark:bg-zinc-800 dark:text-zinc-400 dark:shadow-[0_7px_0_#18181b]" : LOCKED;
  return (
    <div className="relative">
      {chest === "ready" && <span aria-hidden="true" className="quest-pulse absolute inset-0 rounded-[22px] bg-[#FFE28A]" />}
      <motion.button type="button" whileTap={TAP_SCALE} onClick={onTap} aria-label={chest === "open" ? "Opened chest" : chest === "ready" ? "Chest, ready to open" : "Chest, locked"} className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] ${face}`}>
        <Icon size={34} strokeWidth={2.2} />
      </motion.button>
    </div>
  );
}

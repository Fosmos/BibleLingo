"use client";

import { motion } from "framer-motion";
import { Check, Lock, Star, Swords } from "lucide-react";
import type { QuestNode } from "@/lib/altPaths/quest/world";
import { TAP_SCALE } from "@/lib/motionTokens";

interface QuestStoneProps {
  node: QuestNode;
  isHero: boolean;
  onTap: () => void;
}

const FACE = {
  locked: "bg-stone-400 text-stone-100 shadow-[0_6px_0_#6f6a62]",
  done: "bg-[#F5B83D] text-[#4a3205] shadow-[0_6px_0_#a8730d]",
  current: "bg-brand-500 text-white shadow-[0_6px_0_#8C491A]",
  cracked: "bg-[#F08A8A] text-[#4c0d1c] shadow-[0_6px_0_#a2384f]",
  boss: "bg-zinc-800 text-[#FFD34D] shadow-[0_7px_0_#18181b]",
};

function faceOf(node: QuestNode, isHero: boolean) {
  if (node.cracked) return FACE.cracked;
  if (isHero) return FACE.current;
  if (node.stop.state === "done") return FACE.done;
  if (node.kind === "boss" && node.stop.state !== "locked") return FACE.boss;
  return FACE.locked;
}

function labelOf(node: QuestNode, isHero: boolean): string {
  const state = node.cracked ? "due for review" : isHero ? "up next" : node.stop.state === "done" ? `${node.stars} of 3 stars` : "locked";
  return `${node.kind === "boss" ? "Boss" : ""} ${node.stop.title ?? ""}, ${state}`.trim();
}

function Crack() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="absolute inset-0 h-full w-full text-[#4c0d1c]">
      <path d="M34 2 L27 18 L37 26 L26 38 L34 48 L29 62 M37 26 L52 22 M26 38 L10 42" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

// A stop on the road: a verse's stone with its stars, or a boss's bigger one.
export function QuestStone({ node, isHero, onTap }: QuestStoneProps) {
  const boss = node.kind === "boss";
  const done = node.stop.state === "done";
  const locked = node.stop.state === "locked";
  return (
    <div className="relative flex flex-col items-center gap-2">
      {isHero && <span aria-hidden="true" className="quest-pulse absolute left-1/2 top-0 -ml-[34px] h-[68px] w-[68px] rounded-full bg-brand-300" />}
      <motion.button type="button" whileTap={TAP_SCALE} onClick={onTap} aria-label={labelOf(node, isHero)} className={`relative flex items-center justify-center rounded-full border-[3px] border-white/70 font-heading ${boss ? "h-[84px] w-[84px] text-2xl" : "h-16 w-16 text-xl"} ${faceOf(node, isHero)}`}>
        {node.cracked && <Crack />}
        <span className="relative">
          {boss ? <Swords size={38} strokeWidth={2.2} /> : locked ? <Lock size={22} strokeWidth={2.75} /> : done && node.number === undefined ? <Check size={26} strokeWidth={3} /> : node.number}
        </span>
      </motion.button>
      {done && (
        <span className="flex gap-0.5 rounded-full bg-black/30 px-1.5 py-0.5">
          {[1, 2, 3].map((star) => (
            <Star key={star} aria-hidden="true" size={11} strokeWidth={2.5} className={star <= node.stars ? "fill-[#FFD34D] text-[#FFD34D]" : "text-white/40"} />
          ))}
        </span>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flag, Flame, Footprints, Swords } from "lucide-react";

interface MasteryTrackProps {
  playerPercent: number;
  chaserPercent: number;
  // Bumped by the parent on every correct letter — triggers a one-off "hop" on the runner
  // distinct from the track's continuous, momentum-driven position shift.
  advanceTick: number;
  // Bumped only on a *surged* correct letter (a fast, rhythmic keystroke) — triggers a
  // brief "Pillar of Fire" glow around the runner, separate from the plain hop above.
  surgeTick: number;
  // Rounded word-count gap between the runner and the chariots, for the label + gap meter.
  gapWords: number;
}

const HOP_DURATION_MS = 300;
const SURGE_DURATION_MS = 450;
// How much of the full 0–100 track is visible at once — small on purpose, so the camera
// following the runner reads as motion and the gap to the chariots stays legible up close.
const VIEWPORT_SPAN = 22;
const PLAYER_ANCHOR = 0.4;
// A gap this wide or more reads as "fully safe" on the top-right meter — beyond it the bar
// just stays full rather than trying to represent an unbounded distance.
const GAP_METER_CAP_WORDS = 8;

function viewportFraction(percent: number, cameraLow: number): number {
  return Math.min(1, Math.max(0, (percent - cameraLow) / VIEWPORT_SPAN));
}

// The Red Sea chase viewport: a dry seabed path between two static, glowing walls of held-
// back water, a distant pillar of fire/cloud overhead, a Hebrew runner sprinting toward the
// far shore, and Egyptian chariots closing in through the mist from behind. Vertical, with a
// small camera window that follows the runner rather than showing the whole crossing at once.
export function MasteryTrack({ playerPercent, chaserPercent, advanceTick, surgeTick, gapWords }: MasteryTrackProps) {
  // Render-time state adjustment (not an effect body) — see MasteryChaseRound for why this
  // pattern is used instead of a plain setState-in-effect.
  const [prevTick, setPrevTick] = useState(advanceTick);
  const [hopping, setHopping] = useState(false);
  if (advanceTick !== prevTick) {
    setPrevTick(advanceTick);
    setHopping(true);
  }
  const [prevSurgeTick, setPrevSurgeTick] = useState(surgeTick);
  const [surging, setSurging] = useState(false);
  if (surgeTick !== prevSurgeTick) {
    setPrevSurgeTick(surgeTick);
    setSurging(true);
  }

  useEffect(() => {
    if (!hopping) return;
    const timeout = setTimeout(() => setHopping(false), HOP_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [hopping]);
  useEffect(() => {
    if (!surging) return;
    const timeout = setTimeout(() => setSurging(false), SURGE_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [surging]);

  const cameraLow = Math.min(Math.max(playerPercent - VIEWPORT_SPAN * PLAYER_ANCHOR, 0), Math.max(0, 100 - VIEWPORT_SPAN));
  const playerFraction = viewportFraction(playerPercent, cameraLow);
  const chaserFraction = viewportFraction(chaserPercent, cameraLow);
  const chaserOffscreen = chaserPercent < cameraLow;
  const finishInView = 100 - cameraLow <= VIEWPORT_SPAN;
  const proximity = Math.min(1, Math.max(0, 1 - gapWords / GAP_METER_CAP_WORDS));
  const gapMeterPercent = proximity > 0 ? 100 - proximity * 100 : 100;

  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="relative flex-1 overflow-hidden rounded-3xl bg-gradient-to-t from-[#F2E9D8] to-paper dark:from-zinc-900 dark:to-zinc-950">
        {/* Held-back walls of water, flanking the dry path down the center. */}
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-blue-900 via-blue-500/80 to-transparent opacity-90" />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-blue-900 via-blue-500/80 to-transparent opacity-90" />
        {/* Pillar of fire and cloud, glowing in the distance overhead. */}
        <div className="absolute inset-x-0 top-3 flex flex-col items-center gap-1 opacity-70">
          <div className="h-8 w-8 rounded-full bg-brand-400 blur-md" />
          <Flame size={16} className="-mt-7 text-brand-500" />
        </div>
        {/* Distance gap meter — top right. */}
        <div className="absolute right-3 top-3 flex w-16 flex-col items-end gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Gap</span>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist dark:bg-zinc-700">
            <motion.div
              className={`h-full rounded-full ${proximity > 0.7 ? "bg-heart-500" : "bg-brand-500"}`}
              animate={{ width: `${gapMeterPercent}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>
        {finishInView && (
          <motion.div
            className="absolute inset-x-0 flex items-center justify-center gap-1 border-t-2 border-dashed border-brand-500 pt-1 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300"
            initial={false}
            animate={{ bottom: `${viewportFraction(100, cameraLow) * 100}%` }}
            transition={{ duration: 0.15 }}
          >
            <Flag size={14} /> Shore
          </motion.div>
        )}
        {/* Egyptian chariots, closing in through rising dust/mist as the gap narrows. */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          animate={{ bottom: `${chaserFraction * 100}%`, y: [0, -4, 0] }}
          transition={{
            bottom: { duration: 0.05, ease: "linear" },
            y: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <motion.div
            className="absolute inset-0 -m-3 rounded-full bg-zinc-500 blur-md"
            animate={{ opacity: proximity * 0.5 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />
          <div
            className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-heart-500 bg-heart-50 shadow-md dark:bg-zinc-950 ${chaserOffscreen ? "opacity-60" : ""}`}
          >
            <Swords size={24} className="text-heart-600" />
          </div>
        </motion.div>
        {/* The runner, sprinting the dry seabed toward the far shore. */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          animate={{
            bottom: `${playerFraction * 100}%`,
            y: hopping ? [0, -18, 0] : [0, -4, 0],
            scale: hopping ? [1, 1.15, 1] : 1,
          }}
          transition={{
            bottom: { duration: 0.15, ease: "easeOut" },
            y: { duration: hopping ? HOP_DURATION_MS / 1000 : 0.5, repeat: hopping ? 0 : Infinity, ease: "easeInOut" },
            scale: { duration: HOP_DURATION_MS / 1000 },
          }}
        >
          {surging && (
            <motion.div
              className="absolute inset-0 -m-2 rounded-full bg-brand-400"
              initial={{ opacity: 0.7, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.6 }}
              transition={{ duration: SURGE_DURATION_MS / 1000 }}
              aria-hidden="true"
            />
          )}
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-600 bg-brand-50 shadow-md dark:bg-zinc-950">
            <Footprints size={24} className="text-brand-700" />
          </div>
        </motion.div>
      </div>
      <p className="text-center text-sm font-semibold text-ink-soft">
        {gapWords > 0 ? `${gapWords} word${gapWords === 1 ? "" : "s"} ahead` : "The chariots are right behind you!"}
      </p>
    </div>
  );
}

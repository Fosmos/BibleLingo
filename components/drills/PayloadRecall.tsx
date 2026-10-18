"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { playCorrectSfx, playIncorrectSfx } from "@/lib/audio";
import { PAYLOAD_COLORS, type Payload } from "@/lib/memoryChallenges";
import { TAP_SCALE } from "@/lib/motionTokens";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";

interface PayloadRecallProps {
  payload: Payload;
  onCorrect: () => void;
}

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// After the verse is said: pick the number and the color that flashed up before it
// (PayloadFlash.tsx). Both must be right to move on — a wrong one clears for another try.
export function PayloadRecall({ payload, onCorrect }: PayloadRecallProps) {
  const [number, setNumber] = useState<number | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [done, setDone] = useState(false);

  function check(nextNumber: number | null, nextColor: string | null) {
    setNumber(nextNumber);
    setColor(nextColor);
    if (nextNumber === null || nextColor === null) return;
    const numberRight = nextNumber === payload.number;
    const colorRight = nextColor === payload.color.name;
    if (numberRight && colorRight) {
      playCorrectSfx();
      setWrong(false);
      setDone(true);
      setTimeout(onCorrect, 600);
      return;
    }
    playIncorrectSfx();
    setWrong(true);
    if (!numberRight) setNumber(null);
    if (!colorRight) setColor(null);
  }

  const optionClass = (selected: boolean) =>
    `flex h-11 flex-1 items-center justify-center rounded-xl text-lg font-bold transition ${selected ? "ring-4 ring-brand-500 ring-offset-2 ring-offset-paper dark:ring-offset-zinc-900" : ""}`;

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="flex items-center gap-1.5 self-center text-sm font-extrabold text-ink dark:text-zinc-100">
        {done ? "That's it!" : wrong ? "Not quite — try again" : "What was the number and color?"}
        <InfoTip text={INFO_TIPS.payloadRecall} />
      </p>
      <div className="flex w-full gap-1.5" role="group" aria-label="Number">
        {NUMBERS.map((option) => (
          <motion.button
            key={option}
            type="button"
            whileTap={TAP_SCALE}
            disabled={done}
            onClick={() => check(option, color)}
            aria-pressed={number === option}
            className={`${optionClass(number === option)} bg-sand-200 text-ink dark:bg-zinc-800 dark:text-zinc-100`}
          >
            {option}
          </motion.button>
        ))}
      </div>
      <div className="flex w-full gap-2" role="group" aria-label="Color">
        {PAYLOAD_COLORS.map((option) => (
          <motion.button
            key={option.name}
            type="button"
            whileTap={TAP_SCALE}
            disabled={done}
            onClick={() => check(number, option.name)}
            aria-pressed={color === option.name}
            aria-label={option.name}
            className={`${optionClass(color === option.name)} ${option.swatch} text-white`}
          >
            {color === option.name && <Check size={20} strokeWidth={3} />}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/motionTokens";

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: "brand" | "gold" | "mastery" | "secondary";
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  brand: "bg-brand-500 hover:bg-brand-600 text-white shadow-[0_8px_24px_rgba(107,86,68,0.18)]",
  gold: "bg-gold-500 hover:bg-gold-600 text-white",
  mastery: "bg-mastery-500 hover:bg-mastery-600 text-white",
  // For secondary actions that shouldn't visually compete with a screen's one primary CTA —
  // a soft tinted fill + accent-colored text instead of a solid color block.
  secondary: "border border-brand-200 bg-brand-500/10 text-brand-700 hover:bg-brand-500/15 dark:border-brand-800 dark:text-brand-300",
};

export function Button({ href, children, variant = "brand", className }: ButtonProps) {
  return (
    // shrink-0 on the flex-item Link itself — a flex row's own default flex-shrink:1 would
    // otherwise let this button get squeezed narrower than its label needs whenever it shares
    // a tight row with a sibling that keeps growing (see TodayVersesCard.tsx's own "Review" +
    // "Go to your path" pair on a narrow viewport), which just pushes the wrapping problem down
    // onto the label text below instead of solving it — a short pill-shaped button reading as
    // 3-4 stacked lines is far worse than the row itself wrapping to a second line. Paired with
    // whitespace-nowrap on the label so the text itself never breaks either.
    <Link href={href} className="inline-block shrink-0">
      <motion.span
        whileTap={TAP_SCALE}
        className={`inline-block whitespace-nowrap rounded-full px-6 py-3 text-sm font-semibold transition-colors ${VARIANT_CLASSES[variant]} ${className ?? ""}`}
      >
        {children}
      </motion.span>
    </Link>
  );
}

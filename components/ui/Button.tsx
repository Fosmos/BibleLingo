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
  // Stretches to its row's full width, label centred (the Organic restyle's primary pills).
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  brand: "bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-paper",
  gold: "bg-gold-500 hover:bg-gold-600 text-white",
  mastery: "bg-mastery-500 hover:bg-mastery-600 text-white",
  // For secondary actions that shouldn't visually compete with a screen's one primary CTA —
  // a soft tinted fill + accent-colored text instead of a solid color block.
  secondary: "border border-line text-ink hover:bg-ink/[.07] active:bg-ink/[.14] dark:border-zinc-700 dark:text-zinc-200",
};

export function Button({ href, children, variant = "brand", className, fullWidth }: ButtonProps) {
  return (
    // shrink-0 on the flex-item Link itself — a flex row's own default flex-shrink:1 would
    // otherwise let this button get squeezed narrower than its label needs whenever it shares
    // a tight row with a sibling that keeps growing (see TodayVersesCard.tsx's own "Review" +
    // "Go to your path" pair on a narrow viewport), which just pushes the wrapping problem down
    // onto the label text below instead of solving it — a short pill-shaped button reading as
    // 3-4 stacked lines is far worse than the row itself wrapping to a second line. Paired with
    // whitespace-nowrap on the label so the text itself never breaks either.
    <Link href={href} className={fullWidth ? "block w-full" : "inline-block shrink-0"}>
      <motion.span
        whileTap={TAP_SCALE}
        className={`${fullWidth ? "flex w-full items-center justify-center gap-2 py-3.5 text-base" : "inline-block px-6 py-3 text-sm"} whitespace-nowrap rounded-full font-semibold transition-colors ${VARIANT_CLASSES[variant]} ${className ?? ""}`}
      >
        {children}
      </motion.span>
    </Link>
  );
}

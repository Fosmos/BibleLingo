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
    <Link href={href} className="inline-block">
      <motion.span
        whileTap={TAP_SCALE}
        className={`inline-block rounded-full px-6 py-3 text-sm font-semibold transition-colors ${VARIANT_CLASSES[variant]} ${className ?? ""}`}
      >
        {children}
      </motion.span>
    </Link>
  );
}

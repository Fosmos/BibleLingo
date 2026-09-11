"use client";

import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/motionTokens";

interface FetchLoadingProps {
  label: string;
}

export function FetchLoading({ label }: FetchLoadingProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}

interface FetchErrorProps {
  message: string;
  onRetry?: () => void;
}

export function FetchError({ message, onRetry }: FetchErrorProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-heart-200 bg-heart-50 p-4 text-center dark:border-heart-900 dark:bg-heart-950">
      <p className="text-sm text-heart-700 dark:text-heart-300">{message}</p>
      {onRetry && (
        <motion.button
          type="button"
          whileTap={TAP_SCALE}
          onClick={onRetry}
          className="rounded-full bg-heart-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </motion.button>
      )}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { TOPICS } from "@/lib/memorizationContent";
import { TAP_SCALE } from "@/lib/motionTokens";

interface TopicPickerProps {
  onBack: () => void;
}

export function TopicPicker({ onBack }: TopicPickerProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-brand-600 hover:underline">
        ← Choose a different way
      </button>
      <h3 className="text-title">Choose a topic</h3>
      <p className="text-sm text-ink-muted">A small set of verses curated around a theme.</p>
      <div className="flex flex-col gap-2">
        {TOPICS.map((topic) => (
          <motion.button
            key={topic.id}
            type="button"
            whileTap={TAP_SCALE}
            onClick={() => router.push(`/path/${encodeURIComponent(`topic:${topic.id}`)}`)}
            className="flex items-center justify-between rounded-lg bg-brand-500 px-4 py-3 text-left text-sm font-medium text-white"
          >
            <span>{topic.label}</span>
            <span className="text-xs uppercase tracking-wide">{topic.verses.length} verses</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

// The Mind Map's one "you are here" marker — a map pin bobbing just above the reader's place: the
// verse today's lesson picks up at (or, while a lesson is open in the sheet, the verse being
// drilled right now), or, while that verse isn't on screen, the closest thing that is — its
// chapter, book, genre… (see lib/mindMapVerseStream.ts's pinnedRingId).
// Sits clear of the node, so it never touches it as it bobs.
interface MindMapActivePinProps {
  // Sits higher, clearing something already at the node's top — a book's crest.
  raised?: boolean;
  // A ring node's pin (24px) or a verse chip's (smaller, closer to its small circle).
  variant?: "ring" | "chip";
}

// The Organic restyle's pin: terracotta outline, pale terracotta fill. Always above its node
// (the reader's own call — the handoff had moved the chip pin to the side).
export function MindMapActivePin({ raised, variant = "chip" }: MindMapActivePinProps) {
  const ring = variant === "ring";
  return (
    <motion.span
      aria-label="Your place"
      className={`pointer-events-none absolute left-1/2 z-10 flex -translate-x-1/2 ${ring ? (raised ? "-top-[40px]" : "-top-[30px]") : "-top-[25px]"}`}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <MapPin size={ring ? 24 : 21} strokeWidth={2.75} className="fill-brand-200 text-brand-500" />
    </motion.span>
  );
}

"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

// The Mind Map's one "you are here" marker — a map pin bobbing just above the reader's place: the
// verse today's lesson picks up at (or, while a lesson is open in the sheet, the verse being
// drilled right now), or, while that verse isn't on screen, the closest thing that is — its
// chapter, book, genre… (see lib/mindMapVerseStream.ts's pinnedRingId). Filled with the node's own
// color (`--nodeBg`/`--nodeText`). Sits clear of the node, so it never touches it as it bobs.
interface MindMapActivePinProps {
  // Sits higher, clearing something already at the node's top — a book's crest.
  raised?: boolean;
}

export function MindMapActivePin({ raised }: MindMapActivePinProps) {
  return (
    <motion.span
      aria-label="Your place"
      className={`pointer-events-none absolute left-1/2 z-10 -ml-2 flex ${raised ? "-top-[33px]" : "-top-[19px]"}`}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <MapPin size={16} strokeWidth={2.25} className="fill-[var(--nodeBg)] text-[var(--nodeText)]" />
    </motion.span>
  );
}

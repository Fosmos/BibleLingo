"use client";

import type { ReactNode } from "react";
import { useLessonSessionStore } from "@/store/useLessonSessionStore";
import { peekText } from "@/lib/peek";

interface PeekWordProps {
  word: string;
  // How the stage shows the word while it's hidden.
  children: ReactNode;
}

// A word a stage is hiding — shown as its first letter or in full, sand-500, while the reader has
// the Letters or Verse help chip on (lib/peek.ts); otherwise however the stage hides it.
export function PeekWord({ word, children }: PeekWordProps) {
  const peek = useLessonSessionStore((state) => state.peek);
  const text = peekText(word, peek);
  return text === null ? <>{children}</> : <span className="text-sand-500 dark:text-zinc-500">{text}</span>;
}

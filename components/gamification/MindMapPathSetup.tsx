"use client";

import { X } from "lucide-react";
import { findBook } from "@/lib/bibleBooks";
import { pathTargetLabel, type PathTarget } from "@/lib/mindMapPathTarget";
import { GuidedPathFlow } from "@/components/gamification/GuidedPathFlow";

interface MindMapPathSetupProps {
  target: PathTarget;
  onClose: () => void;
}

// The Mind Map's path setup, inside the bottom sheet with the map still in view above it: the
// book/chapter/verse was already picked by navigating the map (see MindMapPathTab.tsx), so this
// runs just the rest of GuidedPathFlow.tsx — translation, verses per day, learn intensity and
// "already know some of this?" — then opens the fresh path.
export function MindMapPathSetup({ target, onClose }: MindMapPathSetupProps) {
  const book = findBook(target.book);
  if (!book) return null;
  const preset = {
    book,
    chapter: target.kind === "book" ? undefined : target.chapter,
    verse: target.kind === "verse" ? target.verse : undefined,
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">New path · {pathTargetLabel(target)}</p>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink-muted hover:bg-mist dark:hover:bg-zinc-800">
          <X size={20} />
        </button>
      </div>
      <GuidedPathFlow mode={target.kind} preset={preset} onBack={onClose} />
    </div>
  );
}

"use client";

import { useProgressStore } from "@/store/useProgressStore";
import { resolvePathLabel } from "@/lib/memorizationContent";
import { Sticker } from "@/components/gamification/Sticker";

export function StickerBook() {
  const stickers = useProgressStore((state) => state.stickers);

  if (stickers.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No chapters memorized yet — finish a boss battle or add a verse you already know to earn your first sticker.
      </p>
    );
  }

  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-4 sm:grid-cols-3">
      {stickers.map((key) => (
        <Sticker key={key} label={resolvePathLabel(key) ?? key} />
      ))}
    </div>
  );
}

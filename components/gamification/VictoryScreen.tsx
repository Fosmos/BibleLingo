"use client";

import { Confetti } from "@/components/ui/Confetti";
import { Button } from "@/components/ui/Button";

interface VictoryScreenProps {
  label: string;
}

export function VictoryScreen({ label }: VictoryScreenProps) {
  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-4 overflow-hidden p-8 text-center">
      <Confetti />
      <h1 className="text-title text-gold-600">Victory! &quot;{label}&quot; memorized!</h1>
      <p className="text-ink-muted">You earned a sticker for your sticker book.</p>
      <Button href="/stickers">View sticker book</Button>
    </div>
  );
}

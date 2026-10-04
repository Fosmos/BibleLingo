import { Award } from "lucide-react";

interface StickerProps {
  label: string;
}

export function Sticker({ label }: StickerProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-organic bg-white p-4 text-center shadow-organic-sm dark:bg-zinc-900">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-200 text-brand-800 dark:bg-brand-900 dark:text-brand-200">
        <Award size={26} strokeWidth={2.75} />
      </span>
      <span className="text-sm font-bold text-ink dark:text-zinc-100">{label}</span>
    </div>
  );
}

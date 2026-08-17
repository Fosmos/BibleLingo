import { Award } from "lucide-react";

interface StickerProps {
  label: string;
}

export function Sticker({ label }: StickerProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-gold-50 p-4 text-center dark:bg-gold-900/30">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 text-white">
        <Award size={26} />
      </span>
      <span className="text-sm font-semibold text-gold-700 dark:text-gold-300">{label}</span>
    </div>
  );
}

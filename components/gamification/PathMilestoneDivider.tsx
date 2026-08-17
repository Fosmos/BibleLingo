import { Crown } from "lucide-react";

interface PathMilestoneDividerProps {
  count: number;
}

// A small breather in the path's visual rhythm every 5 lessons — purely decorative (no
// gating logic), just keeping a long straight run of nodes from reading as a plain list.
export function PathMilestoneDivider({ count }: PathMilestoneDividerProps) {
  return (
    <div className="flex w-full max-w-[14rem] items-center gap-3 py-1" aria-hidden="true">
      <div className="h-px flex-1 bg-mist dark:bg-zinc-700" />
      <div className="flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700 dark:bg-zinc-800 dark:text-gold-400">
        <Crown size={12} /> {count}
      </div>
      <div className="h-px flex-1 bg-mist dark:bg-zinc-700" />
    </div>
  );
}

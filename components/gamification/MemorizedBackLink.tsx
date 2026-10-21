import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface MemorizedBackLinkProps {
  href?: string;
  label?: string;
}

// The way back from a Memorized stats page — to the tab, or (a passage reached from its book) the book page.
export function MemorizedBackLink({ href = "/memorized", label = "Memorized" }: MemorizedBackLinkProps) {
  return (
    <Link href={href} className="flex items-center gap-1 self-start rounded-xl py-1.5 pr-2 text-sm font-black text-sand-700 hover:text-ink dark:text-zinc-400">
      <ChevronLeft size={18} strokeWidth={2.75} /> {label}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { PegMasterListRow } from "@/components/gamification/PegMasterListRow";

const NUMBERS = Array.from({ length: 99 }, (_, i) => i + 1);

// One word per number, 01-99, pre-filled with lib/pegSystem.ts's Major-System recommendation
// until overridden — the single source every PegTagField.tsx chip in a path view reads from
// and writes to (see UserProgress.pegMasterList). Edited here or edited inline from a path
// view, it's the same entry either way.
export default function PegListPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <Link href="/profile" className="self-start text-sm font-medium text-brand-600 hover:underline">
        ← Back to Profile
      </Link>
      <h1 className="text-title">Master Peg List</h1>
      <p className="text-sm text-ink-muted">
        Your own word for each number, 01-99 — pre-filled with the Major System&apos;s own recommendation until you
        change one. Editing a peg tag anywhere in a path view changes it here too, and every future peg tag for that
        number pulls from whatever&apos;s set here.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {NUMBERS.map((n) => (
          <PegMasterListRow key={n} n={n} />
        ))}
      </div>
    </div>
  );
}

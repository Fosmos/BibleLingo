"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { PathKind } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { PATH_TYPE_META } from "@/lib/pathTypeMeta";
import { choiceFromKey, suggestedChoice, type PathChoice } from "@/lib/pathChoice";
import { trailHref } from "@/lib/readerHref";
import { PathTypeGrid } from "@/components/gamification/PathTypeGrid";
import { PathPickerOptions } from "@/components/gamification/PathPickerOptions";

interface PathPickerProps {
  // A choice that hasn't been started yet — on to the setup wizard.
  onStart: (choice: PathChoice) => void;
}

const PLURAL: Record<PathKind, string> = { verse: "verses", chapter: "chapters", book: "books", topic: "topics" };

// "What do you want to memorize?" (design_handoff_path_picker → Picker): a type, then a passage or
// topic — the type's Suggested one (or the path you're on, if it's that type) pre-selected. A path
// already started skips setup and goes straight back to its trail.
export function PathPicker({ onStart }: PathPickerProps) {
  const router = useRouter();
  const activeKey = useProgressStore((state) => state.activePathKey);
  const paths = useProgressStore((state) => state.paths);
  const setActivePath = useProgressStore((state) => state.setActivePath);
  const initialKind = (activeKey && choiceFromKey(activeKey)?.kind) || "chapter";
  const preselect = (kind: PathKind) => {
    const active = activeKey ? choiceFromKey(activeKey) : null;
    return active?.kind === kind ? active : suggestedChoice(kind, activeKey, paths);
  };
  const [kind, setKind] = useState<PathKind>(initialKind);
  const [selected, setSelected] = useState<PathChoice | null>(() => preselect(initialKind));
  const [query, setQuery] = useState("");
  const suggested = suggestedChoice(kind, activeKey, paths);

  function changeKind(next: PathKind) {
    setKind(next);
    setQuery("");
    setSelected(preselect(next));
  }

  const started = selected ? Boolean(paths[selected.key]) : false;
  const cta = !selected ? `Pick a ${PATH_TYPE_META[kind].name.toLowerCase()}` : selected.key === activeKey ? `Back to ${selected.title}` : started ? `Continue ${selected.title}` : `Start ${selected.title}`;
  function go() {
    if (!selected) return;
    if (!started) return onStart(selected);
    setActivePath(selected.key);
    router.push(trailHref(selected.key, paths[selected.key].version));
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <div className="flex flex-1 flex-col gap-4 px-[18px] pb-[120px] pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <header className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs font-extrabold uppercase tracking-[.08em] text-sage-800 dark:text-sage-300">New path</span>
            <h1 className="font-heading text-[36px] leading-[1.02] text-ink [text-wrap:balance] dark:text-zinc-100">What do you want to memorize?</h1>
          </div>
          <button type="button" onClick={() => router.push("/")} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FEFDFB] text-ink shadow-organic-sm dark:bg-zinc-900 dark:text-zinc-100">
            <X size={20} strokeWidth={2.75} />
          </button>
        </header>
        <PathTypeGrid value={kind} onChange={changeKind} />
        <h2 className="pt-1 font-heading text-xl text-ink dark:text-zinc-100">Pick a {PATH_TYPE_META[kind].name.toLowerCase()}</h2>
        <label className="relative block">
          <Search size={18} strokeWidth={2.75} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sand-600" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${kind === "verse" || kind === "chapter" ? "books" : PLURAL[kind]}`}
            className="w-full rounded-full border-2 border-sand-300 bg-[#FEFDFB] py-3 pl-11 pr-4 text-[15px] font-semibold text-ink outline-none focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <div className="flex flex-col gap-2.5">
          <PathPickerOptions key={kind} kind={kind} query={query} suggested={suggested} activeKey={activeKey} selected={selected} onSelect={setSelected} />
        </div>
      </div>
      <div className="fixed inset-x-4 bottom-[calc(1.4rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-md">
        <button type="button" onClick={go} disabled={!selected} className="w-full truncate rounded-full bg-brand-500 px-[22px] py-[17px] text-base font-extrabold text-white shadow-[0_6px_0_#8C491A] hover:bg-brand-600 disabled:opacity-45">
          {cta}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { useActivePathKeys } from "@/lib/useActivePathKeys";
import { useOpenPath } from "@/lib/useOpenPath";
import { resolvePathLabel } from "@/lib/memorizationContent";

// "Your paths" — the canvas's top-left chip once more than one path is active. Several paths run
// at once, each with its own lessons, but the map focuses on one: this lists them all, the
// focused one first-marked; tapping another switches focus to it (opening that path), and the ×
// stops a path (its progress is kept — picking it again later resumes it). Topic paths, which have
// no one place on the map, are reached from here too.
export function MindMapPathsMenu() {
  const keys = useActivePathKeys();
  const focused = useProgressStore((state) => state.activePathKey);
  const paths = useProgressStore((state) => state.paths);
  const removeActivePath = useProgressStore((state) => state.removeActivePath);
  const openPath = useOpenPath();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (keys.length < 2) return null;

  // Stopping the path on screen moves on to the next one (or the path picker) rather than
  // leaving its no-longer-active map up.
  function stop(key: string) {
    removeActivePath(key);
    if (key !== focused) return;
    setOpen(false);
    const next = keys.find((candidate) => candidate !== key);
    if (next && paths[next]) openPath(next, paths[next].version);
    else router.push("/begin");
  }

  return (
    <div className="absolute left-3 top-3 z-20 flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
      >
        {focused ? resolvePathLabel(focused) : "Your paths"}
        <span className="font-normal text-ink-muted">· {keys.length} paths</span>
        <ChevronDown size={14} className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <ul className="flex min-w-48 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {keys.map((key) => (
            <li key={key} className="flex items-center border-b border-line last:border-b-0 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (key !== focused && paths[key]) openPath(key, paths[key].version);
                }}
                className={`flex-1 px-3 py-2 text-left text-sm ${key === focused ? "font-semibold text-brand-600" : "text-ink dark:text-zinc-200"}`}
              >
                {resolvePathLabel(key)}
                {key === focused && <span className="ml-1 text-xs font-normal text-ink-muted">(on the map)</span>}
              </button>
              <button type="button" onClick={() => stop(key)} aria-label={`Stop ${resolvePathLabel(key)}`} className="px-3 py-2 text-ink-muted hover:text-heart-600">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

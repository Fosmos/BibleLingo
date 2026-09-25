"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLessonSessionStore, useIsLessonSessionActive } from "@/store/useLessonSessionStore";
import { useProgressStore } from "@/store/useProgressStore";
import { resolvePath, resolvePathLabel } from "@/lib/memorizationContent";
import { playBookCompleteSfx } from "@/lib/audio";
import { Confetti } from "@/components/ui/Confetti";
import { TAP_SCALE } from "@/lib/motionTokens";

// Shown once a path's last lesson is done (see lib/completeDayEffects.ts): the path has already
// left the reader's active paths, and this celebrates it with everything they memorized — every
// verse, now in spaced review. Waits until no lesson is on screen, so it lands after the
// lesson's own finish, then sends the reader on to their next path (or to pick a new one).
export function PathCompleteCelebration() {
  const pathKey = useLessonSessionStore((state) => state.completedPath);
  const setCompletedPath = useLessonSessionStore((state) => state.setCompletedPath);
  const lessonActive = useIsLessonSessionActive();
  const nextKey = useProgressStore((state) => state.activePathKey);
  const nextVersion = useProgressStore((state) => (state.activePathKey ? state.paths[state.activePathKey]?.version : undefined));
  const router = useRouter();
  const showing = pathKey !== null && !lessonActive;

  useEffect(() => {
    if (showing) playBookCompleteSfx();
  }, [showing]);

  if (!showing || !pathKey) return null;
  const label = resolvePathLabel(pathKey) ?? "Your path";
  const verses = resolvePath(pathKey)?.verses.filter((verse) => verse.text.trim().length > 0) ?? [];

  function done() {
    setCompletedPath(null);
    if (nextKey && nextVersion) router.push(`/path/${encodeURIComponent(nextKey)}?version=${encodeURIComponent(nextVersion)}`);
    else router.push("/begin");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <Confetti />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative flex max-h-[85dvh] w-full max-w-md flex-col items-center gap-3 rounded-3xl bg-parchment p-6 text-center shadow-2xl dark:bg-zinc-900"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
          <Check size={30} strokeWidth={3} />
        </span>
        <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">Path complete</p>
        <h2 className="font-serif text-2xl font-bold text-ink dark:text-zinc-100">{label}</h2>
        <p className="text-sm text-ink-muted">
          You memorized {verses.length} {verses.length === 1 ? "verse" : "verses"} — {verses.length === 1 ? "it's" : "they're"} now in your spaced review.
        </p>
        {verses.length > 0 && (
          <ul className="w-full min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl bg-white/70 p-3 text-left dark:bg-zinc-800/70">
            {verses.map((verse) => (
              <li key={verse.id} className="font-serif text-sm leading-snug text-ink dark:text-zinc-200">
                <span className="mr-1 text-xs font-bold text-brand-600">
                  {verse.book} {verse.chapter}:{verse.verseNumber}
                </span>
                {verse.text}
              </li>
            ))}
          </ul>
        )}
        <motion.button type="button" whileTap={TAP_SCALE} onClick={done} className="w-full rounded-full bg-brand-500 px-4 py-3 font-semibold text-white">
          {nextKey ? "Continue" : "Choose what's next"}
        </motion.button>
      </motion.div>
    </div>
  );
}

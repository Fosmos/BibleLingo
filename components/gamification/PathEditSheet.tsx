"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { PathReminder } from "@/types";
import { useProgressStore } from "@/store/useProgressStore";
import { BIBLE_VERSIONS } from "@/lib/bibleVersions";
import { parsePathKey, resolvePath, resolvePathLabel } from "@/lib/memorizationContent";
import { PATH_REMINDERS, rePace } from "@/lib/pathEdit";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { PaceStepper } from "@/components/gamification/PaceStepper";

interface PathEditSheetProps {
  pathKey: string;
  onClose: () => void;
}

const FIELD = "w-full rounded-xl border border-sand-300 bg-paper px-3 py-2.5 text-[15px] font-medium text-ink dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const LABEL = "flex flex-col gap-1 text-[13px] font-extrabold text-sand-700 dark:text-zinc-400";

// Editing a path from Home: its translation, new verses a day and reminder, or removing it. A topic
// has no translation of its own and a single verse no pace. Removing only takes it off the reader's
// paths: what they've memorized stays in spaced review.
export function PathEditSheet({ pathKey, onClose }: PathEditSheetProps) {
  const plan = useProgressStore((state) => state.paths[pathKey]);
  const savedReminder = useProgressStore((state) => state.pathReminders?.[pathKey]);
  const updatePath = useProgressStore((state) => state.updatePath);
  const setPathReminder = useProgressStore((state) => state.setPathReminder);
  const removeActivePath = useProgressStore((state) => state.removeActivePath);
  const { kind } = parsePathKey(pathKey);
  const verses = resolvePath(pathKey)?.verses ?? [];
  const [version, setVersion] = useState(plan?.version ?? "KJV");
  const [pace, setPace] = useState<number | "">(plan?.versesPerDay ?? 1);
  const [reminder, setReminder] = useState<PathReminder>(savedReminder ?? "off");
  const [removing, setRemoving] = useState(false);
  if (!plan) return null;
  const label = resolvePathLabel(pathKey) ?? pathKey;
  const canPace = kind !== "verse" && verses.length > 0;

  const save = () => {
    const paced = canPace && pace !== "" && pace !== (plan.versesPerDay ?? 1) ? rePace(pathKey, verses, plan, pace) : {};
    updatePath(pathKey, { version, ...paced });
    setPathReminder(pathKey, reminder);
    onClose();
  };
  const remove = () => {
    removeActivePath(pathKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/35" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE.enter }} className="relative mx-auto flex max-h-[88dvh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-t-[32px] bg-paper px-[22px] pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 shadow-organic-lg dark:bg-zinc-950">
        <h2 className="font-heading text-[24px] leading-tight text-ink dark:text-zinc-100">Edit {label}</h2>
        {kind !== "topic" && (
          <label className={LABEL}>
            Translation
            <select value={version} onChange={(event) => setVersion(event.target.value)} className={FIELD}>
              {BIBLE_VERSIONS.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.code} · {entry.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {canPace && (
          <div className={LABEL}>
            New verses a day
            <PaceStepper value={pace} onChange={setPace} totalVerses={verses.length} />
          </div>
        )}
        <label className={LABEL}>
          Reminder
          <select value={reminder} onChange={(event) => setReminder(event.target.value as PathReminder)} className={FIELD}>
            {PATH_REMINDERS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.title} · {entry.sub}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={canPace && pace === ""} onClick={save} className="min-h-14 rounded-full bg-brand-500 text-base font-extrabold text-white shadow-[0_5px_0_#8C491A] disabled:opacity-40">
          Save
        </button>
        {removing ? (
          <div className="flex flex-col gap-2 rounded-[18px] bg-sand-100 p-3.5 dark:bg-zinc-900">
            <p className="text-[14px] font-semibold leading-snug text-ink dark:text-zinc-100">Remove {label} from your paths? Verses you&apos;ve memorized stay in your reviews.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRemoving(false)} className="min-h-11 flex-1 rounded-full bg-sand-200 text-[14px] font-extrabold text-ink dark:bg-zinc-800 dark:text-zinc-100">
                Keep it
              </button>
              <button type="button" onClick={remove} className="min-h-11 flex-1 rounded-full bg-heart-600 text-[14px] font-extrabold text-white">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setRemoving(true)} className="min-h-11 text-[14px] font-extrabold text-heart-600">
            Remove this path
          </button>
        )}
      </motion.div>
    </div>
  );
}

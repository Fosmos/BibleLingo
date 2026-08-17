"use client";

import { motion } from "framer-motion";
import { useProgressStore } from "@/store/useProgressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { AUTH_REQUIRED } from "@/lib/authConfig";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { StreakFreezeBadge } from "@/components/gamification/StreakFreezeBadge";
import { ShekelCounter } from "@/components/gamification/ShekelCounter";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { TAP_SCALE } from "@/lib/motionTokens";

export default function ProfilePage() {
  const longestStreak = useProgressStore((state) => state.streak.longestStreak);
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  const setIncludeVerseReferences = useProgressStore((state) => state.setIncludeVerseReferences);
  const username = useAuthStore((state) => state.accounts.find((account) => account.id === state.currentUserId)?.username);
  const signOut = useAuthStore((state) => state.signOut);

  function handleReset() {
    if (!window.confirm("Reset all progress? This can't be undone.")) return;
    resetProgress();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-title">Profile</h1>
        {AUTH_REQUIRED && username && <span className="text-sm text-ink-muted">Signed in as {username}</span>}
      </div>

      <div className="rounded-2xl border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">Stats</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-ink-muted">Current streak</span>
            <div className="flex items-center gap-2">
              <StreakCounter showInfo />
              <StreakFreezeBadge showInfo />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-ink-muted">Longest streak</span>
            <span className="text-sm font-semibold text-ink-soft dark:text-zinc-300">{longestStreak} days</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-ink-muted">Shekels</span>
            <ShekelCounter showInfo />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">Settings</p>
        <div className="mt-3 flex items-start gap-1.5">
          <ToggleSwitch
            checked={includeVerseReferences}
            onChange={setIncludeVerseReferences}
            label="Include verse references"
            description={'Show "1:1" before each verse, e.g. "1:1 Paul and Timotheus..."'}
          />
          <InfoTip text={INFO_TIPS.includeVerseReferencesToggle} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={handleReset}
            className="rounded-full border border-heart-500 px-4 py-2 text-sm font-semibold text-heart-600"
          >
            Reset all progress
          </motion.button>
          <InfoTip text={INFO_TIPS.resetProgressButton} />
          {AUTH_REQUIRED && (
            <>
              <motion.button
                type="button"
                whileTap={TAP_SCALE}
                onClick={signOut}
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-soft dark:border-zinc-700 dark:text-zinc-300"
              >
                Sign Out
              </motion.button>
              <InfoTip text={INFO_TIPS.signOutButton} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Settings2, UserRound } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { LOCAL_USER_ID } from "@/lib/authConfig";
import { ProfileStatsCard } from "@/components/gamification/ProfileStatsCard";
import { ProfileAdvancedSettings } from "@/components/gamification/ProfileAdvancedSettings";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { InfoTip } from "@/components/ui/InfoTip";
import { PageHeading } from "@/components/ui/PageHeading";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { TAP_SCALE } from "@/lib/motionTokens";

export default function ProfilePage() {
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  const setIncludeVerseReferences = useProgressStore((state) => state.setIncludeVerseReferences);
  const currentUserId = useAuthStore((state) => state.currentUserId);
  const username = useAuthStore((state) => state.currentUsername);
  const signOut = useAuthStore((state) => state.signOut);
  // The anonymous local profile (lib/authConfig.ts's LOCAL_USER_ID) is always available with
  // no sign-in — a "real" account is opt-in on top of it, created/entered from /sign-in.
  const isRealAccount = currentUserId !== null && currentUserId !== LOCAL_USER_ID;

  function handleReset() {
    if (!window.confirm("Reset all progress? This can't be undone.")) return;
    resetProgress();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-4">
      <div className="flex items-center justify-between">
        <PageHeading kicker="Account">Profile</PageHeading>
        {isRealAccount && username && <span className="text-sm text-ink-muted">Signed in as {username}</span>}
      </div>

      <ProfileStatsCard />

      <div className="rounded-2xl bg-brand-50 p-5 shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <Settings2 size={15} />
          </span>
          <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">Settings</p>
        </div>
        <div className="mt-4 flex items-start gap-1.5">
          <ToggleSwitch
            checked={includeVerseReferences}
            onChange={setIncludeVerseReferences}
            label="Include verse references"
            description={'Show "1:1" before each verse, e.g. "1:1 Paul and Timotheus..."'}
          />
          <InfoTip text={INFO_TIPS.includeVerseReferencesToggle} />
        </div>
      </div>

      <ProfileAdvancedSettings />

      <div className="rounded-2xl bg-brand-50 p-5 shadow-sm dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
            <UserRound size={15} />
          </span>
          <p className="text-caption font-semibold uppercase tracking-wide text-brand-500">Account</p>
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
          {isRealAccount ? (
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
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-soft dark:border-zinc-700 dark:text-zinc-300"
              >
                Sign In
              </Link>
              <InfoTip text={INFO_TIPS.signInButton} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

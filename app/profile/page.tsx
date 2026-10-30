"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useProgressStore } from "@/store/useProgressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { LOCAL_USER_ID } from "@/lib/authConfig";
import { ProfileStatsCard } from "@/components/gamification/ProfileStatsCard";
import { RankCard } from "@/components/gamification/RankCard";
import { SleepTimerCard } from "@/components/gamification/SleepTimerCard";
import { ProfileAdvancedSettings } from "@/components/gamification/ProfileAdvancedSettings";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { InfoTip } from "@/components/ui/InfoTip";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { TAP_SCALE } from "@/lib/motionTokens";

const SECONDARY_PILL =
  "rounded-full border border-line px-[18px] py-[11px] text-[15px] font-semibold text-ink hover:bg-ink/[.07] dark:border-zinc-700 dark:text-zinc-200";

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

  // The avatar's letter — the account's username, or a plain "Y" ("you") for the local profile.
  const initial = (isRealAccount && username ? username : "You").charAt(0).toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-[22px] p-4">
      <div className="flex items-center gap-3.5">
        <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-sage-300 font-heading text-[26px] text-sage-900 dark:bg-sage-800 dark:text-sage-100">
          {initial}
        </span>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[30px] leading-[1.05] text-ink dark:text-zinc-100">Profile</h1>
          <span className="text-sm text-ink-muted">{isRealAccount && username ? `Signed in as ${username}` : "On this device"}</span>
        </div>
      </div>

      <ProfileStatsCard />

      <RankCard />

      <SleepTimerCard />

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[22px] text-ink dark:text-zinc-100">Settings</h2>
        <div className="rounded-organic bg-sand-100 px-[18px] py-1.5 dark:bg-zinc-900">
          <div className="flex items-start gap-1.5 py-3">
            <div className="flex-1">
              <ToggleSwitch
                checked={includeVerseReferences}
                onChange={setIncludeVerseReferences}
                label="Include verse references"
                description={'Show "1:1" before each verse, e.g. "1:1 Paul and Timotheus..."'}
              />
            </div>
            <InfoTip text={INFO_TIPS.includeVerseReferencesToggle} />
          </div>
        </div>
        <ProfileAdvancedSettings />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[22px] text-ink dark:text-zinc-100">Account</h2>
        <div className="flex flex-wrap items-center gap-2">
          {isRealAccount ? (
            <motion.button type="button" whileTap={TAP_SCALE} onClick={signOut} className={SECONDARY_PILL}>
              Sign Out
            </motion.button>
          ) : (
            <Link href="/sign-in" className={SECONDARY_PILL}>
              Sign In
            </Link>
          )}
          <InfoTip text={isRealAccount ? INFO_TIPS.signOutButton : INFO_TIPS.signInButton} />
          <motion.button
            type="button"
            whileTap={TAP_SCALE}
            onClick={handleReset}
            className="rounded-full border-[1.5px] border-brand-400 px-[18px] py-[11px] text-[15px] font-semibold text-brand-800 hover:bg-brand-100 dark:text-brand-300 dark:hover:bg-zinc-800"
          >
            Reset all progress
          </motion.button>
          <InfoTip text={INFO_TIPS.resetProgressButton} />
        </div>
      </section>
    </div>
  );
}

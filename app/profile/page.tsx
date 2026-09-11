"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Settings2, UserRound } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { useAuthStore } from "@/store/useAuthStore";
import { LOCAL_USER_ID } from "@/lib/authConfig";
import { ProfileStatsCard } from "@/components/gamification/ProfileStatsCard";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { InfoTip } from "@/components/ui/InfoTip";
import { PageHeading } from "@/components/ui/PageHeading";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { TAP_SCALE } from "@/lib/motionTokens";

export default function ProfilePage() {
  const resetProgress = useProgressStore((state) => state.resetProgress);
  const includeVerseReferences = useProgressStore((state) => state.includeVerseReferences);
  const setIncludeVerseReferences = useProgressStore((state) => state.setIncludeVerseReferences);
  const buildingViewEnabled = useProgressStore((state) => state.buildingViewEnabled);
  const setBuildingViewEnabled = useProgressStore((state) => state.setBuildingViewEnabled);
  const pegSystemEnabled = useProgressStore((state) => state.pegSystemEnabled);
  const setPegSystemEnabled = useProgressStore((state) => state.setPegSystemEnabled);
  const pericopeHeadingRecallEnabled = useProgressStore((state) => state.pericopeHeadingRecallEnabled);
  const setPericopeHeadingRecallEnabled = useProgressStore((state) => state.setPericopeHeadingRecallEnabled);
  const understandStageEnabled = useProgressStore((state) => state.understandStageEnabled);
  const setUnderstandStageEnabled = useProgressStore((state) => state.setUnderstandStageEnabled);
  const visualizeStageEnabled = useProgressStore((state) => state.visualizeStageEnabled);
  const setVisualizeStageEnabled = useProgressStore((state) => state.setVisualizeStageEnabled);
  const writeFirstLetterStageEnabled = useProgressStore((state) => state.writeFirstLetterStageEnabled);
  const setWriteFirstLetterStageEnabled = useProgressStore((state) => state.setWriteFirstLetterStageEnabled);
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
        <div className="mt-3 flex items-start gap-1.5">
          <ToggleSwitch
            checked={buildingViewEnabled}
            onChange={setBuildingViewEnabled}
            label="Building path view"
            description="Add free-text location tags at whichever scopes you pick (book, chapter, section, or verse) — no suggestions, just your own words"
          />
          <InfoTip text={INFO_TIPS.buildingViewToggle} />
        </div>
        <div className="mt-3 flex items-start gap-1.5">
          <ToggleSwitch
            checked={understandStageEnabled}
            onChange={setUnderstandStageEnabled}
            label="Understand stage"
            description="A clause-tagging step at the start of each Learn day — tap words apart into clauses and color-tag their role before drilling into them"
          />
          <InfoTip text={INFO_TIPS.understandStageToggle} />
        </div>
        <div className="mt-3 flex items-start gap-1.5">
          <ToggleSwitch
            checked={visualizeStageEnabled}
            onChange={setVisualizeStageEnabled}
            label="Visualize stage"
            description="A Loci/Peg + Who/Action/scene step at the start of each Learn day — build a vivid mental picture before drilling into the verse"
          />
          <InfoTip text={INFO_TIPS.visualizeStageToggle} />
        </div>
        <div className="mt-3 flex items-start gap-1.5">
          <ToggleSwitch
            checked={writeFirstLetterStageEnabled}
            onChange={setWriteFirstLetterStageEnabled}
            label="Write First Letter stage"
            description="A handwriting-recognition canvas during each verse's Learn stages — draw each word's first letter, punctuation mark, or verse number"
          />
          <InfoTip text={INFO_TIPS.writeFirstLetterStageToggle} />
        </div>
        <div className="mt-3 flex items-start gap-1.5">
          <ToggleSwitch
            checked={pegSystemEnabled}
            onChange={setPegSystemEnabled}
            label="Peg system"
            description="Recommended for memorizing books — suggests a peg-system word for each verse number in the Visualize stage"
          />
          <InfoTip text={INFO_TIPS.pegSystemToggle} />
        </div>
        {pegSystemEnabled && (
          <Link href="/profile/peg-system" className="mt-2 self-start text-sm font-medium text-brand-600 hover:underline">
            Learn the system →
          </Link>
        )}
        <div className="mt-3 flex items-start gap-1.5">
          <ToggleSwitch
            checked={pericopeHeadingRecallEnabled}
            onChange={setPericopeHeadingRecallEnabled}
            label="Recite section headings in review"
            description="When reviewing a verse group that opens a new section, type its heading by first letter before the verse — doesn't count against accuracy"
          />
          <InfoTip text={INFO_TIPS.pericopeHeadingRecallToggle} />
        </div>
      </div>

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

"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { useProgressStore } from "@/store/useProgressStore";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { ThresholdSlider } from "@/components/ui/ThresholdSlider";
import { RestDayPicker } from "@/components/ui/RestDayPicker";
import { VespersHourPicker } from "@/components/ui/VespersHourPicker";
import { Disclosure } from "@/components/ui/Disclosure";
import { InfoTip } from "@/components/ui/InfoTip";
import { LearnStageToggles } from "@/components/gamification/LearnStageToggles";
import { INFO_TIPS } from "@/lib/infoTipCopy";
import { PROMOTION_ACCURACY_THRESHOLD } from "@/lib/srs";

// Split out of app/profile/page.tsx purely to keep that file under this codebase's 200-line
// cap — and to group every less-common/power-user setting (Memory Palace, the Peg system,
// individual Learn-stage toggles, review thresholds) behind one collapsed-by-default
// disclosure, so the main Profile screen reads as a short, calm page rather than a wall of
// toggles. Nothing here is removed or behaves differently — it's
// the exact same settings, just not competing for attention by default.
export function ProfileAdvancedSettings() {
  const buildingViewEnabled = useProgressStore((state) => state.buildingViewEnabled);
  const setBuildingViewEnabled = useProgressStore((state) => state.setBuildingViewEnabled);
  const pegSystemEnabled = useProgressStore((state) => state.pegSystemEnabled);
  const setPegSystemEnabled = useProgressStore((state) => state.setPegSystemEnabled);
  const srsSpeakModeEnabled = useProgressStore((state) => state.srsSpeakModeEnabled);
  const setSrsSpeakModeEnabled = useProgressStore((state) => state.setSrsSpeakModeEnabled);
  const srsPromotionThreshold = useProgressStore((state) => state.srsPromotionThreshold) ?? PROMOTION_ACCURACY_THRESHOLD;
  const setSrsPromotionThreshold = useProgressStore((state) => state.setSrsPromotionThreshold);
  const restDayOfWeek = useProgressStore((state) => state.restDayOfWeek) ?? null;
  const setRestDayOfWeek = useProgressStore((state) => state.setRestDayOfWeek);
  const vespersHour = useProgressStore((state) => state.vespersHour);
  const setVespersHour = useProgressStore((state) => state.setVespersHour);

  return (
    <Disclosure
      label="Advanced"
      description="Memory Palace, the Peg system, individual Learn stages, and review tuning"
      icon={Settings2}
    >
      <div className="flex items-start gap-1.5">
        <ToggleSwitch
          checked={buildingViewEnabled}
          onChange={setBuildingViewEnabled}
          label="Building path view"
          description="Add free-text location tags at whichever scopes you pick (book, chapter, section, or verse) — no suggestions, just your own words"
        />
        <InfoTip text={INFO_TIPS.buildingViewToggle} />
      </div>
      <LearnStageToggles />
      <div>
        <div className="flex items-start gap-1.5">
          <ToggleSwitch
            checked={pegSystemEnabled}
            onChange={setPegSystemEnabled}
            label="Peg system"
            description="Recommended for memorizing books — suggests a peg-system word for each verse number in the Visualize stage"
          />
          <InfoTip text={INFO_TIPS.pegSystemToggle} />
        </div>
        {pegSystemEnabled && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/profile/peg-system" className="self-start text-sm font-medium text-brand-600 hover:underline">
              Learn the system →
            </Link>
            <Link href="/profile/peg-list" className="self-start text-sm font-medium text-brand-600 hover:underline">
              Edit peg words →
            </Link>
          </div>
        )}
      </div>
      <div className="flex items-start gap-1.5">
        <ToggleSwitch
          checked={srsSpeakModeEnabled}
          onChange={setSrsSpeakModeEnabled}
          label="Speak SRS reviews aloud"
          description="Review by reciting each verse instead of typing it — words reveal as you say them"
        />
        <InfoTip text={INFO_TIPS.srsSpeakModeToggle} />
      </div>
      <div className="flex items-start gap-1.5">
        <div className="flex-1">
          <ThresholdSlider
            value={srsPromotionThreshold}
            onChange={setSrsPromotionThreshold}
            label="SRS promotion threshold"
            description="How high a review's accuracy must be to move a verse group up a Sword of the Spirit box instead of dropping it back one box"
          />
        </div>
        <InfoTip text={INFO_TIPS.srsPromotionThresholdSlider} />
      </div>
      <div className="flex items-start gap-1.5">
        <div className="flex-1">
          <p className="text-sm font-medium text-ink dark:text-zinc-200">Weekly rest day</p>
          <p className="mb-2 text-xs text-ink-muted">A day off streaks and SRS due-dates don&apos;t pressure you on</p>
          <RestDayPicker value={restDayOfWeek} onChange={setRestDayOfWeek} />
        </div>
        <InfoTip text={INFO_TIPS.restDayPicker} />
      </div>
      <div className="flex items-start gap-1.5">
        <div className="flex-1">
          <p className="text-sm font-medium text-ink dark:text-zinc-200">Evening Vespers mode</p>
          <p className="mb-2 text-xs text-ink-muted">A quiet, warm-toned home-screen prompt to review before bed</p>
          <VespersHourPicker value={vespersHour} onChange={setVespersHour} />
        </div>
        <InfoTip text={INFO_TIPS.vespersHourPicker} />
      </div>
    </Disclosure>
  );
}

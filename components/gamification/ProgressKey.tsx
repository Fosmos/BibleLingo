import { Check } from "lucide-react";
import { KEY_SHADES, type TileLevel } from "@/lib/bibleProgress";
import { SEAL_TIERS } from "@/lib/srsSeals";
import { SrsSeal } from "@/components/ui/SrsSeal";

interface ProgressKeyProps {
  level: TileLevel;
}

// The key under the groups: the shade ramp, then Memorized, Due and You're here, then the six
// spaced-review seals (Box 1 → 6) a finished book or chapter, or a verse in review, wears.
export function ProgressKey({ level }: ProgressKeyProps) {
  const steps = level === "book" ? ["1", "2+", "5+", "15+", "whole book"] : ["1", "2+", "5+", "10+", "whole chapter"];
  return (
    <div className="flex flex-col gap-2 px-1 text-[11px] font-extrabold text-sand-700 dark:text-zinc-400">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        {steps.map((step, index) => (
          <span key={step} className="flex items-center gap-1">
            {/* The whole book / chapter swatch shares the top shade, marked by the check it gets. */}
            <span className={`flex h-3 w-3 items-center justify-center rounded-full ${KEY_SHADES[level][index]}`}>
              {index === steps.length - 1 && <Check size={8} strokeWidth={3.5} />}
            </span>
            {step}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-sage-600" />
          Memorized
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-brand-500" />
          Due
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full shadow-[0_0_0_1.5px_#FEFDFB,0_0_0_3px_#201E1D] dark:shadow-[0_0_0_1.5px_#18181b,0_0_0_3px_#f4f4f5]" />
          You&apos;re here
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        {SEAL_TIERS.map((seal, index) => (
          <span key={seal.name} className="flex items-center gap-1">
            <SrsSeal tier={index + 1} size={14} />
            {seal.name}
          </span>
        ))}
      </div>
    </div>
  );
}

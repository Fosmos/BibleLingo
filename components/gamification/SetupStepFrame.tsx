import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface SetupStepFrameProps {
  step: number;
  steps: number;
  title: string;
  question?: string;
  sub?: string;
  onBack: () => void;
  // The pinned button; omitted for a step with its own (Learn intensity, starting point).
  cta?: { label: string; onClick: () => void; disabled?: boolean };
  children: ReactNode;
}

// One step of the new-path setup (design_handoff_path_picker → Setup): back, a segment per step,
// "Step n of N · path", the question and its options, and the pinned button.
export function SetupStepFrame({ step, steps, title, question, sub, onBack, cta, children }: SetupStepFrameProps) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <div className="flex flex-1 flex-col gap-4 px-[18px] pb-[120px] pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Back" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FEFDFB] text-ink shadow-organic-sm dark:bg-zinc-900 dark:text-zinc-100">
            <ArrowLeft size={20} strokeWidth={2.75} />
          </button>
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: steps }, (_, index) => (
              <span key={index} className={`h-2 flex-1 rounded-full ${index <= step ? "bg-sage-600" : "bg-sand-200 dark:bg-zinc-800"}`} />
            ))}
          </div>
        </div>
        <span className="text-xs font-extrabold uppercase tracking-[.08em] text-sage-800 dark:text-sage-300">
          Step {step + 1} of {steps} · {title}
        </span>
        {question && <h1 className="font-heading text-[36px] leading-[1.02] text-ink [text-wrap:balance] dark:text-zinc-100">{question}</h1>}
        {sub && <p className="-mt-2 text-sm font-bold text-sand-700 dark:text-zinc-400">{sub}</p>}
        <div className="flex flex-col gap-2.5">{children}</div>
      </div>
      {cta && (
        <div className="fixed inset-x-4 bottom-[calc(1.4rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-md">
          <button type="button" onClick={cta.onClick} disabled={cta.disabled} className="w-full truncate rounded-full bg-brand-500 px-[22px] py-[17px] text-base font-extrabold text-white shadow-[0_6px_0_#8C491A] hover:bg-brand-600 disabled:opacity-45">
            {cta.label}
          </button>
        </div>
      )}
    </div>
  );
}

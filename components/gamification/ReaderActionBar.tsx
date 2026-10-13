import { ACTION_WORD, STATUS_LABEL, type VerseStatus } from "@/lib/readerVerseStatus";

interface ReaderActionBarProps {
  reference: string;
  status: VerseStatus;
  note: string;
  onAction: () => void;
}

const PILL_CLASS: Record<VerseStatus, string> = {
  due: "bg-brand-100 text-brand-900",
  rooted: "bg-sage-100 text-sage-900",
  growing: "bg-sage-100 text-sage-900",
  current: "",
  open: "bg-sand-200 text-sand-800",
};

// The chapter reader's bar pinned to the bottom: the selected verse's reference and status
// ("Due · 3 days overdue" — kept here so selecting a verse never moves its text), and its one
// action: Learn, Review or Practise.
export function ReaderActionBar({ reference, status, note, onAction }: ReaderActionBarProps) {
  return (
    <div className="absolute inset-x-3 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-[5] flex items-center gap-3 rounded-full bg-ink py-2 pl-5 pr-2 text-paper shadow-organic-lg dark:bg-zinc-100 dark:text-zinc-900">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-heading text-[17px] leading-tight">{reference}</span>
        {status !== "current" && (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={`whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-extrabold ${PILL_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
            <span className="truncate text-xs font-bold opacity-75">{note}</span>
          </span>
        )}
      </div>
      <button type="button" onClick={onAction} className="whitespace-nowrap rounded-full bg-brand-500 px-[22px] py-[11px] text-sm font-extrabold text-white hover:bg-brand-600">
        {ACTION_WORD[status]}
      </button>
    </div>
  );
}

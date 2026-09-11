import { StickerBook } from "@/components/gamification/StickerBook";
import { InfoTip } from "@/components/ui/InfoTip";
import { PageHeading } from "@/components/ui/PageHeading";
import { INFO_TIPS } from "@/lib/infoTipCopy";

export default function StickersPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-6 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <PageHeading kicker="Collection" className="flex flex-col items-center">
          <span className="flex items-center gap-1.5">
            Sticker Book <InfoTip text={INFO_TIPS.stickerBook} />
          </span>
        </PageHeading>
        <p className="text-ink-muted">Chapters you&apos;ve fully memorized.</p>
      </div>
      <StickerBook />
    </div>
  );
}

import { Award } from "lucide-react";
import { MemorizedStats } from "@/components/gamification/MemorizedStats";
import { SrsOverview } from "@/components/gamification/SrsOverview";
import { SwordOfTheSpirit } from "@/components/gamification/SwordOfTheSpirit";
import { ProblemVersesBin } from "@/components/gamification/ProblemVersesBin";
import { StumbleMapsSection } from "@/components/gamification/StumbleMapsSection";
import { AddMemorizedVerseFlow } from "@/components/gamification/AddMemorizedVerseFlow";
import { Button } from "@/components/ui/Button";
import { PageHeading } from "@/components/ui/PageHeading";

export default function MemorizedPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-4">
      <div className="flex items-center justify-between gap-3">
        <PageHeading kicker="Your Progress">Memorized Verses</PageHeading>
        <Button href="/stickers" variant="secondary" className="flex items-center gap-1.5">
          <Award size={16} /> Sticker Book
        </Button>
      </div>
      <MemorizedStats />
      <SrsOverview />
      <SwordOfTheSpirit />
      <ProblemVersesBin />
      <StumbleMapsSection />
      <AddMemorizedVerseFlow />
    </div>
  );
}

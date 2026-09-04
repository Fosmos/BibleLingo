import { Award } from "lucide-react";
import { MemorizedStats } from "@/components/gamification/MemorizedStats";
import { SrsOverview } from "@/components/gamification/SrsOverview";
import { SwordOfTheSpirit } from "@/components/gamification/SwordOfTheSpirit";
import { ProblemVersesBin } from "@/components/gamification/ProblemVersesBin";
import { AddMemorizedVerseFlow } from "@/components/gamification/AddMemorizedVerseFlow";
import { Button } from "@/components/ui/Button";

export default function MemorizedPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-title">Memorized Verses</h1>
        <Button href="/stickers" variant="secondary" className="flex items-center gap-1.5">
          <Award size={16} /> Sticker Book
        </Button>
      </div>
      <MemorizedStats />
      <SrsOverview />
      <SwordOfTheSpirit />
      <ProblemVersesBin />
      <AddMemorizedVerseFlow />
    </div>
  );
}

import { Award } from "lucide-react";
import { MemorizedStats } from "@/components/gamification/MemorizedStats";
import { MemorizedHealthList } from "@/components/gamification/MemorizedHealthList";
import { WhereYouStumble } from "@/components/gamification/WhereYouStumble";
import { AddMemorizedVerseFlow } from "@/components/gamification/AddMemorizedVerseFlow";
import { Button } from "@/components/ui/Button";
import { PageHeading } from "@/components/ui/PageHeading";

export default function MemorizedPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-7 p-4">
      <div className="flex items-center justify-between gap-3">
        <PageHeading kicker="Your progress">Memorized</PageHeading>
        <Button href="/stickers" variant="secondary" className="!inline-flex items-center gap-1.5">
          <Award size={16} strokeWidth={2.75} /> Sticker Book
        </Button>
      </div>
      <MemorizedStats />
      <MemorizedHealthList />
      <WhereYouStumble />
      <AddMemorizedVerseFlow />
    </div>
  );
}

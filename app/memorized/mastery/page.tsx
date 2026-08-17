import { Header } from "@/components/gamification/Header";
import { MasteryModeSession } from "@/components/gamification/MasteryModeSession";

export default function MasteryModePage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="mx-auto w-full max-w-2xl p-6">
        <MasteryModeSession />
      </div>
    </div>
  );
}

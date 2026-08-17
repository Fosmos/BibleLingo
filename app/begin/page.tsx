import { Header } from "@/components/gamification/Header";
import { BeginFlow } from "@/components/gamification/BeginFlow";

export default function BeginMemorizingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col items-center p-8">
        <BeginFlow />
      </div>
    </div>
  );
}

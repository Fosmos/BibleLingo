import { Header } from "@/components/gamification/Header";
import { SrsReviewSession } from "@/components/gamification/SrsReviewSession";

export default function SrsReviewPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <SrsReviewSession />
    </div>
  );
}

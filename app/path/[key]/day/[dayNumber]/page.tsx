import { Header } from "@/components/gamification/Header";
import { DayLoader } from "@/components/gamification/DayLoader";
import { PageHeading } from "@/components/ui/PageHeading";
import { resolvePathLabel } from "@/lib/memorizationContent";

export default async function PathDayPage({ params }: PageProps<"/path/[key]/day/[dayNumber]">) {
  const { key, dayNumber } = await params;
  const decodedKey = decodeURIComponent(key);
  const day = Number(dayNumber);
  const label = resolvePathLabel(decodedKey);

  if (!label) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <PageHeading>Path not found</PageHeading>
        <p className="text-ink-muted">No memorization content exists yet for this selection.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <DayLoader pathKey={decodedKey} label={label} dayNumber={day} />
    </div>
  );
}

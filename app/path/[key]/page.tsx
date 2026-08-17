import { Header } from "@/components/gamification/Header";
import { PathOverviewScreen } from "@/components/gamification/PathOverviewScreen";
import { resolvePathLabel } from "@/lib/memorizationContent";

export default async function PathOverviewPage({ params, searchParams }: PageProps<"/path/[key]">) {
  const { key } = await params;
  const { version, versesPerDay } = await searchParams;
  const decodedKey = decodeURIComponent(key);
  const resolvedVersion = (Array.isArray(version) ? version[0] : version) ?? "KJV";
  const versesPerDayParam = Array.isArray(versesPerDay) ? versesPerDay[0] : versesPerDay;
  const resolvedVersesPerDay = versesPerDayParam ? Number(versesPerDayParam) : undefined;
  const label = resolvePathLabel(decodedKey);

  if (!label) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-title">Path not found</h1>
        <p className="text-ink-muted">No memorization content exists yet for this selection.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <PathOverviewScreen
        pathKey={decodedKey}
        label={label}
        version={resolvedVersion}
        versesPerDay={resolvedVersesPerDay}
      />
    </div>
  );
}

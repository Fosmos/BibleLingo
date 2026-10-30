import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The Palace tab's Walk view: a ready-made building turned wall by wall like a book (PalaceBookScreen.tsx).
export default async function PalaceWalkPage({ params, searchParams }: PageProps<"/path/[key]/palacewalk">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="palacewalk" />;
}

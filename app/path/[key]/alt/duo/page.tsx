import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The Duolingo-style path, one of the other path views: a zigzag of verse nodes in units (DuoPathScreen.tsx).
export default async function DuoPathPage({ params, searchParams }: PageProps<"/path/[key]/alt/duo">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="duo" />;
}

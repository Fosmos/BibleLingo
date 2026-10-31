import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The Verses list, one of the other path views (VersesScreen.tsx).
export default async function VersesViewPage({ params, searchParams }: PageProps<"/path/[key]/alt/verses">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="verses" />;
}

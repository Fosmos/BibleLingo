import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The Palace tab: the active path's book as a memory palace, a picture for every verse (BookStructureScreen.tsx).
export default async function PalaceTabPage({ params, searchParams }: PageProps<"/path/[key]/palace">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="palace" />;
}

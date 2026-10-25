import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The Palace tab: the active path's lessons as a Duolingo path, a picture for every verse (DuoPathScreen.tsx).
export default async function PalaceTabPage({ params, searchParams }: PageProps<"/path/[key]/palace">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="palace" />;
}

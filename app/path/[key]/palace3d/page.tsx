import { PathOverviewPage } from "@/components/gamification/PathOverviewPage";

// The experimental 3D tab: a memory palace you build and walk through (Palace3DScreen.tsx).
export default async function Palace3DTabPage({ params, searchParams }: PageProps<"/path/[key]/palace3d">) {
  const { key } = await params;
  return <PathOverviewPage pathKey={key} searchParams={await searchParams} view="palace3d" />;
}

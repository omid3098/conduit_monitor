import { ServerDetailView } from "@/components/server-detail/server-detail-view";

interface ServerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ServerDetailPage({
  params,
}: ServerDetailPageProps) {
  const { id } = await params;

  return <ServerDetailView serverId={id} />;
}

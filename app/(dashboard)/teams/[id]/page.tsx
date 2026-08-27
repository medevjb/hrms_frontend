import { TeamDetail } from "@/features/organization/TeamDetail";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TeamDetail teamId={Number(id)} />;
}

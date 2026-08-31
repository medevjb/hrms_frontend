import { RoleDetail } from "@/features/roles/RoleDetail";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RoleDetail roleId={Number(id)} />;
}

import { DepartmentDetail } from "@/features/organization/DepartmentDetail";

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DepartmentDetail departmentId={Number(id)} />;
}

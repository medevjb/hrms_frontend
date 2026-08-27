import { EmployeeDetail } from "@/features/employees/EmployeeDetail";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <EmployeeDetail employeeId={Number(id)} />;
}

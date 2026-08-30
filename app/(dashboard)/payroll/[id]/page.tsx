import { PayrollPeriodDetail } from "@/features/payroll/PayrollPeriodDetail";

export default async function PayrollPeriod({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PayrollPeriodDetail periodId={Number(id)} />;
}

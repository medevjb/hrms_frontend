import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import type { EmployeeStatus } from "@/types/organization";

const TONES: Record<EmployeeStatus, StatusTone> = {
  INVITED: "neutral",
  ACTIVE: "success",
  PROBATION: "warning",
  NOTICE_PERIOD: "warning",
  SUSPENDED: "danger",
  RESIGNED: "warning",
  TERMINATED: "danger",
  ARCHIVED: "neutral",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return <StatusChip tone={TONES[status]}>{status.replace("_", " ")}</StatusChip>;
}

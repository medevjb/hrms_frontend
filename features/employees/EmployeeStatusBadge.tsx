import { Badge } from "@mantine/core";
import type { EmployeeStatus } from "@/types/organization";

const COLORS: Record<EmployeeStatus, string> = {
  INVITED: "gray",
  ACTIVE: "green",
  PROBATION: "yellow",
  NOTICE_PERIOD: "orange",
  SUSPENDED: "red",
  RESIGNED: "orange",
  TERMINATED: "red",
  ARCHIVED: "gray",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Badge color={COLORS[status]} variant="light">
      {status.replace("_", " ")}
    </Badge>
  );
}

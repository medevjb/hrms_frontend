"use client";

import { CalendarClockIcon } from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import { useLeaveBalances } from "@/services/leave";

const TONES = ["violet", "emerald", "blue", "amber", "rose"] as const;

export function LeaveBalancesSummary() {
  const { data: balances, isLoading } = useLeaveBalances();

  if (isLoading || !balances || balances.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {balances.map((balance, index) => (
        <StatTile
          key={balance.id}
          label={balance.leave_type.name}
          value={balance.balance}
          icon={CalendarClockIcon}
          tone={TONES[index % TONES.length]}
        />
      ))}
    </div>
  );
}

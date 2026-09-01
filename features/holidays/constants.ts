import type { HolidayType } from "@/types/holidays";

// Shared holiday-type presentation, used by both the calendar and the list
// so a type's colour, label, and badge style stay in sync.

export const HOLIDAY_TYPE_LABEL: Record<HolidayType, string> = {
  NATIONAL: "National",
  RELIGIOUS: "Religious",
  COMPANY: "Company",
  OTHER: "Other",
};

export const HOLIDAY_TYPE_DOT: Record<HolidayType, string> = {
  NATIONAL: "bg-blue-500",
  RELIGIOUS: "bg-purple-500",
  COMPANY: "bg-teal-500",
  OTHER: "bg-gray-400",
};

// Tinted pill used for an event inside a calendar day cell.
export const HOLIDAY_TYPE_CHIP: Record<HolidayType, string> = {
  NATIONAL: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  RELIGIOUS: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  COMPANY: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  OTHER: "bg-gray-500/10 text-gray-600 dark:text-gray-300",
};

export const HOLIDAY_TYPE_BADGE: Record<HolidayType, "default" | "secondary" | "outline"> = {
  NATIONAL: "default",
  RELIGIOUS: "secondary",
  COMPANY: "outline",
  OTHER: "outline",
};

export const HOLIDAY_TYPE_LEGEND: { type: HolidayType; label: string }[] = (
  ["NATIONAL", "RELIGIOUS", "COMPANY", "OTHER"] as const
).map((type) => ({ type, label: HOLIDAY_TYPE_LABEL[type] }));

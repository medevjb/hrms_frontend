// Mirrors backend/app/Enums/HolidayType.php and HolidayResource.php.

export type HolidayType = "NATIONAL" | "RELIGIOUS" | "COMPANY" | "OTHER";

export type Holiday = {
  id: number;
  title: string;
  date: string;
  type: HolidayType;
  description: string | null;
  office_location: string | null;
  active: boolean;
};

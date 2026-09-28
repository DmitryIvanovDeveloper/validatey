export type ScheduleFrequency = "once" | "daily" | "weekly";

export const SCHEDULE_FREQUENCIES: ScheduleFrequency[] = ["once", "daily", "weekly"];

export function isScheduleFrequency(value: string): value is ScheduleFrequency {
  return SCHEDULE_FREQUENCIES.includes(value as ScheduleFrequency);
}

import { clsx, type ClassValue } from "clsx";
import { addDays, addWeeks, differenceInMinutes, format, parseISO, subWeeks } from "date-fns";
import { twMerge } from "tailwind-merge";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateHours(clockIn: string, clockOut: string) {
  if (!clockIn || !clockOut) {
    return 0;
  }

  const start = parseISO(`1970-01-01T${clockIn}:00`);
  const end = parseISO(`1970-01-01T${clockOut}:00`);
  const minutes = differenceInMinutes(end, start);

  if (Number.isNaN(minutes) || minutes <= 0) {
    return 0;
  }

  return Number((minutes / 60).toFixed(2));
}

export function isDateOnlyString(value: string) {
  return DATE_ONLY_PATTERN.test(value);
}

export function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: Date | string, dateFormat = "MMM d, yyyy") {
  const value =
    typeof date === "string" ? (isDateOnlyString(date) ? parseDateOnly(date) : new Date(date)) : date;
  return format(value, dateFormat);
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekStartSaturday(date: Date | string) {
  const value = typeof date === "string" ? parseDateOnly(date) : new Date(date);
  const weekStart = new Date(value);
  const day = weekStart.getDay();
  const diff = day >= 6 ? day - 6 : day + 1;
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - diff);
  return weekStart;
}

export function getWeekEndFriday(weekStart: Date | string) {
  return addDays(typeof weekStart === "string" ? parseDateOnly(weekStart) : weekStart, 6);
}

export function getCurrentWeekStart(date = new Date()) {
  return getWeekStartSaturday(date);
}

export function getLastCompletedWeekStart(date = new Date()) {
  return subWeeks(getCurrentWeekStart(date), 1);
}

export function getManagerAllowedWeekStarts(date = new Date()) {
  const latestCompletedWeek = getLastCompletedWeekStart(date);
  return [latestCompletedWeek, subWeeks(latestCompletedWeek, 1)];
}

export function getPayrollPeriodBounds(
  periodType: "WEEKLY" | "BI_WEEKLY",
  start: string | Date,
) {
  const periodStart = getWeekStartSaturday(start);
  const periodEnd = addDays(periodStart, periodType === "BI_WEEKLY" ? 13 : 6);

  return {
    from: formatLocalDate(periodStart),
    to: formatLocalDate(periodEnd),
  };
}

export function getWeekOptions(
  count: number,
  startDate = new Date(),
  includeCurrentWeek = true,
) {
  const baseWeek = includeCurrentWeek ? getCurrentWeekStart(startDate) : getLastCompletedWeekStart(startDate);

  return Array.from({ length: count }, (_, index) => {
    const weekStart = subWeeks(baseWeek, index);
    const weekEnd = getWeekEndFriday(weekStart);

    return {
      start: formatLocalDate(weekStart),
      end: formatLocalDate(weekEnd),
      label: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
    };
  });
}

export function getWeekOptionsWindow(
  pastCount: number,
  futureCount: number,
  startDate = new Date(),
) {
  const currentWeek = getCurrentWeekStart(startDate);

  return Array.from({ length: pastCount + futureCount + 1 }, (_, index) => {
    const offset = futureCount - index;
    const weekStart = offset >= 0 ? addWeeks(currentWeek, offset) : subWeeks(currentWeek, Math.abs(offset));
    const weekEnd = getWeekEndFriday(weekStart);

    return {
      start: formatLocalDate(weekStart),
      end: formatLocalDate(weekEnd),
      label: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
    };
  }).sort((a, b) => (a.start < b.start ? 1 : -1));
}

export function getPayrollPeriodOptions(
  periodType: "WEEKLY" | "BI_WEEKLY",
  count: number,
  startDate = new Date(),
) {
  const baseWeek = getCurrentWeekStart(startDate);

  return Array.from({ length: count }, (_, index) => {
    const weekStart = subWeeks(baseWeek, index);
    const bounds = getPayrollPeriodBounds(periodType, weekStart);

    return {
      start: bounds.from,
      end: bounds.to,
      label: `${formatDate(bounds.from)} - ${formatDate(bounds.to)}`,
    };
  });
}

export function groupWeekOptionsByMonth(options: Array<{ start: string; end: string; label: string }>) {
  return options.reduce<Array<{ month: string; options: Array<{ start: string; end: string; label: string }> }>>(
    (groups, option) => {
      const month = formatDate(option.end, "MMMM yyyy");
      const existing = groups.find((group) => group.month === month);

      if (existing) {
        existing.options.push(option);
        return groups;
      }

      groups.push({
        month,
        options: [option],
      });

      return groups;
    },
    [],
  );
}

export function isDateInManagerAllowedWeeks(target: string | Date, referenceDate = new Date()) {
  const targetWeekStart = formatLocalDate(getWeekStartSaturday(target));
  return getManagerAllowedWeekStarts(referenceDate)
    .map((weekStart) => formatLocalDate(weekStart))
    .includes(targetWeekStart);
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  const safeName = `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 1))}`;
  return `${safeName}@${domain}`;
}

export function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function roleLabel(role: string) {
  return role
    .split("_")
    .map((segment) => segment[0] + segment.slice(1).toLowerCase())
    .join("-");
}

import { clsx, type ClassValue } from "clsx";
import { differenceInMinutes, format, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

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

export function formatDate(date: Date | string, dateFormat = "MMM d, yyyy") {
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, dateFormat);
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

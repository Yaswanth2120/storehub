import {
  Building2,
  CalendarClock,
  CreditCard,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export const ROLES = {
  OWNER: "OWNER",
  CO_OWNER: "CO_OWNER",
  MANAGER: "MANAGER",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  CO_OWNER: "Co-Owner",
  MANAGER: "Manager",
};

export const NAV_ITEMS = {
  OWNER: [
    { href: "/stores", label: "Stores", icon: Building2 },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/attendance", label: "Attendance", icon: CalendarClock },
    { href: "/users", label: "User Management", icon: ShieldCheck },
    { href: "/payroll", label: "Payroll", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  CO_OWNER: [
    { href: "/stores", label: "Stores", icon: Building2 },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/attendance", label: "Attendance", icon: CalendarClock },
    { href: "/payroll", label: "Payroll", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  MANAGER: [
    { href: "/stores", label: "Stores", icon: Building2 },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/attendance", label: "Attendance", icon: CalendarClock },
  ],
};

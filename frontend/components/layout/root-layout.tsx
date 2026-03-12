"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/frontend/components/layout/sidebar";
import { Header } from "@/frontend/components/layout/header";
import { Dialog, DialogContent } from "@/frontend/components/ui/dialog";

const TITLES: Record<string, string> = {
  "/stores": "Stores",
  "/employees": "Employees",
  "/attendance": "Attendance",
  "/users": "User Management",
  "/payroll": "Payroll",
  "/settings": "Settings",
};

type DashboardLayoutShellProps = {
  children: React.ReactNode;
  user: {
    username: string;
    role: string;
  };
  storeCount: number;
};

export function DashboardLayoutShell({
  children,
  user,
  storeCount,
}: DashboardLayoutShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "StoreHub";

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="left-0 top-0 h-full max-w-xs translate-x-0 translate-y-0 rounded-none border-r p-0">
          <Sidebar role={user.role} mobile onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          title={title}
          user={user}
          storeCount={storeCount}
          onMenuClick={() => setOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
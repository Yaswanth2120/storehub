"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftOpen } from "lucide-react";
import { NAV_ITEMS } from "@/backend/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/frontend/components/ui/button";

type SidebarProps = {
  role: string;
  mobile?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ role, mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS[role as keyof typeof NAV_ITEMS] ?? [];

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar",
        mobile ? "w-full max-w-xs" : "hidden w-72 lg:flex",
      )}
    >
      <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
          S
        </div>
        <div>
          <p className="text-lg font-semibold">StoreHub</p>
          <p className="text-xs text-muted-foreground">Operations command center</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Button variant="outline" className="w-full justify-start gap-2">
          <PanelLeftOpen className="h-4 w-4" />
          {mobile ? "Close menu" : "Navigation"}
        </Button>
      </div>
    </aside>
  );
}

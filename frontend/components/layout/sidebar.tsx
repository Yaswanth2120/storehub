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
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur",
        mobile ? "w-full max-w-xs" : "hidden w-72 lg:flex",
      )}
    >
      <div className="flex h-24 items-center gap-4 border-b border-sidebar-border px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#e9f1ff] text-lg font-semibold text-[#0071e3]">
          S
        </div>
        <div>
          <p className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[#1d1d1f]">StoreHub</p>
          <p className="text-xs text-[#6e6e73]">Operations command center</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium tracking-[-0.01em] transition-all",
                active
                  ? "bg-white text-[#0071e3] shadow-sm"
                  : "text-sidebar-foreground hover:bg-white/80",
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

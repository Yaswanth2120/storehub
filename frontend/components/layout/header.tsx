"use client";

import { signOut } from "next-auth/react";
import { Menu, LogOut } from "lucide-react";
import { ROLE_LABELS } from "@/backend/constants";
import { Avatar, AvatarFallback } from "@/frontend/components/ui/avatar";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";

type HeaderProps = {
  title: string;
  user: {
    username: string;
    role: string;
  };
  storeCount: number;
  onMenuClick: () => void;
};

export function Header({ title, user, storeCount, onMenuClick }: HeaderProps) {
  async function handleLogout() {
    await signOut({ redirect: false });

    if (typeof window !== "undefined") {
      window.location.assign("/login");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-24 items-center justify-between border-b border-white/70 bg-[#f5f5f7]/85 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        <div>
          <h1 className="text-[1.9rem] font-semibold tracking-[-0.03em] text-[#1d1d1f]">{title}</h1>
          <p className="text-sm text-[#6e6e73]">
            Manage your daily operations and access controls.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-[#1d1d1f]">{user.username}</p>
          <p className="text-xs text-[#6e6e73]">
            {storeCount} assigned store(s)
          </p>
        </div>

        <Badge className="rounded-full border border-[#d7d7dc] bg-white px-3 py-1 text-[#4f5f8f]">
          {ROLE_LABELS[user.role] ?? user.role}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto rounded-full p-0">
              <Avatar>
                <AvatarFallback>
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

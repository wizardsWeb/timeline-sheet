"use client";

import { Search } from "lucide-react";
import { RoleBadge } from "@/components/timeline/role-badge";
import { logoutAction } from "@/app/(auth)/actions";
import { NotificationsButton, type Notification } from "./notifications";
import { ThemeToggle } from "./theme-toggle";
import type { Role } from "@prisma/client";

type Props = {
  user: { name: string; email: string; role: Role };
  notifications: Notification[];
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function TopBar({ user, notifications }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/80 backdrop-blur px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search tasks"
            className="h-9 w-[280px] rounded-[10px] border border-border bg-background pl-9 pr-12 text-sm outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationsButton items={notifications} />
        <div className="flex items-center gap-3 rounded-[10px] border border-border bg-surface pl-1 pr-3 py-1">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--primary-soft)] text-[color:var(--primary)] text-xs font-semibold">
            {initials(user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold leading-tight">
              {user.name}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[11px] text-muted-foreground leading-tight">
                {user.email}
              </span>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-[11px] font-medium text-muted-foreground hover:text-[color:var(--danger)]"
              title="Log out"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

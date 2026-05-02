"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Sparkles,
  Plus,
  HelpCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/ui-store";
import { navFor } from "@/lib/nav";
import { logoutAction } from "@/app/(auth)/actions";
import type { Role } from "@prisma/client";

type Project = { id: string; name: string; color: string };

type Props = {
  user: { name: string; email: string; role: Role };
  projects: Project[];
};

export function Sidebar({ user, projects }: Props) {
  const nav = navFor(user.role);
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-6 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface shadow-sm hover:bg-secondary"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="flex items-center gap-3 px-4 pt-5 pb-5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--primary)] text-[color:var(--primary-foreground)] font-bold">
          T
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Timeline</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-6">
        {nav.map((group, idx) => (
          <div key={idx} className="space-y-0.5">
            {group.label && !collapsed ? (
              <p className="px-3 mb-2 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/overview" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[color:var(--primary-soft)] text-[color:var(--primary)]"
                      : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active && "text-[color:var(--primary)]"
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}

        {!collapsed && (
          <div className="pt-2">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                Space
              </p>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                aria-label="New space"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="space-y-0.5">
              {projects.length === 0 ? (
                <li className="px-3 py-2 text-xs text-muted-foreground">
                  No spaces yet
                </li>
              ) : (
                projects.map((p) => {
                  const href = `/projects/${p.id}`;
                  const active = pathname === href;
                  return (
                    <li key={p.id}>
                      <Link
                        href={href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-secondary text-foreground"
                            : "text-foreground/80 hover:bg-secondary"
                        )}
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm"
                          style={{ background: p.color }}
                        />
                        <span className="truncate">{p.name}</span>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {!collapsed && (
          <div className="rounded-[14px] border border-border bg-secondary/60 p-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="mt-3 text-sm font-semibold">Smarter tasking with AI</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Timeline AI suggests workload moves to keep your team efficient.
            </p>
            <button
              type="button"
              className="mt-3 inline-flex w-full items-center justify-center rounded-[10px] border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-background"
            >
              Upgrade Pro
            </button>
          </div>
        )}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-secondary"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-[18px] w-[18px]" />
          {!collapsed && "Settings"}
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-secondary"
          title={collapsed ? "Help" : undefined}
        >
          <HelpCircle className="h-[18px] w-[18px]" />
          {!collapsed && "Help & Center"}
        </button>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)]"
            title={collapsed ? "Log out" : undefined}
          >
            <LogOut className="h-[18px] w-[18px]" />
            {!collapsed && "Log Out"}
          </button>
        </form>
      </div>
    </aside>
  );
}

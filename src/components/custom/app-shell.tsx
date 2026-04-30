"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/store";
import type { DashboardUser, RoleType } from "@/lib/types";

interface AppShellProps {
  users: DashboardUser[];
  heading: string;
  subheading: string;
  children: React.ReactNode;
}

const roleOptions: RoleType[] = ["EMPLOYEE", "MANAGER", "ADMIN"];

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employee", label: "Employee" },
  { href: "/manager", label: "Manager" },
  { href: "/admin", label: "Admin" },
  { href: "/chat", label: "Team Chat" },
];

export function AppShell({
  users,
  heading,
  subheading,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const { currentRole, currentUserId, currentUserName, setUser } =
    useUserStore();

  useEffect(() => {
    if (!users.length) {
      return;
    }

    const existing = users.find((user) => user.id === currentUserId);
    if (existing) {
      if (existing.name !== currentUserName || existing.role !== currentRole) {
        setUser(existing.id, existing.name, existing.role);
      }
      return;
    }

    const fallback =
      users.find((user) => user.role === currentRole) ?? users[0];
    setUser(fallback.id, fallback.name, fallback.role);
  }, [currentRole, currentUserId, currentUserName, setUser, users]);

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [currentUserId, users],
  );

  const handleRoleChange = (role: RoleType) => {
    const nextUser = users.find((user) => user.role === role);
    if (nextUser) {
      setUser(nextUser.id, nextUser.name, nextUser.role);
    }
  };

  const handleUserChange = (userId: string) => {
    const nextUser = users.find((user) => user.id === userId);
    if (nextUser) {
      setUser(nextUser.id, nextUser.name, nextUser.role);
    }
  };

  if (!users.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(120deg,#f8fafc_0%,#f3f5f9_40%,#eef2f8_100%)] p-4">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>No seed data detected</CardTitle>
            <CardDescription>
              Run prisma seed to load demo users, tasks, and workflow records.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(120deg,#f8fafc_0%,#f3f5f9_40%,#eef2f8_100%)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
                MULTI-AGENT WORKFORCE SUITE
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {heading}
              </h1>
              <p className="text-sm text-muted-foreground">{subheading}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={currentRole}
                onValueChange={(value) => handleRoleChange(value as RoleType)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Switch role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={currentUser?.id ?? ""}
                onValueChange={handleUserChange}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentUser && (
                <Badge variant="secondary" className="h-9 px-3">
                  Acting as {currentUser.name}
                </Badge>
              )}
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition",
                  pathname === item.href
                    ? "border-border bg-background text-foreground shadow-xs"
                    : "hover:border-border/70 hover:bg-background/70 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

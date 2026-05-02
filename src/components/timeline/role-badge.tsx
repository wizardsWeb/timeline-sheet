import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

const STYLES: Record<Role, { label: string; bg: string; fg: string }> = {
  ADMIN: { label: "Admin", bg: "var(--danger-soft)", fg: "var(--danger)" },
  MANAGER: { label: "Manager", bg: "var(--warn-soft)", fg: "#92400E" },
  EMPLOYEE: { label: "Employee", bg: "var(--primary-soft)", fg: "#166534" },
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const s = STYLES[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        className
      )}
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

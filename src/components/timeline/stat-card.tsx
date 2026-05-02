import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  iconBg?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon: Icon,
  iconBg = "var(--primary-soft)",
  className,
}: Props) {
  const toneClass =
    deltaTone === "up"
      ? "text-[color:var(--primary)]"
      : deltaTone === "down"
      ? "text-[color:var(--danger)]"
      : "text-muted-foreground";

  return (
    <div
      className={cn(
        "surface-card p-5 flex flex-col gap-3 shadow-[0_1px_2px_rgba(15,17,21,0.04)]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        {Icon ? (
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ background: iconBg }}
          >
            <Icon className="h-4 w-4 text-[color:var(--primary)]" />
          </span>
        ) : (
          <span />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-[28px] font-bold leading-tight">{value}</p>
        {delta ? <p className={cn("text-xs", toneClass)}>{delta}</p> : null}
      </div>
    </div>
  );
}

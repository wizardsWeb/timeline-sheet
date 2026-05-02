import { cn } from "@/lib/utils";

const VARIANTS = {
  pending: { bg: "var(--warn-soft)", fg: "#92400E", label: "Pending" },
  approved: { bg: "var(--primary-soft)", fg: "#166534", label: "Approved" },
  rejected: { bg: "var(--danger-soft)", fg: "var(--danger)", label: "Rejected" },
  todo: { bg: "var(--muted)", fg: "var(--muted-foreground)", label: "To do" },
  inProgress: { bg: "var(--info-soft)", fg: "var(--info)", label: "In progress" },
  done: { bg: "var(--primary-soft)", fg: "#166534", label: "Done" },
  high: { bg: "var(--danger-soft)", fg: "var(--danger)", label: "High" },
  medium: { bg: "var(--warn-soft)", fg: "#92400E", label: "Medium" },
  low: { bg: "var(--muted)", fg: "var(--muted-foreground)", label: "Low" },
} as const;

export type PillVariant = keyof typeof VARIANTS;

export function StatusPill({
  variant,
  label,
  className,
}: {
  variant: PillVariant;
  label?: string;
  className?: string;
}) {
  const v = VARIANTS[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        className
      )}
      style={{ background: v.bg, color: v.fg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: v.fg }}
      />
      {label ?? v.label}
    </span>
  );
}

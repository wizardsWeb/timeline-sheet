import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "surface-card flex flex-col items-center justify-center text-center px-8 py-16 gap-3",
        className
      )}
    >
      {Icon ? (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--primary-soft)]">
          <Icon className="h-5 w-5 text-[color:var(--primary)]" />
        </span>
      ) : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

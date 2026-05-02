import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: Props) {
  return (
    <section className={cn("surface-card", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            {title ? <h2 className="text-base font-semibold">{title}</h2> : null}
            {description ? (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className={cn("px-5 pb-5", !title && "pt-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

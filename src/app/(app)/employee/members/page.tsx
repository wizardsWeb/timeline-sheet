import { Users } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { RoleBadge } from "@/components/timeline/role-badge";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const members = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true },
  });
  return (
    <>
      <PageHeader
        title="Members"
        subtitle="Everyone on your Timeline workspace."
      />
      <SectionCard
        title={`${members.length} people`}
        actions={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Workspace directory
          </span>
        }
      >
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--primary-soft)] text-[color:var(--primary)] text-xs font-semibold">
                  {m.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase())
                    .join("")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email}
                  </p>
                </div>
              </div>
              <RoleBadge role={m.role} />
            </li>
          ))}
        </ul>
      </SectionCard>
    </>
  );
}

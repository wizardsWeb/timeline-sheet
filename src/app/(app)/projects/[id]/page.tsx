import { notFound } from "next/navigation";
import { Briefcase } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { StatusPill } from "@/components/timeline/status-pill";
import type { TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function statusVariant(s: TaskStatus) {
  if (s === "DONE") return "done" as const;
  if (s === "IN_PROGRESS") return "inProgress" as const;
  return "todo" as const;
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      tasks: { include: { assignee: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title={project.name}
        subtitle={`${project.members.length} members · ${project.tasks.length} tasks`}
        actions={
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              background: project.color + "1A",
              color: project.color,
            }}
          >
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: project.color }}
            />
            Space
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Tasks" className="lg:col-span-2">
          {project.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tasks in this space yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {project.tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.assignee.name}
                    </p>
                  </div>
                  <StatusPill variant={statusVariant(t.status)} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Members">
          <ul className="space-y-2">
            {project.members.map((m) => (
              <li
                key={m.userId}
                className="flex items-center gap-3 rounded-[10px] border border-border bg-secondary/40 px-3 py-2"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--primary-soft)] text-[color:var(--primary)] text-xs font-semibold">
                  {m.user.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase())
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.user.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {m.role}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {project.members.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <Briefcase className="mr-1 inline h-3.5 w-3.5" /> No members yet.
            </p>
          ) : null}
        </SectionCard>
      </div>
    </>
  );
}

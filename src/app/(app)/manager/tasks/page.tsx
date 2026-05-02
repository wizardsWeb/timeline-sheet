import { ListTodo } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { EmptyState } from "@/components/timeline/empty-state";
import { ManagerTaskRow } from "./task-row";
import { NewAssignedTaskDialog } from "./new-task-dialog";
import type { TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; assignedTo?: string }>;

export default async function ManagerTasksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const filters: { status?: TaskStatus; assignedTo?: string } = {};
  if (sp.status === "TODO" || sp.status === "IN_PROGRESS" || sp.status === "DONE") {
    filters.status = sp.status;
  }
  if (sp.assignedTo) filters.assignedTo = sp.assignedTo;

  const [tasks, employees, projects] = await Promise.all([
    prisma.task.findMany({
      where: filters,
      include: {
        assignee: { select: { id: true, name: true } },
        project: true,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Assign and adjust tasks across the team."
        actions={
          <NewAssignedTaskDialog
            employees={employees}
            projects={projects.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
          />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterGroup
          label="Status"
          options={[
            { value: undefined, label: "All" },
            { value: "TODO", label: "To do" },
            { value: "IN_PROGRESS", label: "In progress" },
            { value: "DONE", label: "Done" },
          ]}
          current={sp.status}
          buildHref={(v) => buildHref({ ...sp, status: v })}
        />
        <FilterGroup
          label="Assignee"
          options={[
            { value: undefined, label: "All" },
            ...employees.map((e) => ({ value: e.id, label: e.name })),
          ]}
          current={sp.assignedTo}
          buildHref={(v) => buildHref({ ...sp, assignedTo: v })}
        />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks match"
          description="Adjust filters or create a new task."
        />
      ) : (
        <SectionCard title={`${tasks.length} tasks`} bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {tasks.map((t) => (
              <ManagerTaskRow
                key={t.id}
                id={t.id}
                title={t.title}
                description={t.description}
                status={t.status}
                priority={t.priority}
                assigneeId={t.assignedTo}
                assigneeName={t.assignee.name}
                projectName={t.project?.name ?? "Personal"}
                projectColor={t.project?.color ?? "#9CA3AF"}
                employees={employees}
              />
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}

function buildHref(sp: { status?: string; assignedTo?: string }) {
  const q = new URLSearchParams();
  if (sp.status) q.set("status", sp.status);
  if (sp.assignedTo) q.set("assignedTo", sp.assignedTo);
  const s = q.toString();
  return `/manager/tasks${s ? `?${s}` : ""}`;
}

function FilterGroup({
  label,
  options,
  current,
  buildHref,
}: {
  label: string;
  options: { value: string | undefined; label: string }[];
  current?: string;
  buildHref: (v: string | undefined) => string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-[10px] border border-border bg-surface p-1">
      <span className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {options.map((o) => {
        const active = (current ?? undefined) === o.value;
        return (
          <a
            key={o.label}
            href={buildHref(o.value)}
            className={
              "rounded-[8px] px-2.5 py-1 text-xs font-medium transition-colors " +
              (active
                ? "bg-[color:var(--primary-soft)] text-[color:var(--primary)]"
                : "text-foreground/70 hover:bg-secondary")
            }
          >
            {o.label}
          </a>
        );
      })}
    </div>
  );
}

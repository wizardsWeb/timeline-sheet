import { Plus } from "lucide-react";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { EmptyState } from "@/components/timeline/empty-state";
import { TaskList } from "./task-list";
import { NewTaskDialog } from "./new-task-dialog";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; priority?: string; project?: string }>;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireSession();
  const sp = await searchParams;

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: { project: true },
    orderBy: { project: { name: "asc" } },
  });
  const projects = memberships.map((m) => ({
    id: m.project.id,
    name: m.project.name,
    color: m.project.color,
  }));

  const filters: {
    assignedTo: string;
    status?: "TODO" | "IN_PROGRESS" | "DONE";
    priority?: string;
    projectId?: string;
  } = { assignedTo: user.id };
  if (sp.status === "TODO" || sp.status === "IN_PROGRESS" || sp.status === "DONE") {
    filters.status = sp.status;
  }
  if (sp.priority && ["LOW", "MEDIUM", "HIGH"].includes(sp.priority)) {
    filters.priority = sp.priority;
  }
  if (sp.project) {
    filters.projectId = sp.project;
  }

  const tasks = await prisma.task.findMany({
    where: filters,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { project: true },
  });

  return (
    <>
      <PageHeader
        title="All Tasks"
        subtitle="Tasks assigned to you across spaces."
        actions={<NewTaskDialog projects={projects} />}
      />

      <Filters
        currentStatus={sp.status}
        currentPriority={sp.priority}
        currentProject={sp.project}
        projects={projects}
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No tasks match"
          description="Try clearing filters or ask your manager to assign a task."
        />
      ) : (
        <SectionCard
          title={`${tasks.length} tasks`}
          description="Update status as you progress."
          bodyClassName="p-0"
        >
          <TaskList tasks={tasks} />
        </SectionCard>
      )}
    </>
  );
}

function Filters({
  currentStatus,
  currentPriority,
  currentProject,
  projects,
}: {
  currentStatus?: string;
  currentPriority?: string;
  currentProject?: string;
  projects: { id: string; name: string }[];
}) {
  const params = (next: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      status: currentStatus,
      priority: currentPriority,
      project: currentProject,
      ...next,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) q.set(k, v);
    }
    const s = q.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <FilterGroup
        label="Status"
        options={[
          { value: undefined, label: "All" },
          { value: "TODO", label: "To do" },
          { value: "IN_PROGRESS", label: "In progress" },
          { value: "DONE", label: "Done" },
        ]}
        current={currentStatus}
        toHref={(v) => `/employee/tasks${params({ status: v })}`}
      />
      <FilterGroup
        label="Priority"
        options={[
          { value: undefined, label: "All" },
          { value: "HIGH", label: "High" },
          { value: "MEDIUM", label: "Medium" },
          { value: "LOW", label: "Low" },
        ]}
        current={currentPriority}
        toHref={(v) => `/employee/tasks${params({ priority: v })}`}
      />
      {projects.length ? (
        <FilterGroup
          label="Space"
          options={[
            { value: undefined, label: "All" },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
          current={currentProject}
          toHref={(v) => `/employee/tasks${params({ project: v })}`}
        />
      ) : null}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  current,
  toHref,
}: {
  label: string;
  options: { value: string | undefined; label: string }[];
  current?: string;
  toHref: (v: string | undefined) => string;
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
            href={toHref(o.value)}
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

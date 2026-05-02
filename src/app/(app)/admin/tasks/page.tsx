import { ClipboardList } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { EmptyState } from "@/components/timeline/empty-state";
import { StatCard } from "@/components/timeline/stat-card";
import { StatusPill, type PillVariant } from "@/components/timeline/status-pill";
import type { TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<TaskStatus, PillVariant> = {
  TODO: "todo",
  IN_PROGRESS: "inProgress",
  DONE: "done",
};

const PRIORITY_VARIANT: Record<string, PillVariant> = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

type SearchParams = Promise<{ status?: string }>;

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filters: { status?: TaskStatus } = {};
  if (sp.status === "TODO" || sp.status === "IN_PROGRESS" || sp.status === "DONE") {
    filters.status = sp.status;
  }

  const [tasks, counts] = await Promise.all([
    prisma.task.findMany({
      where: filters,
      include: {
        assignee: { select: { name: true } },
        project: true,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.task.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const summary = {
    todo: counts.find((c) => c.status === "TODO")?._count ?? 0,
    inProgress: counts.find((c) => c.status === "IN_PROGRESS")?._count ?? 0,
    done: counts.find((c) => c.status === "DONE")?._count ?? 0,
  };

  return (
    <>
      <PageHeader
        title="All Tasks"
        subtitle="Every task across the workspace."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="To do" value={summary.todo} icon={ClipboardList} />
        <StatCard
          label="In progress"
          value={summary.inProgress}
          icon={ClipboardList}
          iconBg="var(--info-soft)"
        />
        <StatCard
          label="Done"
          value={summary.done}
          icon={ClipboardList}
          iconBg="var(--primary-soft)"
        />
      </div>

      <div className="my-4 flex items-center gap-2">
        {[
          { value: undefined, label: "All" },
          { value: "TODO", label: "To do" },
          { value: "IN_PROGRESS", label: "In progress" },
          { value: "DONE", label: "Done" },
        ].map((o) => {
          const active = (sp.status ?? undefined) === o.value;
          const q = o.value ? `?status=${o.value}` : "";
          return (
            <a
              key={o.label}
              href={`/admin/tasks${q}`}
              className={
                "rounded-[10px] border px-3 py-1.5 text-xs font-medium " +
                (active
                  ? "border-[color:var(--primary)] bg-[color:var(--primary-soft)] text-[color:var(--primary)]"
                  : "border-border bg-surface text-foreground/70 hover:bg-secondary")
              }
            >
              {o.label}
            </a>
          );
        })}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tasks match"
          description="Adjust the filter."
        />
      ) : (
        <SectionCard title={`${tasks.length} tasks`} bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-3 py-3 font-medium">Assignee</th>
                  <th className="px-3 py-3 font-medium">Project</th>
                  <th className="px-3 py-3 font-medium">Priority</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary/40">
                    <td className="px-5 py-3">
                      <p className="font-medium">{t.title}</p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {t.description}
                      </p>
                    </td>
                    <td className="px-3 py-3">{t.assignee.name}</td>
                    <td className="px-3 py-3 text-xs">
                      {t.project?.name ?? "Personal"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill variant={PRIORITY_VARIANT[t.priority] ?? "low"} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill variant={STATUS_VARIANT[t.status]} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </>
  );
}

import { Clock } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { EmptyState } from "@/components/timeline/empty-state";
import { StatCard } from "@/components/timeline/stat-card";
import { StatusPill, type PillVariant } from "@/components/timeline/status-pill";
import type { TimesheetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<TimesheetStatus, PillVariant> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

type SearchParams = Promise<{ status?: string }>;

export default async function AdminTimesheetsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filters: { status?: TimesheetStatus } = {};
  if (sp.status === "PENDING" || sp.status === "APPROVED" || sp.status === "REJECTED") {
    filters.status = sp.status;
  }

  const [entries, counts] = await Promise.all([
    prisma.timesheet.findMany({
      where: filters,
      include: {
        user: { select: { name: true, email: true } },
        task: { include: { project: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.timesheet.groupBy({
      by: ["status"],
      _count: true,
      _sum: { hours: true },
    }),
  ]);

  const summary = {
    pending: counts.find((c) => c.status === "PENDING")?._count ?? 0,
    approved: counts.find((c) => c.status === "APPROVED")?._count ?? 0,
    rejected: counts.find((c) => c.status === "REJECTED")?._count ?? 0,
    totalHours:
      (counts.find((c) => c.status === "APPROVED")?._sum.hours ?? 0) +
      (counts.find((c) => c.status === "PENDING")?._sum.hours ?? 0) +
      (counts.find((c) => c.status === "REJECTED")?._sum.hours ?? 0),
  };

  return (
    <>
      <PageHeader
        title="All Timesheets"
        subtitle="Workspace-wide timesheet visibility."
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Pending" value={summary.pending} icon={Clock} iconBg="var(--warn-soft)" />
        <StatCard label="Approved" value={summary.approved} icon={Clock} iconBg="var(--primary-soft)" />
        <StatCard label="Rejected" value={summary.rejected} icon={Clock} iconBg="var(--danger-soft)" />
        <StatCard label="Total Hours" value={summary.totalHours.toFixed(1)} icon={Clock} />
      </div>

      <div className="my-4 flex items-center gap-2">
        {[
          { value: undefined, label: "All" },
          { value: "PENDING", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
        ].map((o) => {
          const active = (sp.status ?? undefined) === o.value;
          const q = o.value ? `?status=${o.value}` : "";
          return (
            <a
              key={o.label}
              href={`/admin/timesheets${q}`}
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

      {entries.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No entries match"
          description="Adjust the filter or wait for new submissions."
        />
      ) : (
        <SectionCard title={`${entries.length} entries`} bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Task</th>
                  <th className="px-3 py-3 font-medium">Project</th>
                  <th className="px-3 py-3 font-medium">Hours</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-secondary/40">
                    <td className="px-5 py-3">
                      <p className="font-medium">{e.user.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {e.user.email}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{e.task.title}</p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">
                        {e.description}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {e.task.project?.name ?? "Personal"}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {e.hours.toFixed(1)}h
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill variant={STATUS_VARIANT[e.status]} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(e.createdAt).toLocaleDateString()}
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

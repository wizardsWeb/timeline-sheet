import { Clock } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { EmptyState } from "@/components/timeline/empty-state";
import { StatusPill, type PillVariant } from "@/components/timeline/status-pill";
import type { TimesheetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; userId?: string }>;

const STATUS_VARIANT: Record<TimesheetStatus, PillVariant> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export default async function TeamTimesheetsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const filters: { status?: TimesheetStatus; userId?: string } = {};
  if (sp.status === "PENDING" || sp.status === "APPROVED" || sp.status === "REJECTED") {
    filters.status = sp.status;
  }
  if (sp.userId) filters.userId = sp.userId;

  const [entries, employees] = await Promise.all([
    prisma.timesheet.findMany({
      where: filters,
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { include: { project: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Team Timesheets"
        subtitle="Submissions across the team."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterGroup
          label="Status"
          options={[
            { value: undefined, label: "All" },
            { value: "PENDING", label: "Pending" },
            { value: "APPROVED", label: "Approved" },
            { value: "REJECTED", label: "Rejected" },
          ]}
          current={sp.status}
          buildHref={(v) => buildHref({ ...sp, status: v })}
        />
        <FilterGroup
          label="Member"
          options={[
            { value: undefined, label: "All" },
            ...employees.map((e) => ({ value: e.id, label: e.name })),
          ]}
          current={sp.userId}
          buildHref={(v) => buildHref({ ...sp, userId: v })}
        />
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No entries match"
          description="Adjust filters or wait for new submissions."
        />
      ) : (
        <SectionCard title={`${entries.length} entries`} bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Member</th>
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
                      <p className="text-sm font-medium">{e.user.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {e.user.email}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium">{e.task.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {e.description}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background:
                            (e.task.project?.color ?? "#9CA3AF") + "1A",
                          color: e.task.project?.color ?? "#6B7280",
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-sm"
                          style={{
                            background: e.task.project?.color ?? "#9CA3AF",
                          }}
                        />
                        {e.task.project?.name ?? "Personal"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm tabular-nums">
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

function buildHref(sp: { status?: string; userId?: string }) {
  const q = new URLSearchParams();
  if (sp.status) q.set("status", sp.status);
  if (sp.userId) q.set("userId", sp.userId);
  const s = q.toString();
  return `/manager/timesheets${s ? `?${s}` : ""}`;
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

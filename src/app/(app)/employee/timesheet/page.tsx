import { Clock, Coins, Hourglass, Play } from "lucide-react";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { StatCard } from "@/components/timeline/stat-card";
import { SectionCard } from "@/components/timeline/section-card";
import { EmptyState } from "@/components/timeline/empty-state";
import { LogTimeButton } from "./log-time-button";
import { DayGroup, type TimesheetRow } from "./day-group";

export const dynamic = "force-dynamic";

const REGULAR_HOURS_PER_DAY = 8;

function startOfMonth(d = new Date()) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfPreviousMonth() {
  const d = startOfMonth();
  d.setMonth(d.getMonth() - 1);
  return d;
}
function endOfPreviousMonth() {
  const d = startOfMonth();
  d.setMilliseconds(-1);
  return d;
}
function dayKey(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export default async function TimesheetPage() {
  const user = await requireSession();

  const monthStart = startOfMonth();
  const prevStart = startOfPreviousMonth();
  const prevEnd = endOfPreviousMonth();

  const [entries, prev, tasks] = await Promise.all([
    prisma.timesheet.findMany({
      where: { userId: user.id, createdAt: { gte: monthStart } },
      include: { task: { include: { project: true, assignee: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.timesheet.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: prevStart, lte: prevEnd },
      },
      select: { hours: true, status: true },
    }),
    prisma.task.findMany({
      where: { assignedTo: user.id, status: { not: "DONE" } },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalHours = sum(entries.map((e) => e.hours));
  const overtime = Math.max(
    0,
    sum(entries.map((e) => Math.max(0, e.hours - REGULAR_HOURS_PER_DAY)))
  );
  const approvedHours = sum(
    entries.filter((e) => e.status === "APPROVED").map((e) => e.hours)
  );
  const pendingHours = sum(
    entries.filter((e) => e.status === "PENDING").map((e) => e.hours)
  );

  const prevTotal = sum(prev.map((e) => e.hours));
  const prevOvertime = Math.max(
    0,
    sum(prev.map((e) => Math.max(0, e.hours - REGULAR_HOURS_PER_DAY)))
  );
  const prevApproved = sum(
    prev.filter((e) => e.status === "APPROVED").map((e) => e.hours)
  );

  const groups = new Map<string, TimesheetRow[]>();
  for (const e of entries) {
    const key = dayKey(e.createdAt);
    const arr = groups.get(key) ?? [];
    arr.push({
      id: e.id,
      hours: e.hours,
      description: e.description,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      projectName: e.task.project?.name ?? "Personal",
      projectColor: e.task.project?.color ?? "#9CA3AF",
      taskTitle: e.task.title,
      taskId: e.task.id,
      priority: e.task.priority,
      assigneeName: e.task.assignee.name,
    });
    groups.set(key, arr);
  }

  return (
    <>
      <PageHeader
        title="Timesheet"
        subtitle="Timesheet entries are completed by you for this month."
        actions={<LogTimeButton tasks={tasks} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Hours"
          value={`${totalHours.toFixed(1)}`}
          delta={delta(totalHours, prevTotal, "hours")}
          deltaTone={trend(totalHours, prevTotal)}
          icon={Clock}
        />
        <StatCard
          label="Overtime"
          value={`${overtime.toFixed(1)}`}
          delta={delta(overtime, prevOvertime, "hours")}
          deltaTone={trend(overtime, prevOvertime, true)}
          icon={Hourglass}
          iconBg="var(--warn-soft)"
        />
        <StatCard
          label="Approved Hours"
          value={`${approvedHours.toFixed(1)}`}
          delta={delta(approvedHours, prevApproved, "hours")}
          deltaTone={trend(approvedHours, prevApproved)}
          icon={Coins}
          iconBg="var(--info-soft)"
        />
        <StatCard
          label="Pending Hours"
          value={`${pendingHours.toFixed(1)}`}
          delta="Awaiting approval"
          icon={Play}
          iconBg="var(--primary-soft)"
        />
      </div>

      <div className="mt-6 space-y-4">
        {entries.length === 0 ? (
          <SectionCard title="This month">
            <EmptyState
              icon={Clock}
              title="No timesheet entries yet"
              description="Log time against your tasks to populate this view."
            />
          </SectionCard>
        ) : (
          [...groups.entries()].map(([key, rows]) => (
            <DayGroup key={key} dateIso={key} rows={rows} />
          ))
        )}
      </div>
    </>
  );
}

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}

function delta(curr: number, prev: number, unit: string) {
  const diff = curr - prev;
  if (Math.abs(diff) < 0.05) return `Same as last month`;
  const sign = diff > 0 ? "+" : "−";
  return `${sign} ${Math.abs(diff).toFixed(1)} ${unit} vs last month`;
}

function trend(curr: number, prev: number, lessIsBetter = false): "up" | "down" | "neutral" {
  if (Math.abs(curr - prev) < 0.05) return "neutral";
  const positive = curr > prev;
  if (lessIsBetter) return positive ? "down" : "up";
  return positive ? "up" : "down";
}

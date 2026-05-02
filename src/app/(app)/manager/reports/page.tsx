import { BarChart3, Sparkles } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { StatCard } from "@/components/timeline/stat-card";
import { ReportsChart } from "./reports-chart";
import { EvaluatePanel } from "./evaluate-panel";

export const dynamic = "force-dynamic";

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function ReportsPage() {
  const monthStart = startOfMonth();

  const [members, monthEntries, tasks] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.timesheet.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { userId: true, hours: true, status: true },
    }),
    prisma.task.findMany({
      select: { status: true, assignedTo: true },
    }),
  ]);

  const hoursByUser = new Map<string, number>();
  for (const e of monthEntries) {
    hoursByUser.set(e.userId, (hoursByUser.get(e.userId) ?? 0) + e.hours);
  }
  const tasksByUser = new Map<string, { open: number; done: number }>();
  for (const t of tasks) {
    const cur = tasksByUser.get(t.assignedTo) ?? { open: 0, done: 0 };
    if (t.status === "DONE") cur.done += 1;
    else cur.open += 1;
    tasksByUser.set(t.assignedTo, cur);
  }

  const chartData = members.map((m) => ({
    name: m.name.split(" ")[0],
    hours: Number((hoursByUser.get(m.id) ?? 0).toFixed(1)),
    open: tasksByUser.get(m.id)?.open ?? 0,
    done: tasksByUser.get(m.id)?.done ?? 0,
  }));

  const totalHours = monthEntries.reduce((a, b) => a + b.hours, 0);
  const approvedHours = monthEntries
    .filter((e) => e.status === "APPROVED")
    .reduce((a, b) => a + b.hours, 0);
  const approvalRate = monthEntries.length
    ? Math.round(
        (monthEntries.filter((e) => e.status === "APPROVED").length /
          monthEntries.length) *
          100
      )
    : 0;
  const totalDone = tasks.filter((t) => t.status === "DONE").length;
  const totalTasks = tasks.length;

  const employees = members.filter((m) => m.role === "EMPLOYEE");

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Workload, throughput, and AI-assisted appraisal."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Hours (mtd)"
          value={totalHours.toFixed(1)}
          icon={BarChart3}
        />
        <StatCard
          label="Approved Hours"
          value={approvedHours.toFixed(1)}
          delta={`${approvalRate}% approval rate`}
          icon={BarChart3}
          iconBg="var(--info-soft)"
        />
        <StatCard
          label="Tasks Done"
          value={`${totalDone} / ${totalTasks}`}
          icon={BarChart3}
          iconBg="var(--primary-soft)"
        />
        <StatCard
          label="Active Members"
          value={members.length}
          icon={BarChart3}
          iconBg="var(--warn-soft)"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Workload by member"
          description="Hours logged this month + task status."
          className="lg:col-span-2"
        >
          <ReportsChart data={chartData} />
        </SectionCard>

        <SectionCard
          title="AI evaluation"
          description="Generate appraisal for an employee."
          actions={
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Gemini
            </span>
          }
        >
          <EvaluatePanel employees={employees} />
        </SectionCard>
      </div>
    </>
  );
}

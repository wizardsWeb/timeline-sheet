import { ServerCog, Database, Sparkles, Activity } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { StatCard } from "@/components/timeline/stat-card";

export const dynamic = "force-dynamic";

export default async function SystemPage() {
  const [users, employees, managers, admins, tasks, timesheets, approvals, projects, messages] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.user.count({ where: { role: "MANAGER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.task.count(),
      prisma.timesheet.count(),
      prisma.approval.count(),
      prisma.project.count(),
      prisma.message.count(),
    ]);

  const services = [
    { label: "Attendance Agent", state: "Live", soft: "var(--primary-soft)", color: "var(--primary)" },
    { label: "Timesheet Agent", state: "Live", soft: "var(--primary-soft)", color: "var(--primary)" },
    { label: "Task Agent", state: "Live", soft: "var(--primary-soft)", color: "var(--primary)" },
    {
      label: "Evaluation Agent",
      state: process.env.GEMINI_API_KEY ? "Gemini-backed" : "Fallback heuristic",
      soft: process.env.GEMINI_API_KEY ? "var(--info-soft)" : "var(--warn-soft)",
      color: process.env.GEMINI_API_KEY ? "var(--info)" : "#92400E",
    },
    {
      label: "Database",
      state: process.env.DATABASE_URL?.startsWith("file:") ? "SQLite (dev)" : "Postgres",
      soft: "var(--info-soft)",
      color: "var(--info)",
    },
  ];

  return (
    <>
      <PageHeader
        title="System"
        subtitle="Platform health and live counts."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Users" value={users} icon={Activity} />
        <StatCard label="Tasks" value={tasks} icon={Activity} iconBg="var(--info-soft)" />
        <StatCard label="Timesheets" value={timesheets} icon={Activity} iconBg="var(--warn-soft)" />
        <StatCard label="Approvals" value={approvals} icon={Activity} iconBg="var(--primary-soft)" />
        <StatCard label="Projects" value={projects} icon={Activity} iconBg="var(--danger-soft)" />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Service status"
          actions={
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ServerCog className="h-3.5 w-3.5" />
              Read-only
            </span>
          }
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((s) => (
              <div
                key={s.label}
                className="rounded-[10px] border border-border bg-secondary/40 px-4 py-3"
              >
                <p className="text-sm font-medium">{s.label}</p>
                <span
                  className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: s.soft, color: s.color }}
                >
                  {s.state}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Population">
          <ul className="space-y-2 text-sm">
            <Row label="Employees" value={employees} />
            <Row label="Managers" value={managers} />
            <Row label="Admins" value={admins} />
            <Row label="Chat messages" value={messages} icon={<Sparkles className="h-3 w-3" />} />
            <Row
              label="DB tables"
              value="6"
              icon={<Database className="h-3 w-3" />}
            />
          </ul>
        </SectionCard>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </li>
  );
}

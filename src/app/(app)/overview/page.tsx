import {
  Briefcase,
  CheckCircle2,
  Clock,
  Users,
  ListTodo,
  ShieldCheck,
} from "lucide-react";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { StatCard } from "@/components/timeline/stat-card";
import { SectionCard } from "@/components/timeline/section-card";
import { StatusPill } from "@/components/timeline/status-pill";
import type { TaskStatus, TimesheetStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function statusToVariant(s: TimesheetStatus) {
  if (s === "APPROVED") return "approved" as const;
  if (s === "REJECTED") return "rejected" as const;
  return "pending" as const;
}

function taskStatusToVariant(s: TaskStatus) {
  if (s === "DONE") return "done" as const;
  if (s === "IN_PROGRESS") return "inProgress" as const;
  return "todo" as const;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function OverviewPage() {
  const user = await requireSession();

  if (user.role === "ADMIN") return <AdminOverview userName={user.name} />;
  if (user.role === "MANAGER") return <ManagerOverview userName={user.name} userId={user.id} />;
  return <EmployeeOverview userName={user.name} userId={user.id} />;
}

async function EmployeeOverview({
  userName,
  userId,
}: {
  userName: string;
  userId: string;
}) {
  const [openTasks, doneTasks, pendingSheets, weekTotal, recent, projects] =
    await Promise.all([
      prisma.task.count({ where: { assignedTo: userId, status: { not: "DONE" } } }),
      prisma.task.count({ where: { assignedTo: userId, status: "DONE" } }),
      prisma.timesheet.count({ where: { userId, status: "PENDING" } }),
      prisma.timesheet.aggregate({
        where: {
          userId,
          createdAt: { gte: weekAgo() },
        },
        _sum: { hours: true },
      }),
      prisma.timesheet.findMany({
        where: { userId },
        include: { task: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.projectMember.findMany({
        where: { userId },
        include: { project: true },
      }),
    ]);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${userName.split(" ")[0]}`}
        subtitle="Here is what's happening across your work today."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Tasks" value={openTasks} icon={ListTodo} />
        <StatCard
          label="Hours This Week"
          value={(weekTotal._sum.hours ?? 0).toFixed(1)}
          icon={Clock}
        />
        <StatCard
          label="Pending Timesheets"
          value={pendingSheets}
          icon={Briefcase}
        />
        <StatCard label="Tasks Done" value={doneTasks} icon={CheckCircle2} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Recent timesheets"
          description="Your last five entries"
          className="lg:col-span-2"
        >
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timesheets yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {t.task.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span>{t.hours.toFixed(1)}h</span>
                    <StatusPill variant={statusToVariant(t.status)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Your spaces">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No spaces assigned yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {projects.map((m) => (
                <li
                  key={m.projectId}
                  className="flex items-center gap-2.5 rounded-[10px] border border-border bg-secondary/40 px-3 py-2"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: m.project.color }}
                  />
                  <span className="text-sm font-medium">{m.project.name}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}

async function ManagerOverview({
  userName,
  userId,
}: {
  userName: string;
  userId: string;
}) {
  const [pendingApprovals, teamHoursAgg, activeTasks, teamSize, recent] =
    await Promise.all([
      prisma.timesheet.count({ where: { status: "PENDING" } }),
      prisma.timesheet.aggregate({
        where: { createdAt: { gte: weekAgo() } },
        _sum: { hours: true },
      }),
      prisma.task.count({ where: { status: { not: "DONE" } } }),
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.timesheet.findMany({
        where: { status: "PENDING" },
        include: { task: true, user: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);
  void userId;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${userName.split(" ")[0]}`}
        subtitle="Approve timesheets and keep your team unblocked."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals}
          icon={ShieldCheck}
        />
        <StatCard
          label="Team Hours (7d)"
          value={(teamHoursAgg._sum.hours ?? 0).toFixed(1)}
          icon={Clock}
        />
        <StatCard label="Active Tasks" value={activeTasks} icon={ListTodo} />
        <StatCard label="Team Size" value={teamSize} icon={Users} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Awaiting your review"
          description="Pending timesheets across the team"
          className="lg:col-span-2"
        >
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">All caught up.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {t.task.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.user.name} · {t.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span>{t.hours.toFixed(1)}h</span>
                    <StatusPill variant={statusToVariant(t.status)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Quick links">
          <ul className="space-y-2 text-sm">
            <LinkRow href="/manager/approvals" label="Open approvals" />
            <LinkRow href="/manager/timesheets" label="Team timesheets" />
            <LinkRow href="/manager/tasks" label="Manage tasks" />
            <LinkRow href="/manager/reports" label="View reports" />
          </ul>
        </SectionCard>
      </div>
    </>
  );
}

async function AdminOverview({ userName }: { userName: string }) {
  const [users, employees, managers, pendingSheets, recentTasks] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.user.count({ where: { role: "MANAGER" } }),
      prisma.timesheet.count({ where: { status: "PENDING" } }),
      prisma.task.findMany({
        include: { assignee: true, project: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return (
    <>
      <PageHeader
        title={`Workspace overview, ${userName.split(" ")[0]}`}
        subtitle="System health and population at a glance."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={users} icon={Users} />
        <StatCard label="Employees" value={employees} icon={Briefcase} />
        <StatCard label="Managers" value={managers} icon={ShieldCheck} />
        <StatCard label="Pending Sheets" value={pendingSheets} icon={Clock} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Latest tasks"
          description="Most recently created"
          className="lg:col-span-2"
        >
          {recentTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.assignee.name}
                      {t.project ? ` · ${t.project.name}` : ""}
                    </p>
                  </div>
                  <StatusPill variant={taskStatusToVariant(t.status)} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Quick links">
          <ul className="space-y-2 text-sm">
            <LinkRow href="/admin/users" label="Manage users" />
            <LinkRow href="/admin/timesheets" label="All timesheets" />
            <LinkRow href="/admin/tasks" label="All tasks" />
            <LinkRow href="/admin/system" label="System status" />
          </ul>
        </SectionCard>
      </div>
    </>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        className="flex items-center justify-between rounded-[10px] border border-border bg-secondary/40 px-3 py-2 hover:bg-secondary"
      >
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">→</span>
      </a>
    </li>
  );
}

function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

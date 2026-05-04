"use client";

import {
  Users,
  BarChart3,
  ListTodo,
  Clock,
  Calendar,
  FolderKanban,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface Props {
  toolName: string;
  data: unknown;
}

export function ToolResultCard({ toolName, data }: Props) {
  const [expanded, setExpanded] = useState(true);

  if (!data || typeof data !== "object") return null;
  if ("error" in (data as Record<string, unknown>)) {
    return (
      <div className="rounded-[12px] border border-[color:var(--danger)]/30 bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger)]">
        {String((data as Record<string, unknown>).error)}
      </div>
    );
  }

  const meta = TOOL_META[toolName] ?? {
    label: toolName,
    icon: BarChart3,
    color: "var(--primary)",
    bg: "var(--primary-soft)",
  };

  const Icon = meta.icon;

  return (
    <div className="w-full rounded-[14px] border border-border bg-[color:var(--surface)] overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[color:var(--surface-2)]"
      >
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: meta.bg, color: meta.color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 text-sm font-semibold">{meta.label}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-border px-4 py-3">
          {toolName === "get_employee_list" && <EmployeeListView data={data} />}
          {toolName === "get_employee_stats" && <EmployeeStatsView data={data} />}
          {toolName === "get_task_overview" && <TaskOverviewView data={data} />}
          {toolName === "get_timesheet_analytics" && <TimesheetAnalyticsView data={data} />}
          {toolName === "get_attendance_summary" && <AttendanceSummaryView data={data} />}
          {toolName === "get_project_summary" && <ProjectSummaryView data={data} />}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tool metadata                                                      */
/* ------------------------------------------------------------------ */

const TOOL_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  get_employee_list: { label: "Employee Directory", icon: Users, color: "var(--primary)", bg: "var(--primary-soft)" },
  get_employee_stats: { label: "Employee Performance", icon: TrendingUp, color: "var(--info)", bg: "var(--info-soft)" },
  get_task_overview: { label: "Task Overview", icon: ListTodo, color: "var(--warn)", bg: "var(--warn-soft)" },
  get_timesheet_analytics: { label: "Timesheet Analytics", icon: Clock, color: "var(--primary)", bg: "var(--primary-soft)" },
  get_attendance_summary: { label: "Attendance Summary", icon: Calendar, color: "var(--info)", bg: "var(--info-soft)" },
  get_project_summary: { label: "Project Summary", icon: FolderKanban, color: "var(--warn)", bg: "var(--warn-soft)" },
};

/* ------------------------------------------------------------------ */
/*  Stat helpers                                                       */
/* ------------------------------------------------------------------ */

function StatGrid({ items }: { items: Array<{ label: string; value: React.ReactNode; accent?: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-[10px] bg-[color:var(--surface-2)] px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">{item.label}</p>
          <p className="mt-0.5 text-base font-bold tabular-nums" style={{ color: item.accent }}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function MiniTable({ columns, rows }: { columns: string[]; rows: Array<Record<string, React.ReactNode>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="border-b border-border px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {columns.map((col) => (
                <td key={col} className="px-2 py-1.5 tabular-nums">
                  {row[col] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBar({
  segments,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[color:var(--surface-2)]">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="h-full transition-all"
            style={{
              width: `${(seg.value / total) * 100}%`,
              backgroundColor: seg.color,
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px]">
        {segments.map((seg) => (
          <span key={seg.label} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            {seg.label}: {seg.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    ADMIN: { bg: "var(--danger-soft)", fg: "var(--danger)" },
    MANAGER: { bg: "var(--warn-soft)", fg: "#92400E" },
    EMPLOYEE: { bg: "var(--primary-soft)", fg: "var(--primary)" },
  };
  const c = colors[role] ?? colors.EMPLOYEE;
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {role}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Per-tool views                                                     */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EmployeeListView({ data }: { data: any }) {
  const users = data.users ?? [];
  return (
    <div className="space-y-3">
      <StatGrid items={[{ label: "Total Users", value: data.total ?? users.length }]} />
      {users.length > 0 && (
        <MiniTable
          columns={["Name", "Email", "Role", "Joined"]}
          rows={users.map((u: { name: string; email: string; role: string; createdAt: string }) => ({
            Name: u.name,
            Email: u.email,
            Role: <RolePill role={u.role} />,
            Joined: u.createdAt,
          }))}
        />
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EmployeeStatsView({ data }: { data: any }) {
  const emp = data.employee ?? {};
  const att = data.attendance ?? {};
  const tasks = data.tasks ?? {};
  const ts = data.timesheets ?? {};

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{emp.name}</span>
        <RolePill role={emp.role ?? "EMPLOYEE"} />
        <span className="text-xs text-muted-foreground">{emp.email}</span>
      </div>

      <StatGrid
        items={[
          { label: "Attendance Days", value: att.totalDays ?? 0 },
          { label: "Total Hours", value: `${att.totalHours ?? 0}h` },
          { label: "Avg Hours/Day", value: `${att.avgHoursPerDay ?? 0}h` },
          { label: "Tasks Total", value: tasks.total ?? 0 },
          { label: "Completion Rate", value: `${tasks.completionRate ?? 0}%`, accent: "var(--primary)" },
          { label: "Hours Logged", value: `${ts.totalHoursLogged ?? 0}h` },
          { label: "Approval Rate", value: `${ts.approvalRate ?? 0}%`, accent: "var(--primary)" },
        ]}
      />

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Task Breakdown
        </p>
        <StatusBar
          segments={[
            { label: "Done", value: tasks.done ?? 0, color: "#16A34A" },
            { label: "In Progress", value: tasks.inProgress ?? 0, color: "#2563EB" },
            { label: "To Do", value: tasks.todo ?? 0, color: "#94A3B8" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Timesheet Status
        </p>
        <StatusBar
          segments={[
            { label: "Approved", value: ts.approved ?? 0, color: "#16A34A" },
            { label: "Pending", value: ts.pending ?? 0, color: "#F59E0B" },
            { label: "Rejected", value: ts.rejected ?? 0, color: "#DC2626" },
          ]}
        />
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TaskOverviewView({ data }: { data: any }) {
  const summary = data.summary ?? {};
  const tasks = data.tasks ?? [];

  return (
    <div className="space-y-3">
      <StatGrid
        items={[
          { label: "Total", value: summary.total ?? 0 },
          { label: "To Do", value: summary.todo ?? 0 },
          { label: "In Progress", value: summary.inProgress ?? 0 },
          { label: "Done", value: summary.done ?? 0, accent: "var(--primary)" },
        ]}
      />
      <StatusBar
        segments={[
          { label: "Done", value: summary.done ?? 0, color: "#16A34A" },
          { label: "In Progress", value: summary.inProgress ?? 0, color: "#2563EB" },
          { label: "To Do", value: summary.todo ?? 0, color: "#94A3B8" },
        ]}
      />
      {tasks.length > 0 && (
        <MiniTable
          columns={["Title", "Status", "Priority", "Assignee", "Project"]}
          rows={tasks.map((t: { title: string; status: string; priority: string; assignee: string; project: string }) => ({
            Title: t.title,
            Status: <StatusPill status={t.status} />,
            Priority: t.priority,
            Assignee: t.assignee,
            Project: t.project,
          }))}
        />
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TimesheetAnalyticsView({ data }: { data: any }) {
  const bd = data.breakdown ?? {};
  const top = data.topContributors ?? [];

  return (
    <div className="space-y-3">
      <StatGrid
        items={[
          { label: "Total Entries", value: data.totalEntries ?? 0 },
          { label: "Total Hours", value: `${data.totalHours ?? 0}h` },
          { label: "Approval Rate", value: `${data.approvalRate ?? 0}%`, accent: "var(--primary)" },
        ]}
      />
      <StatusBar
        segments={[
          { label: "Approved", value: bd.approved ?? 0, color: "#16A34A" },
          { label: "Pending", value: bd.pending ?? 0, color: "#F59E0B" },
          { label: "Rejected", value: bd.rejected ?? 0, color: "#DC2626" },
        ]}
      />
      {top.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Top Contributors
          </p>
          <MiniTable
            columns={["Name", "Hours"]}
            rows={top.map((c: { name: string; hours: number }) => ({
              Name: c.name,
              Hours: `${c.hours}h`,
            }))}
          />
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AttendanceSummaryView({ data }: { data: any }) {
  const records = data.records ?? [];

  return (
    <div className="space-y-3">
      <StatGrid
        items={[
          { label: "Records", value: data.totalRecords ?? 0 },
          { label: "Total Hours", value: `${data.totalHours ?? 0}h` },
          { label: "Avg Hours/Day", value: `${data.avgHoursPerDay ?? 0}h` },
        ]}
      />
      {records.length > 0 && (
        <MiniTable
          columns={["Employee", "Date", "Check In", "Check Out", "Hours"]}
          rows={records.map((r: { employee: string; date: string; checkIn: string; checkOut: string; hours: number }) => ({
            Employee: r.employee,
            Date: r.date,
            "Check In": r.checkIn,
            "Check Out": r.checkOut,
            Hours: `${r.hours}h`,
          }))}
        />
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProjectSummaryView({ data }: { data: any }) {
  const projects = data.projects ?? [];

  return (
    <div className="space-y-3">
      <StatGrid items={[{ label: "Total Projects", value: data.totalProjects ?? 0 }]} />
      {projects.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => (
          <div key={p.name} className="rounded-[10px] border border-border bg-[color:var(--surface-2)] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-sm font-semibold">{p.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {p.memberCount} members · {p.tasks?.total ?? 0} tasks · {p.totalHoursLogged}h logged
              </span>
            </div>
            <StatusBar
              segments={[
                { label: "Done", value: p.tasks?.done ?? 0, color: "#16A34A" },
                { label: "In Progress", value: p.tasks?.inProgress ?? 0, color: "#2563EB" },
                { label: "To Do", value: p.tasks?.todo ?? 0, color: "#94A3B8" },
              ]}
            />
            <div className="flex flex-wrap gap-1">
              {(p.members ?? []).map((name: string) => (
                <span
                  key={name}
                  className="rounded-full bg-[color:var(--secondary)] px-2 py-0.5 text-[10px] font-medium text-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared micro-components                                            */
/* ------------------------------------------------------------------ */

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    DONE: { bg: "var(--primary-soft)", fg: "var(--primary)" },
    IN_PROGRESS: { bg: "var(--info-soft)", fg: "var(--info)" },
    TODO: { bg: "var(--secondary)", fg: "var(--muted-foreground)" },
  };
  const c = map[status] ?? map.TODO;
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {status.replace("_", " ")}
    </span>
  );
}

"use client";

import { Trash2 } from "lucide-react";
import type { TimesheetStatus } from "@prisma/client";

import { StatusPill, type PillVariant } from "@/components/timeline/status-pill";
import { deleteTimesheetAction } from "../actions";

export type TimesheetRow = {
  id: string;
  hours: number;
  description: string;
  status: TimesheetStatus;
  createdAt: string;
  projectName: string;
  projectColor: string;
  taskTitle: string;
  taskId: string;
  priority: string;
  assigneeName: string;
};

const PRIORITY_VARIANT: Record<string, PillVariant> = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

const STATUS_VARIANT: Record<TimesheetStatus, PillVariant> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = d.getTime() === today.getTime();
  const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
  const date = d.toLocaleDateString(undefined, { day: "numeric", month: "long" });
  return isToday ? `Today, ${weekday}` : `${date}, ${weekday}`;
}

function formatTimeRange(iso: string, hours: number) {
  const start = new Date(iso);
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function DayGroup({ dateIso, rows }: { dateIso: string; rows: TimesheetRow[] }) {
  const total = rows.reduce((acc, r) => acc + r.hours, 0);
  return (
    <section className="surface-card overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold">{formatDayLabel(dateIso)}</h3>
          <p className="text-[11px] text-muted-foreground">
            {rows.length} entries · {total.toFixed(1)} hours
          </p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Project</th>
              <th className="px-3 py-3 font-medium">Task</th>
              <th className="px-3 py-3 font-medium">Priority</th>
              <th className="px-3 py-3 font-medium">Hours</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-secondary/40">
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ background: r.projectColor }}
                    />
                    <span className="text-sm">{r.projectName}</span>
                  </span>
                </td>
                <td className="px-3 py-3">
                  <p className="text-sm font-medium">{r.taskTitle}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {r.description}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <StatusPill variant={PRIORITY_VARIANT[r.priority] ?? "low"} />
                </td>
                <td className="px-3 py-3 text-sm tabular-nums">
                  {r.hours.toFixed(1)}h
                </td>
                <td className="px-3 py-3">
                  <StatusPill variant={STATUS_VARIANT[r.status]} />
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                  {formatTimeRange(r.createdAt, r.hours)}
                </td>
                <td className="px-5 py-3 text-right">
                  {r.status === "PENDING" ? (
                    <form action={deleteTimesheetAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="text-muted-foreground hover:text-[color:var(--danger)]"
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

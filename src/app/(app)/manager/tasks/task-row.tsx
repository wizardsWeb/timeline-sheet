"use client";

import type { TaskStatus } from "@prisma/client";
import {
  reassignTaskAction,
  setTaskPriorityAction,
} from "../actions";
import { updateTaskStatusAction } from "../../employee/actions";
import { StatusPill, type PillVariant } from "@/components/timeline/status-pill";

const STATUS_VARIANT: Record<TaskStatus, PillVariant> = {
  TODO: "todo",
  IN_PROGRESS: "inProgress",
  DONE: "done",
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

const NEXT_LABEL: Record<TaskStatus, string> = {
  TODO: "Start",
  IN_PROGRESS: "Mark done",
  DONE: "Reopen",
};

type Props = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: string;
  assigneeId: string;
  assigneeName: string;
  projectName: string;
  projectColor: string;
  employees: { id: string; name: string }[];
};

export function ManagerTaskRow(p: Props) {
  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{p.title}</p>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: p.projectColor + "1A",
                color: p.projectColor,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-sm"
                style={{ background: p.projectColor }}
              />
              {p.projectName}
            </span>
            <StatusPill variant={STATUS_VARIANT[p.status]} />
          </div>
          {p.description ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {p.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <form action={reassignTaskAction} className="flex items-center">
            <input type="hidden" name="taskId" value={p.id} />
            <select
              name="assignedTo"
              defaultValue={p.assigneeId}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="h-8 rounded-[10px] border border-border bg-surface px-2 text-xs outline-none focus:border-[color:var(--primary)]"
              aria-label="Reassign"
            >
              {p.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </form>
          <form action={setTaskPriorityAction} className="flex items-center">
            <input type="hidden" name="taskId" value={p.id} />
            <select
              name="priority"
              defaultValue={p.priority}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="h-8 rounded-[10px] border border-border bg-surface px-2 text-xs outline-none focus:border-[color:var(--primary)]"
              aria-label="Priority"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </form>
          <form action={updateTaskStatusAction}>
            <input type="hidden" name="taskId" value={p.id} />
            <input type="hidden" name="status" value={NEXT_STATUS[p.status]} />
            <button
              type="submit"
              className="rounded-[10px] border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-secondary"
            >
              {NEXT_LABEL[p.status]}
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

"use client";

import { ChevronRight } from "lucide-react";
import type { Task, Project, TaskStatus } from "@prisma/client";

import { StatusPill, type PillVariant } from "@/components/timeline/status-pill";
import { updateTaskStatusAction } from "../actions";

type TaskRow = Task & { project: Project | null };

type Props = {
  tasks: TaskRow[];
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

export function TaskList({ tasks }: Props) {
  return (
    <ul className="divide-y divide-border">
      {tasks.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between gap-4 px-5 py-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{t.title}</p>
              {t.project ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: t.project.color + "1A",
                    color: t.project.color,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-sm"
                    style={{ background: t.project.color }}
                  />
                  {t.project.name}
                </span>
              ) : (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Personal
                </span>
              )}
            </div>
            {t.description ? (
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {t.description}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <StatusPill variant={PRIORITY_VARIANT[t.priority] ?? "low"} />
            <StatusPill variant={STATUS_VARIANT[t.status]} />
            <form action={updateTaskStatusAction}>
              <input type="hidden" name="taskId" value={t.id} />
              <input type="hidden" name="status" value={NEXT_STATUS[t.status]} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-[10px] border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-secondary"
              >
                {NEXT_LABEL[t.status]}
                <ChevronRight className="h-3 w-3" />
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

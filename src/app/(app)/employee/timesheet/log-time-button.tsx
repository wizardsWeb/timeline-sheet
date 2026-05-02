"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Plus, X } from "lucide-react";

import { logTimesheetAction, type ActionState } from "../actions";

type Task = {
  id: string;
  title: string;
  project: { name: string; color: string } | null;
};

export function LogTimeButton({ tasks }: { tasks: Task[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    logTimesheetAction,
    null
  );

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={tasks.length === 0}
        className="inline-flex items-center gap-1.5 rounded-[10px] bg-[color:var(--primary)] px-3 py-2 text-xs font-semibold text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90 disabled:opacity-60"
        title={tasks.length === 0 ? "No active tasks to log against" : undefined}
      >
        <Plus className="h-3.5 w-3.5" />
        Log time
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[14px] border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Log time</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form ref={formRef} action={formAction} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-foreground/80">
                  Task
                </span>
                <select
                  name="taskId"
                  required
                  className="h-10 w-full rounded-[10px] border border-border bg-surface px-3 text-sm outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {(t.project?.name ?? "Personal") + " · " + t.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-foreground/80">
                  Hours
                </span>
                <input
                  name="hours"
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  required
                  defaultValue="1"
                  className="h-10 w-full rounded-[10px] border border-border bg-surface px-3 text-sm outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-foreground/80">
                  Description
                </span>
                <textarea
                  name="description"
                  rows={3}
                  required
                  className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-sm outline-none resize-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
                />
              </label>

              {state?.error ? (
                <p className="rounded-[10px] bg-[color:var(--danger-soft)] px-3 py-2 text-xs text-[color:var(--danger)]">
                  {state.error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-[10px] border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-[10px] bg-[color:var(--primary)] px-4 py-2 text-xs font-semibold text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90 disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Save entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

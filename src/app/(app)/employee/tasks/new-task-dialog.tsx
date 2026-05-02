"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Plus, X } from "lucide-react";

import { createPersonalTaskAction, type ActionState } from "../actions";

type Project = { id: string; name: string; color: string };

export function NewTaskDialog({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createPersonalTaskAction,
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
        className="inline-flex items-center gap-1.5 rounded-[10px] bg-[color:var(--primary)] px-3 py-2 text-xs font-semibold text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90"
      >
        <Plus className="h-3.5 w-3.5" />
        New task
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
              <h3 className="text-base font-semibold">New personal task</h3>
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
              <Field label="Title" name="title" required />
              <TextArea label="Description" name="description" />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Priority"
                  name="priority"
                  options={[
                    { value: "LOW", label: "Low" },
                    { value: "MEDIUM", label: "Medium" },
                    { value: "HIGH", label: "High" },
                  ]}
                  defaultValue="MEDIUM"
                />
                <Select
                  label="Space"
                  name="projectId"
                  options={[
                    { value: "", label: "Personal" },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
              </div>
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
                  {pending ? "Creating…" : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground/80">
        {label}
      </span>
      <input
        name={name}
        required={required}
        className="h-10 w-full rounded-[10px] border border-border bg-surface px-3 text-sm outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
      />
    </label>
  );
}

function TextArea({ label, name }: { label: string; name: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground/80">
        {label}
      </span>
      <textarea
        name={name}
        rows={3}
        className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-sm outline-none resize-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground/80">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-[10px] border border-border bg-surface px-3 text-sm outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
      >
        {options.map((o) => (
          <option key={o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

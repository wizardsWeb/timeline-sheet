"use client";

import { useState, useRef, useEffect } from "react";
import { useActionState } from "react";
import { Check, X } from "lucide-react";

import {
  approveTimesheetAction,
  rejectTimesheetAction,
  type ActionState,
} from "../actions";

type Props = {
  id: string;
  hours: number;
  description: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  taskTitle: string;
  projectName: string;
  projectColor: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ApprovalRow(props: Props) {
  const [mode, setMode] = useState<null | "approve" | "reject">(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [approveState, approveAction, approving] = useActionState<
    ActionState,
    FormData
  >(approveTimesheetAction, null);
  const [rejectState, rejectAction, rejecting] = useActionState<
    ActionState,
    FormData
  >(rejectTimesheetAction, null);

  useEffect(() => {
    if (approveState?.ok || rejectState?.ok) {
      setMode(null);
      formRef.current?.reset();
    }
  }, [approveState, rejectState]);

  const error = approveState?.error ?? rejectState?.error;

  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--primary-soft)] text-[color:var(--primary)] text-xs font-semibold shrink-0">
            {initials(props.userName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">{props.userName}</p>
              <span className="text-xs text-muted-foreground">
                {props.userEmail}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: props.projectColor + "1A",
                  color: props.projectColor,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-sm"
                  style={{ background: props.projectColor }}
                />
                {props.projectName}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium">{props.taskTitle}</p>
            <p className="text-xs text-muted-foreground">{props.description}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Logged {new Date(props.createdAt).toLocaleDateString()} ·{" "}
              <span className="tabular-nums font-medium text-foreground">
                {props.hours.toFixed(1)} hours
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mode !== "reject" ? (
            <button
              type="button"
              onClick={() => setMode("approve")}
              disabled={approving}
              className="inline-flex items-center gap-1 rounded-[10px] bg-[color:var(--primary)] px-3 py-1.5 text-xs font-semibold text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </button>
          ) : null}
          {mode !== "approve" ? (
            <button
              type="button"
              onClick={() => setMode("reject")}
              disabled={rejecting}
              className="inline-flex items-center gap-1 rounded-[10px] border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)]"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          ) : null}
        </div>
      </div>

      {mode ? (
        <form
          ref={formRef}
          action={mode === "approve" ? approveAction : rejectAction}
          className="mt-3 space-y-2"
        >
          <input type="hidden" name="timesheetId" value={props.id} />
          <textarea
            name="feedback"
            rows={2}
            placeholder={
              mode === "approve"
                ? "Optional feedback"
                : "Required: explain rejection"
            }
            required={mode === "reject"}
            className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-sm outline-none resize-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
          />
          {error ? (
            <p className="rounded-[10px] bg-[color:var(--danger-soft)] px-3 py-2 text-xs text-[color:var(--danger)]">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMode(null)}
              className="rounded-[10px] border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={approving || rejecting}
              className={
                mode === "approve"
                  ? "rounded-[10px] bg-[color:var(--primary)] px-4 py-1.5 text-xs font-semibold text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90 disabled:opacity-60"
                  : "rounded-[10px] bg-[color:var(--danger)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[color:var(--danger)]/90 disabled:opacity-60"
              }
            >
              {mode === "approve"
                ? approving
                  ? "Approving…"
                  : "Confirm approve"
                : rejecting
                ? "Rejecting…"
                : "Confirm reject"}
            </button>
          </div>
        </form>
      ) : null}
    </li>
  );
}

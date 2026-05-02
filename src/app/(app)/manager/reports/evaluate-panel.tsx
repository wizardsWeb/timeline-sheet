"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";

import { evaluateEmployeeAction } from "../actions";
import type { EvaluationResult } from "@/lib/types";

type State = { evaluation?: EvaluationResult; error?: string } | null;

export function EvaluatePanel({
  employees,
}: {
  employees: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    evaluateEmployeeAction,
    null
  );
  const evalResult = state?.evaluation;

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex items-center gap-2">
        <select
          name="userId"
          required
          defaultValue=""
          className="h-9 flex-1 rounded-[10px] border border-border bg-surface px-3 text-sm outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
        >
          <option value="" disabled>
            Choose employee…
          </option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-[10px] bg-[color:var(--primary)] px-3 py-2 text-xs font-semibold text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90 disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {pending ? "Generating…" : "Generate"}
        </button>
      </form>

      {state?.error ? (
        <p className="rounded-[10px] bg-[color:var(--danger-soft)] px-3 py-2 text-xs text-[color:var(--danger)]">
          {state.error}
        </p>
      ) : null}

      {evalResult ? (
        <div className="space-y-3 rounded-[10px] border border-border bg-secondary/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Score
            </p>
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
              style={{
                background: "var(--primary-soft)",
                color: "var(--primary)",
              }}
            >
              {evalResult.score}
            </span>
          </div>
          <p className="text-sm">{evalResult.summary}</p>
          {evalResult.strengths.length ? (
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Strengths
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-xs">
                {evalResult.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {evalResult.improvements.length ? (
            <div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Improvements
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-xs">
                {evalResult.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {evalResult.appraisal ? (
            <p className="text-xs italic text-muted-foreground">
              {evalResult.appraisal}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { signupAction, type AuthState } from "../actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signupAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Full name" name="name" type="text" autoComplete="name" required />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="Min. 8 characters"
      />
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-foreground/80">
          Role
        </span>
        <div className="grid grid-cols-2 gap-2">
          <RoleOption value="EMPLOYEE" label="Employee" defaultChecked />
          <RoleOption value="MANAGER" label="Manager" />
        </div>
      </label>
      {state?.error ? (
        <p className="rounded-[10px] bg-[color:var(--danger-soft)] px-3 py-2 text-xs text-[color:var(--danger)]">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[10px] bg-[color:var(--primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)]/90 disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function RoleOption({
  value,
  label,
  defaultChecked,
}: {
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="relative cursor-pointer">
      <input
        type="radio"
        name="role"
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="flex items-center justify-center rounded-[10px] border border-border bg-surface px-3 py-2 text-sm font-medium peer-checked:border-[color:var(--primary)] peer-checked:bg-[color:var(--primary-soft)] peer-checked:text-[color:var(--primary)]">
        {label}
      </span>
    </label>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground/80">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="h-10 w-full rounded-[10px] border border-border bg-surface px-3 text-sm outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
      />
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

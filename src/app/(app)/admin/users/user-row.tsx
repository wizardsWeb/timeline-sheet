"use client";

import { Trash2 } from "lucide-react";
import type { Role } from "@prisma/client";

import { RoleBadge } from "@/components/timeline/role-badge";
import { deleteUserAction, updateUserRoleAction } from "../actions";

type Props = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  isSelf: boolean;
};

export function UserRow({ id, name, email, role, createdAt, isSelf }: Props) {
  return (
    <tr className="hover:bg-secondary/40">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--primary-soft)] text-[color:var(--primary)] text-xs font-semibold">
            {name
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("")}
          </span>
          <span className="font-medium">{name}</span>
          {isSelf ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              You
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3 text-muted-foreground">{email}</td>
      <td className="px-3 py-3">
        {isSelf ? (
          <RoleBadge role={role} />
        ) : (
          <form action={updateUserRoleAction} className="flex items-center">
            <input type="hidden" name="userId" value={id} />
            <select
              name="role"
              defaultValue={role}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="h-8 rounded-[10px] border border-border bg-surface px-2 text-xs outline-none focus:border-[color:var(--primary)]"
              aria-label="Role"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </form>
        )}
      </td>
      <td className="px-3 py-3 text-muted-foreground">
        {new Date(createdAt).toLocaleDateString()}
      </td>
      <td className="px-5 py-3 text-right">
        {isSelf ? null : (
          <form action={deleteUserAction}>
            <input type="hidden" name="userId" value={id} />
            <button
              type="submit"
              className="text-muted-foreground hover:text-[color:var(--danger)]"
              title="Delete user"
              aria-label="Delete user"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
      </td>
    </tr>
  );
}

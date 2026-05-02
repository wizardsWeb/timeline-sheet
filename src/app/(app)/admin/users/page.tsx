import { ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { UserRow } from "./user-row";
import { NewUserDialog } from "./new-user-dialog";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await requireRole("ADMIN");
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage workspace membership and roles."
        actions={<NewUserDialog />}
      />
      <SectionCard
        title={`${users.length} accounts`}
        actions={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin only
          </span>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  id={u.id}
                  name={u.name}
                  email={u.email}
                  role={u.role}
                  createdAt={u.createdAt.toISOString()}
                  isSelf={u.id === me.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}

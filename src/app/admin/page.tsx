import { AdminDashboard } from "@/components/custom/admin-dashboard";
import { AppShell } from "@/components/custom/app-shell";
import { getWorkforceSnapshot } from "@/lib/data/workforce";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const snapshot = await getWorkforceSnapshot();

  return (
    <AppShell
      users={snapshot.users}
      heading="Admin Workspace"
      subheading="Monitor users, system load, and workflow health across the workforce platform."
    >
      <AdminDashboard snapshot={snapshot} />
    </AppShell>
  );
}

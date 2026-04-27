import { AppShell } from "@/components/custom/app-shell";
import { ManagerDashboard } from "@/components/custom/manager-dashboard";
import { getWorkforceSnapshot } from "@/lib/data/workforce";

export const dynamic = "force-dynamic";

export default async function ManagerPage() {
  const snapshot = await getWorkforceSnapshot();

  return (
    <AppShell
      users={snapshot.users}
      heading="Manager Workspace"
      subheading="Review team output, approve timesheets, and assign new tasks."
    >
      <ManagerDashboard snapshot={snapshot} />
    </AppShell>
  );
}

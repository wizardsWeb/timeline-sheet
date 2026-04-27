import { AppShell } from "@/components/custom/app-shell";
import { DashboardOverview } from "@/components/custom/dashboard-overview";
import { getWorkforceSnapshot } from "@/lib/data/workforce";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const snapshot = await getWorkforceSnapshot();

  return (
    <AppShell
      users={snapshot.users}
      heading="Workforce Control Center"
      subheading="Role-driven operations across attendance, timesheets, tasks, and AI evaluation."
    >
      <DashboardOverview snapshot={snapshot} />
    </AppShell>
  );
}

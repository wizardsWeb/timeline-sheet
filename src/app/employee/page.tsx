import { AppShell } from "@/components/custom/app-shell";
import { EmployeeDashboard } from "@/components/custom/employee-dashboard";
import { getWorkforceSnapshot } from "@/lib/data/workforce";

export const dynamic = "force-dynamic";

export default async function EmployeePage() {
  const snapshot = await getWorkforceSnapshot();

  return (
    <AppShell
      users={snapshot.users}
      heading="Employee Workspace"
      subheading="Manage attendance, work logs, and AI-based performance insights."
    >
      <EmployeeDashboard snapshot={snapshot} />
    </AppShell>
  );
}

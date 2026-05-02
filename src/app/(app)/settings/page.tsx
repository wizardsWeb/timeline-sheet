import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { RoleBadge } from "@/components/timeline/role-badge";
import { logoutAction } from "@/app/(auth)/actions";

export default async function SettingsPage() {
  const user = await requireSession();
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Account and workspace preferences."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Account">
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <Row label="Name" value={user.name} />
            <Row label="Email" value={user.email} />
            <Row label="Role" value={<RoleBadge role={user.role} />} />
          </dl>
        </SectionCard>
        <SectionCard title="Session">
          <p className="text-sm text-muted-foreground mb-3">
            Sign out of this device. Profile editing lands in a later phase.
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-[10px] border border-border bg-surface px-4 py-2 text-sm font-medium text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)]"
            >
              Log out
            </button>
          </form>
        </SectionCard>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

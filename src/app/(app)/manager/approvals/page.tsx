import { CheckSquare } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/timeline/page-header";
import { SectionCard } from "@/components/timeline/section-card";
import { EmptyState } from "@/components/timeline/empty-state";
import { ApprovalRow } from "./approval-row";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const pending = await prisma.timesheet.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      task: { include: { project: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Approvals"
        subtitle={
          pending.length === 0
            ? "All caught up — no pending timesheets."
            : `${pending.length} timesheets awaiting review.`
        }
      />

      {pending.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Inbox zero"
          description="New timesheet submissions will appear here."
        />
      ) : (
        <SectionCard title={`${pending.length} pending`} bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {pending.map((t) => (
              <ApprovalRow
                key={t.id}
                id={t.id}
                hours={t.hours}
                description={t.description}
                createdAt={t.createdAt.toISOString()}
                userName={t.user.name}
                userEmail={t.user.email}
                taskTitle={t.task.title}
                projectName={t.task.project?.name ?? "Personal"}
                projectColor={t.task.project?.color ?? "#9CA3AF"}
              />
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}

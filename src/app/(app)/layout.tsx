import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell/app-shell";
import { prisma } from "@/lib/db/prisma";
import type { Notification } from "@/components/app-shell/notifications";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: { project: true },
    orderBy: { project: { name: "asc" } },
  });
  const projects = memberships.map((m) => ({
    id: m.project.id,
    name: m.project.name,
    color: m.project.color,
  }));

  const notifications = await loadNotifications(user.id, user.role);

  return (
    <AppShell user={user} projects={projects} notifications={notifications}>
      {children}
    </AppShell>
  );
}

async function loadNotifications(
  userId: string,
  role: "EMPLOYEE" | "MANAGER" | "ADMIN"
): Promise<Notification[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const list: Notification[] = [];

  if (role === "EMPLOYEE") {
    const [rejected, newTasks] = await Promise.all([
      prisma.timesheet.count({
        where: { userId, status: "REJECTED", createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.task.count({
        where: { assignedTo: userId, status: "TODO", createdAt: { gte: sevenDaysAgo } },
      }),
    ]);
    if (rejected > 0) {
      list.push({
        title: `${rejected} timesheet${rejected > 1 ? "s" : ""} rejected`,
        description: "Review feedback and resubmit.",
        href: "/employee/timesheet",
      });
    }
    if (newTasks > 0) {
      list.push({
        title: `${newTasks} new task${newTasks > 1 ? "s" : ""} assigned`,
        description: "Open them and start.",
        href: "/employee/tasks",
      });
    }
  }

  if (role === "MANAGER" || role === "ADMIN") {
    const pending = await prisma.timesheet.count({ where: { status: "PENDING" } });
    if (pending > 0) {
      list.push({
        title: `${pending} pending approval${pending > 1 ? "s" : ""}`,
        description: "Review timesheets awaiting your call.",
        href: "/manager/approvals",
      });
    }
  }

  if (role === "ADMIN") {
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });
    if (newUsers > 0) {
      list.push({
        title: `${newUsers} new user${newUsers > 1 ? "s" : ""} this week`,
        description: "Confirm roles and project access.",
        href: "/admin/users",
      });
    }
  }

  return list;
}

import { prisma } from "@/lib/db/prisma";
import type { DashboardSnapshot } from "@/lib/types";

function toIsoString(value: Date): string {
  return value.toISOString();
}

function toNullableIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export async function getWorkforceSnapshot(): Promise<DashboardSnapshot> {
  const [users, attendances, tasks, timesheets, approvals] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    prisma.attendance.findMany({
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
    prisma.task.findMany({
      include: {
        assignee: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.timesheet.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
        task: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.approval.findMany({
      include: {
        manager: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: toIsoString(user.createdAt),
    })),
    attendances: attendances.map((attendance) => ({
      id: attendance.id,
      userId: attendance.userId,
      checkIn: toNullableIsoString(attendance.checkIn),
      checkOut: toNullableIsoString(attendance.checkOut),
      createdAt: toIsoString(attendance.createdAt),
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      assignedToName: task.assignee.name,
      status: task.status,
      createdAt: toIsoString(task.createdAt),
    })),
    timesheets: timesheets.map((timesheet) => ({
      id: timesheet.id,
      userId: timesheet.userId,
      userName: timesheet.user.name,
      taskId: timesheet.taskId,
      taskTitle: timesheet.task.title,
      description: timesheet.description,
      hours: timesheet.hours,
      status: timesheet.status,
      createdAt: toIsoString(timesheet.createdAt),
    })),
    approvals: approvals.map((approval) => ({
      id: approval.id,
      timesheetId: approval.timesheetId,
      managerId: approval.managerId,
      managerName: approval.manager.name,
      decision: approval.decision,
      feedback: approval.feedback,
      createdAt: toIsoString(approval.createdAt),
    })),
  };
}

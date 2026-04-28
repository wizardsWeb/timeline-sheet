import { prisma } from "@/lib/db/prisma";
import type { ApprovalDecision } from "@prisma/client";

export const timesheetAgent = {
  /**
   * Create a new timesheet entry.
   */
  async createTimesheet(data: {
    userId: string;
    taskId: string;
    description: string;
    hours: number;
  }) {
    if (data.hours <= 0 || data.hours > 24) {
      throw new Error("Hours must be between 0 and 24");
    }

    if (!data.description.trim()) {
      throw new Error("Description is required");
    }

    const [user, task] = await Promise.all([
      prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true, role: true },
      }),
      prisma.task.findUnique({
        where: { id: data.taskId },
        select: { id: true, assignedTo: true },
      }),
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "EMPLOYEE") {
      throw new Error("Only employees can create timesheets");
    }

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.assignedTo !== data.userId) {
      throw new Error("You can only log time against tasks assigned to you");
    }

    return prisma.timesheet.create({
      data: {
        userId: data.userId,
        taskId: data.taskId,
        description: data.description.trim(),
        hours: data.hours,
        status: "PENDING",
      },
    });
  },

  /**
   * Get all timesheets for a user.
   */
  async getUserTimesheets(userId: string) {
    return prisma.timesheet.findMany({
      where: { userId },
      include: {
        task: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get all pending timesheets (for manager review).
   */
  async getPendingTimesheets() {
    return prisma.timesheet.findMany({
      where: { status: "PENDING" },
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
    });
  },

  /**
   * Update timesheet. Prevents edit after approval.
   */
  async updateTimesheet(
    timesheetId: string,
    data: { description?: string; hours?: number }
  ) {
    const existing = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
    });

    if (!existing) {
      throw new Error("Timesheet not found");
    }

    if (existing.status === "APPROVED") {
      throw new Error("Cannot edit an approved timesheet");
    }

    if (existing.status === "PENDING") {
      const existingApproval = await prisma.approval.findFirst({
        where: { timesheetId },
      });
      if (existingApproval) {
        throw new Error("Cannot edit a timesheet that is under manager review");
      }
    }

    if (data.hours !== undefined && (data.hours <= 0 || data.hours > 24)) {
      throw new Error("Hours must be between 0 and 24");
    }

    return prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.hours !== undefined && { hours: data.hours }),
        status: "PENDING", // Reset to pending on edit
      },
    });
  },

  /**
   * Get total logged hours for a user.
   */
  async getTotalHours(userId: string): Promise<number> {
    const timesheets = await prisma.timesheet.findMany({
      where: { userId },
    });
    return timesheets.reduce((sum, ts) => sum + ts.hours, 0);
  },

  /**
   * Review a pending timesheet and store manager feedback.
   */
  async reviewTimesheet(data: {
    timesheetId: string;
    managerId: string;
    feedback: string;
    decision: ApprovalDecision;
  }) {
    const [timesheet, manager, existingApproval] = await Promise.all([
      prisma.timesheet.findUnique({
        where: { id: data.timesheetId },
      }),
      prisma.user.findUnique({
        where: { id: data.managerId },
        select: { id: true, role: true },
      }),
      prisma.approval.findFirst({
        where: { timesheetId: data.timesheetId },
        select: { id: true },
      }),
    ]);

    if (!timesheet) {
      throw new Error("Timesheet not found");
    }

    if (!manager) {
      throw new Error("Manager not found");
    }

    if (manager.role !== "MANAGER") {
      throw new Error("Only managers can review timesheets");
    }

    if (timesheet.status !== "PENDING") {
      throw new Error("Only pending timesheets can be reviewed");
    }

    if (!data.feedback.trim()) {
      throw new Error("Feedback is required");
    }

    if (existingApproval) {
      throw new Error("This timesheet has already been reviewed");
    }

    const nextStatus = data.decision === "APPROVED" ? "APPROVED" : "REJECTED";

    return prisma.$transaction(async (tx) => {
      const updatedTimesheet = await tx.timesheet.update({
        where: { id: data.timesheetId },
        data: { status: nextStatus },
      });

      const approval = await tx.approval.create({
        data: {
          timesheetId: data.timesheetId,
          managerId: data.managerId,
          feedback: data.feedback.trim(),
          decision: data.decision,
        },
      });

      return { updatedTimesheet, approval };
    });
  },

  /**
   * Delete a timesheet entry. Only allowed when status is PENDING and no approval exists.
   */
  async deleteTimesheet(timesheetId: string) {
    const existing = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
    });

    if (!existing) {
      throw new Error("Timesheet not found");
    }

    if (existing.status === "APPROVED") {
      throw new Error("Cannot delete an approved timesheet");
    }

    const existingApproval = await prisma.approval.findFirst({
      where: { timesheetId },
    });

    if (existingApproval) {
      throw new Error("Cannot delete a timesheet that has already been reviewed");
    }

    return prisma.timesheet.delete({
      where: { id: timesheetId },
    });
  },
};

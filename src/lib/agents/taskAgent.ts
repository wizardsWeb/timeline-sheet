import { prisma } from "@/lib/db/prisma";
import type { TaskStatus } from "@prisma/client";

export const taskAgent = {
  /**
   * Create a new task.
   */
  async createTask(data: {
    title: string;
    description: string;
    assignedTo: string;
  }) {
    if (!data.title.trim()) {
      throw new Error("Task title is required");
    }

    if (!data.description.trim()) {
      throw new Error("Task description is required");
    }

    const assignee = await prisma.user.findUnique({
      where: { id: data.assignedTo },
      select: { id: true, role: true },
    });

    if (!assignee) {
      throw new Error("Assignee not found");
    }

    if (assignee.role !== "EMPLOYEE") {
      throw new Error("Tasks can only be assigned to employees");
    }

    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        assignedTo: data.assignedTo,
        status: "TODO",
      },
    });
  },

  /**
   * Get tasks assigned to a user.
   */
  async getUserTasks(userId: string) {
    return prisma.task.findMany({
      where: { assignedTo: userId },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get all tasks.
   */
  async getAllTasks() {
    return prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Assign a task to a user.
   */
  async assignTask(taskId: string, userId: string) {
    const [task, user] = await Promise.all([
      prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      }),
    ]);

    if (!task) {
      throw new Error("Task not found");
    }

    if (!user) {
      throw new Error("Cannot assign task to a non-existent user");
    }

    if (user.role !== "EMPLOYEE") {
      throw new Error("Tasks can only be assigned to employees");
    }

    return prisma.task.update({
      where: { id: taskId },
      data: { assignedTo: userId },
    });
  },

  /**
   * Update task status.
   */
  async updateStatus(taskId: string, status: TaskStatus) {
    const validStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    return prisma.task.update({
      where: { id: taskId },
      data: { status },
    });
  },

  /**
   * Get task completion stats for a user.
   */
  async getCompletionStats(userId: string) {
    const tasks = await prisma.task.findMany({
      where: { assignedTo: userId },
    });

    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const todo = tasks.filter((t) => t.status === "TODO").length;

    return { total, done, inProgress, todo };
  },
};

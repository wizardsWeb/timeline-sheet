"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth";

const REVALIDATE = ["/overview", "/employee/tasks", "/employee/timesheet", "/employee/calendar"];

function revalidateAll() {
  for (const p of REVALIDATE) revalidatePath(p);
}

const TaskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

const CreateTaskSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: z.string().trim().max(500).default(""),
  priority: PriorityEnum.default("MEDIUM"),
  projectId: z.string().optional(),
});

export type ActionState = { ok?: boolean; error?: string } | null;

export async function createPersonalTaskAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireSession();
  const parsed = CreateTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    priority: formData.get("priority") ?? "MEDIUM",
    projectId: formData.get("projectId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { title, description, priority, projectId } = parsed.data;

  if (projectId) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (!member) return { error: "You are not a member of that space" };
  }

  await prisma.task.create({
    data: {
      title,
      description,
      priority,
      assignedTo: user.id,
      projectId: projectId ?? null,
      status: "TODO",
    },
  });
  revalidateAll();
  return { ok: true };
}

export async function updateTaskStatusAction(formData: FormData) {
  const user = await requireSession();
  const taskId = String(formData.get("taskId") ?? "");
  const status = TaskStatusEnum.safeParse(formData.get("status"));
  if (!taskId || !status.success) return;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;

  const isOwner = task.assignedTo === user.id;
  const isPrivileged = user.role === "MANAGER" || user.role === "ADMIN";
  if (!isOwner && !isPrivileged) return;

  await prisma.task.update({
    where: { id: taskId },
    data: { status: status.data },
  });
  revalidateAll();
}

const LogTimesheetSchema = z.object({
  taskId: z.string().min(1, "Pick a task"),
  hours: z.coerce.number().positive("Hours must be > 0").max(24, "Hours must be ≤ 24"),
  description: z.string().trim().min(1, "Description is required").max(500),
});

export async function logTimesheetAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireSession();
  const parsed = LogTimesheetSchema.safeParse({
    taskId: formData.get("taskId"),
    hours: formData.get("hours"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { taskId, hours, description } = parsed.data;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.assignedTo !== user.id) {
    return { error: "Task not assigned to you" };
  }

  await prisma.timesheet.create({
    data: {
      userId: user.id,
      taskId,
      hours,
      description,
      status: "PENDING",
    },
  });
  revalidateAll();
  return { ok: true };
}

export async function deleteTimesheetAction(formData: FormData) {
  const user = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const ts = await prisma.timesheet.findUnique({ where: { id } });
  if (!ts || ts.userId !== user.id || ts.status !== "PENDING") return;
  await prisma.timesheet.delete({ where: { id } });
  revalidateAll();
}

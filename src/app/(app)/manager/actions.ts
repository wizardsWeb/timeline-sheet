"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth";
import { evaluationAgent } from "@/lib/agents/evaluationAgent";
import type { EvaluationResult } from "@/lib/types";

const REVALIDATE = [
  "/overview",
  "/manager/approvals",
  "/manager/timesheets",
  "/manager/tasks",
  "/manager/reports",
  "/admin/timesheets",
  "/admin/tasks",
];

function revalidateAll() {
  for (const p of REVALIDATE) revalidatePath(p);
}

const ApproveSchema = z.object({
  timesheetId: z.string().min(1),
  feedback: z.string().trim().max(500).default(""),
});

const RejectSchema = z.object({
  timesheetId: z.string().min(1),
  feedback: z.string().trim().min(1, "Feedback is required to reject").max(500),
});

export type ActionState = { ok?: boolean; error?: string } | null;

export async function approveTimesheetAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const manager = await requireRole("MANAGER", "ADMIN");
  const parsed = ApproveSchema.safeParse({
    timesheetId: formData.get("timesheetId"),
    feedback: formData.get("feedback") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const { timesheetId, feedback } = parsed.data;

  await prisma.$transaction([
    prisma.timesheet.update({
      where: { id: timesheetId },
      data: { status: "APPROVED" },
    }),
    prisma.approval.create({
      data: {
        timesheetId,
        managerId: manager.id,
        feedback,
        decision: "APPROVED",
      },
    }),
  ]);
  revalidateAll();
  return { ok: true };
}

export async function rejectTimesheetAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const manager = await requireRole("MANAGER", "ADMIN");
  const parsed = RejectSchema.safeParse({
    timesheetId: formData.get("timesheetId"),
    feedback: formData.get("feedback"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const { timesheetId, feedback } = parsed.data;

  await prisma.$transaction([
    prisma.timesheet.update({
      where: { id: timesheetId },
      data: { status: "REJECTED" },
    }),
    prisma.approval.create({
      data: {
        timesheetId,
        managerId: manager.id,
        feedback,
        decision: "REJECTED",
      },
    }),
  ]);
  revalidateAll();
  return { ok: true };
}

const CreateAssignedTaskSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().trim().max(500).default(""),
  assignedTo: z.string().min(1, "Pick an assignee"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  projectId: z.string().optional(),
});

export async function createAssignedTaskAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("MANAGER", "ADMIN");
  const parsed = CreateAssignedTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    assignedTo: formData.get("assignedTo"),
    priority: formData.get("priority") ?? "MEDIUM",
    projectId: formData.get("projectId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };

  const assignee = await prisma.user.findUnique({
    where: { id: parsed.data.assignedTo },
  });
  if (!assignee) return { error: "Assignee not found" };

  await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      assignedTo: parsed.data.assignedTo,
      priority: parsed.data.priority,
      projectId: parsed.data.projectId ?? null,
      status: "TODO",
    },
  });
  revalidateAll();
  return { ok: true };
}

export async function reassignTaskAction(formData: FormData) {
  await requireRole("MANAGER", "ADMIN");
  const taskId = String(formData.get("taskId") ?? "");
  const assignedTo = String(formData.get("assignedTo") ?? "");
  if (!taskId || !assignedTo) return;
  const user = await prisma.user.findUnique({ where: { id: assignedTo } });
  if (!user) return;
  await prisma.task.update({ where: { id: taskId }, data: { assignedTo } });
  revalidateAll();
}

export async function setTaskPriorityAction(formData: FormData) {
  await requireRole("MANAGER", "ADMIN");
  const taskId = String(formData.get("taskId") ?? "");
  const priority = String(formData.get("priority") ?? "");
  if (!taskId || !["LOW", "MEDIUM", "HIGH"].includes(priority)) return;
  await prisma.task.update({ where: { id: taskId }, data: { priority } });
  revalidateAll();
}

export async function evaluateEmployeeAction(
  _: { evaluation?: EvaluationResult; error?: string } | null,
  formData: FormData
): Promise<{ evaluation?: EvaluationResult; error?: string }> {
  await requireRole("MANAGER", "ADMIN");
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "Pick an employee" };
  try {
    const evaluation = await evaluationAgent.evaluate(userId);
    return { evaluation };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Evaluation failed",
    };
  }
}

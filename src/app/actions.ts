"use server";

import { revalidatePath } from "next/cache";
import type { ApprovalDecision, TaskStatus } from "@prisma/client";
import { attendanceAgent } from "@/lib/agents/attendanceAgent";
import { evaluationAgent } from "@/lib/agents/evaluationAgent";
import { taskAgent } from "@/lib/agents/taskAgent";
import { timesheetAgent } from "@/lib/agents/timesheetAgent";
import type { ActionResult, EvaluationResult } from "@/lib/types";

const WORKFORCE_PATHS = ["/dashboard", "/employee", "/manager", "/admin"];

function revalidateWorkforceViews(): void {
  for (const path of WORKFORCE_PATHS) {
    revalidatePath(path);
  }
}

function fail(message: string): ActionResult {
  return { ok: false, message };
}

export async function checkInAction(userId: string): Promise<ActionResult> {
  if (!userId) {
    return fail("User is required for check-in");
  }

  try {
    await attendanceAgent.checkIn(userId);
    revalidateWorkforceViews();
    return { ok: true, message: "Checked in successfully" };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Check-in failed");
  }
}

export async function checkOutAction(userId: string): Promise<ActionResult> {
  if (!userId) {
    return fail("User is required for check-out");
  }

  try {
    await attendanceAgent.checkOut(userId);
    revalidateWorkforceViews();
    return { ok: true, message: "Checked out successfully" };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Check-out failed");
  }
}

export async function createTimesheetAction(data: {
  userId: string;
  taskId: string;
  description: string;
  hours: number;
}): Promise<ActionResult> {
  if (!data.userId || !data.taskId) {
    return fail("User and task are required");
  }

  try {
    await timesheetAgent.createTimesheet(data);
    revalidateWorkforceViews();
    return { ok: true, message: "Timesheet created successfully" };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not create timesheet");
  }
}

export async function updateTaskStatusAction(data: {
  taskId: string;
  status: TaskStatus;
}): Promise<ActionResult> {
  if (!data.taskId) {
    return fail("Task is required");
  }

  try {
    await taskAgent.updateStatus(data.taskId, data.status);
    revalidateWorkforceViews();
    return { ok: true, message: "Task status updated" };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not update task status");
  }
}

export async function createTaskAction(data: {
  title: string;
  description: string;
  assignedTo: string;
}): Promise<ActionResult> {
  if (!data.assignedTo) {
    return fail("Assignee is required");
  }

  try {
    await taskAgent.createTask(data);
    revalidateWorkforceViews();
    return { ok: true, message: "Task created successfully" };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not create task");
  }
}

export async function assignTaskAction(data: {
  taskId: string;
  userId: string;
}): Promise<ActionResult> {
  if (!data.taskId || !data.userId) {
    return fail("Task and assignee are required");
  }

  try {
    await taskAgent.assignTask(data.taskId, data.userId);
    revalidateWorkforceViews();
    return { ok: true, message: "Task assignment updated" };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not assign task");
  }
}

export async function reviewTimesheetAction(data: {
  timesheetId: string;
  managerId: string;
  feedback: string;
  decision: ApprovalDecision;
}): Promise<ActionResult> {
  if (!data.timesheetId || !data.managerId) {
    return fail("Timesheet and manager are required");
  }

  try {
    await timesheetAgent.reviewTimesheet(data);
    revalidateWorkforceViews();
    return {
      ok: true,
      message:
        data.decision === "APPROVED"
          ? "Timesheet approved"
          : "Timesheet rejected",
    };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not review timesheet");
  }
}

export async function generateEvaluationAction(
  userId: string
): Promise<ActionResult<EvaluationResult>> {
  if (!userId) {
    return { ok: false, message: "User is required for evaluation" };
  }

  try {
    const evaluation = await evaluationAgent.evaluate(userId);
    return {
      ok: true,
      message: "Evaluation generated",
      data: evaluation,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Evaluation could not be generated",
    };
  }
}

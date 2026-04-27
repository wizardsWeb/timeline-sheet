import { prisma } from "@/lib/db/prisma";
import type { EvaluationResult } from "@/lib/types";
import { callGemini } from "@/lib/services/gemini";
import { attendanceAgent } from "./attendanceAgent";

const NO_DATA_EVALUATION: EvaluationResult = {
  score: 0,
  summary: "No work data is available for this employee yet.",
  strengths: ["No attendance, task, or timesheet activity has been recorded yet."],
  improvements: ["Check in, update tasks, and submit timesheets to generate an appraisal."],
  appraisal: "Insufficient data is available to produce a performance evaluation.",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildFallbackEvaluation(input: {
  totalWorkingHours: number;
  totalLoggedHours: number;
  attendanceCount: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  approvedTimesheets: number;
  rejectedTimesheets: number;
  totalTimesheets: number;
  latestFeedback: string[];
  reason: string;
}): EvaluationResult {
  const averageDailyHours =
    input.attendanceCount > 0 ? input.totalWorkingHours / input.attendanceCount : 0;
  const completionRate =
    input.totalTasks > 0 ? input.completedTasks / input.totalTasks : 0;
  const approvalRate =
    input.totalTimesheets > 0 ? input.approvedTimesheets / input.totalTimesheets : 0;
  const loggingCoverage =
    input.totalWorkingHours > 0
      ? clamp(input.totalLoggedHours / input.totalWorkingHours, 0, 1)
      : input.totalLoggedHours > 0
        ? 1
        : 0;

  const attendanceScore =
    input.attendanceCount === 0
      ? 0
      : clamp((averageDailyHours / 8) * 28 + Math.min(input.attendanceCount, 5), 0, 33);
  const taskScore =
    input.totalTasks === 0
      ? 10
      : clamp(completionRate * 37 + (input.inProgressTasks > 0 ? 4 : 0), 0, 37);
  const timesheetScore =
    input.totalTimesheets === 0
      ? 0
      : clamp(approvalRate * 18 + loggingCoverage * 12, 0, 30);

  const score = Math.round(clamp(attendanceScore + taskScore + timesheetScore, 0, 100));

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (averageDailyHours >= 7.5) {
    strengths.push("Attendance coverage is consistent across recent working days.");
  }
  if (completionRate >= 0.5 || input.inProgressTasks > 0) {
    strengths.push("Task execution shows steady forward movement across assigned work.");
  }
  if (approvalRate >= 0.5 && input.totalTimesheets > 0) {
    strengths.push("Submitted work logs are generally landing with positive manager feedback.");
  }
  if (loggingCoverage >= 0.75 && input.totalTimesheets > 0) {
    strengths.push("Timesheet logging covers most recorded attendance time.");
  }
  if (input.latestFeedback.length > 0) {
    strengths.push("Recent manager reviews provide actionable signals for continued growth.");
  }

  if (completionRate < 0.5 && input.totalTasks > 0) {
    improvements.push("Close more assigned tasks to improve completion throughput.");
  }
  if (loggingCoverage < 0.7 && input.totalWorkingHours > 0) {
    improvements.push("Align logged time more closely with attendance to improve reporting quality.");
  }
  if (input.rejectedTimesheets > 0) {
    improvements.push("Address rejected timesheet feedback to improve review outcomes.");
  }
  if (averageDailyHours > 0 && averageDailyHours < 7) {
    improvements.push("Maintain a steadier daily working rhythm during the recorded period.");
  }

  if (strengths.length === 0) {
    strengths.push("Baseline activity exists across the workflow and can now be improved.");
  }

  if (improvements.length === 0) {
    improvements.push("Keep building consistency across delivery, logging, and manager-ready communication.");
  }

  const latestFeedbackLine =
    input.latestFeedback.length > 0
      ? ` Recent manager feedback highlights: ${input.latestFeedback.join(" ")}`
      : "";

  return {
    score,
    summary: `${input.reason} Current performance is being estimated from attendance consistency, task progress, and timesheet quality.${latestFeedbackLine}`,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    appraisal: `The employee is showing ${score >= 75 ? "strong" : score >= 55 ? "developing" : "early-stage"} execution across the available workforce signals. Attendance records, task progression, and work-log discipline indicate ${completionRate >= 0.5 ? "credible delivery momentum" : "some delivery progress with room to improve closure"}. The next step is to strengthen consistency in the weaker areas surfaced above and translate manager feedback into measurable follow-through.`,
  };
}

function parseEvaluationResponse(response: string): EvaluationResult | null {
  try {
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : response.trim();
    const parsed = JSON.parse(jsonString);

    return {
      score:
        typeof parsed.score === "number"
          ? clamp(Math.round(parsed.score), 0, 100)
          : 0,
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim()
          : "No summary provided.",
      strengths: Array.isArray(parsed.strengths)
        ? parsed.strengths.filter((item: unknown): item is string => typeof item === "string")
        : [],
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements.filter((item: unknown): item is string => typeof item === "string")
        : [],
      appraisal:
        typeof parsed.appraisal === "string" && parsed.appraisal.trim()
          ? parsed.appraisal.trim()
          : "No appraisal provided.",
    };
  } catch {
    return null;
  }
}

export const evaluationAgent = {
  async evaluate(userId: string): Promise<EvaluationResult> {
    const [attendance, timesheets, tasks] = await Promise.all([
      prisma.attendance.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.timesheet.findMany({
        where: { userId },
        include: {
          approvals: {
            select: {
              decision: true,
              feedback: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.findMany({
        where: { assignedTo: userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (attendance.length === 0 && timesheets.length === 0 && tasks.length === 0) {
      return NO_DATA_EVALUATION;
    }

    const totalWorkingHours = attendanceAgent.calculateWorkingHours(attendance);
    const totalLoggedHours = timesheets.reduce((sum, entry) => sum + entry.hours, 0);
    const approvedTimesheets = timesheets.filter((entry) => entry.status === "APPROVED").length;
    const rejectedTimesheets = timesheets.filter((entry) => entry.status === "REJECTED").length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === "DONE").length;
    const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS").length;
    const latestFeedback = timesheets
      .flatMap((timesheet) => timesheet.approvals.map((approval) => approval.feedback))
      .filter(Boolean)
      .slice(0, 3);

    const fallback = buildFallbackEvaluation({
      totalWorkingHours,
      totalLoggedHours,
      attendanceCount: attendance.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      approvedTimesheets,
      rejectedTimesheets,
      totalTimesheets: timesheets.length,
      latestFeedback,
      reason: "Gemini evaluation is unavailable, so a rules-based fallback was used.",
    });

    const attendanceSummary = attendance.slice(0, 7).map((record) => ({
      date: record.createdAt.toISOString(),
      checkIn: record.checkIn?.toISOString() ?? null,
      checkOut: record.checkOut?.toISOString() ?? null,
      durationHours:
        record.checkIn && record.checkOut
          ? Number(
              (
                (record.checkOut.getTime() - record.checkIn.getTime()) /
                (1000 * 60 * 60)
              ).toFixed(2)
            )
          : 0,
    }));

    const taskSummary = tasks.map((task) => ({
      title: task.title,
      status: task.status,
      createdAt: task.createdAt.toISOString(),
    }));

    const timesheetSummary = timesheets.map((timesheet) => ({
      description: timesheet.description,
      hours: timesheet.hours,
      status: timesheet.status,
      managerFeedback: timesheet.approvals.map((approval) => approval.feedback),
    }));

    const prompt = `Analyze employee productivity using the following data:

* Attendance: ${attendance.length} records, ${totalWorkingHours.toFixed(1)} total working hours
* Tasks completed: ${completedTasks} out of ${totalTasks} total tasks (${inProgressTasks} in progress)
* Work logs: ${timesheets.length} timesheet entries totaling ${totalLoggedHours.toFixed(1)} hours
* Approved work logs: ${approvedTimesheets}
* Rejected work logs: ${rejectedTimesheets}

Structured data payload:
Attendance records: ${JSON.stringify(attendanceSummary)}
Task completion data: ${JSON.stringify(taskSummary)}
Timesheet logs: ${JSON.stringify(timesheetSummary)}
Manager feedback highlights: ${JSON.stringify(latestFeedback)}

Return strictly in JSON:
{
  "score": number,
  "summary": string,
  "strengths": string[],
  "improvements": string[],
  "appraisal": string
}`;

    try {
      const response = await callGemini(prompt);
      const parsed = parseEvaluationResponse(response);

      if (parsed) {
        return parsed;
      }

      return {
        ...fallback,
        summary:
          "Gemini returned a response that could not be parsed. A rules-based fallback appraisal is shown instead.",
      };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Unknown Gemini error";

      return {
        ...fallback,
        summary: `Gemini evaluation could not be completed: ${reason}. A rules-based fallback appraisal is shown instead.`,
      };
    }
  },
};

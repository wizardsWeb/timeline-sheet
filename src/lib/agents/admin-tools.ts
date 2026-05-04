import { prisma } from "@/lib/db/prisma";
import type { FunctionDeclaration } from "@google/generative-ai";
import { SchemaType } from "@google/generative-ai";

/* ------------------------------------------------------------------ */
/*  Type for the tool registry                                         */
/* ------------------------------------------------------------------ */

export interface AdminTool {
  declaration: FunctionDeclaration;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

/* ------------------------------------------------------------------ */
/*  1. get_employee_list                                               */
/* ------------------------------------------------------------------ */

const getEmployeeList: AdminTool = {
  declaration: {
    name: "get_employee_list",
    description:
      "Returns a list of all users in the system with their name, email, role, and account creation date. Optionally filter by role.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        role: {
          type: SchemaType.STRING,
          description:
            'Filter by role: "EMPLOYEE", "MANAGER", or "ADMIN". Omit to list all.',
        },
      },
    },
  },
  async execute(args) {
    const where: Record<string, unknown> = {};
    if (args.role && typeof args.role === "string") {
      where.role = args.role.toUpperCase();
    }
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: "asc" },
    });
    return {
      total: users.length,
      users: users.map((u) => ({
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString().slice(0, 10),
      })),
    };
  },
};

/* ------------------------------------------------------------------ */
/*  2. get_employee_stats                                              */
/* ------------------------------------------------------------------ */

const getEmployeeStats: AdminTool = {
  declaration: {
    name: "get_employee_stats",
    description:
      "Returns detailed performance stats for a single employee: total attendance hours, task counts by status, timesheet hours and approval breakdown. Search by name (partial match) or email.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        employee: {
          type: SchemaType.STRING,
          description: "Employee name (partial match) or email address.",
        },
      },
      required: ["employee"],
    },
  },
  async execute(args) {
    const query = String(args.employee ?? "").trim();
    if (!query) return { error: "Employee name or email is required." };

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query.toLowerCase() } },
        ],
      },
    });
    if (!user) return { error: `No employee found matching "${query}".` };

    const [attendance, tasks, timesheets] = await Promise.all([
      prisma.attendance.findMany({ where: { userId: user.id } }),
      prisma.task.findMany({ where: { assignedTo: user.id } }),
      prisma.timesheet.findMany({ where: { userId: user.id } }),
    ]);

    const totalAttendanceHours = attendance.reduce((sum, a) => {
      if (a.checkIn && a.checkOut) {
        return sum + (a.checkOut.getTime() - a.checkIn.getTime()) / (1000 * 60 * 60);
      }
      return sum;
    }, 0);

    const tasksByStatus = {
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
    };

    const totalLoggedHours = timesheets.reduce((sum, t) => sum + t.hours, 0);
    const timesheetBreakdown = {
      pending: timesheets.filter((t) => t.status === "PENDING").length,
      approved: timesheets.filter((t) => t.status === "APPROVED").length,
      rejected: timesheets.filter((t) => t.status === "REJECTED").length,
    };

    return {
      employee: { name: user.name, email: user.email, role: user.role },
      attendance: {
        totalDays: attendance.length,
        totalHours: Math.round(totalAttendanceHours * 100) / 100,
        avgHoursPerDay:
          attendance.length > 0
            ? Math.round((totalAttendanceHours / attendance.length) * 100) / 100
            : 0,
      },
      tasks: {
        total: tasks.length,
        ...tasksByStatus,
        completionRate:
          tasks.length > 0
            ? Math.round((tasksByStatus.done / tasks.length) * 100)
            : 0,
      },
      timesheets: {
        total: timesheets.length,
        totalHoursLogged: totalLoggedHours,
        ...timesheetBreakdown,
        approvalRate:
          timesheets.length > 0
            ? Math.round((timesheetBreakdown.approved / timesheets.length) * 100)
            : 0,
      },
    };
  },
};

/* ------------------------------------------------------------------ */
/*  3. get_task_overview                                               */
/* ------------------------------------------------------------------ */

const getTaskOverview: AdminTool = {
  declaration: {
    name: "get_task_overview",
    description:
      "Returns all tasks with status, priority, assignee, and project. Optionally filter by status or assignee name.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description: 'Filter by status: "TODO", "IN_PROGRESS", or "DONE".',
        },
        assignee: {
          type: SchemaType.STRING,
          description: "Filter by assignee name (partial match).",
        },
      },
    },
  },
  async execute(args) {
    const where: Record<string, unknown> = {};
    if (args.status && typeof args.status === "string") {
      where.status = args.status.toUpperCase();
    }
    if (args.assignee && typeof args.assignee === "string") {
      where.assignee = { name: { contains: String(args.assignee) } };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
    };

    return {
      summary,
      tasks: tasks.map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee.name,
        project: t.project?.name ?? "—",
        createdAt: t.createdAt.toISOString().slice(0, 10),
      })),
    };
  },
};

/* ------------------------------------------------------------------ */
/*  4. get_timesheet_analytics                                         */
/* ------------------------------------------------------------------ */

const getTimesheetAnalytics: AdminTool = {
  declaration: {
    name: "get_timesheet_analytics",
    description:
      "Returns aggregated timesheet analytics: total hours logged, breakdown by approval status, and the top contributors by hours.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  async execute() {
    const timesheets = await prisma.timesheet.findMany({
      include: { user: { select: { name: true } } },
    });

    const totalHours = timesheets.reduce((s, t) => s + t.hours, 0);
    const pending = timesheets.filter((t) => t.status === "PENDING");
    const approved = timesheets.filter((t) => t.status === "APPROVED");
    const rejected = timesheets.filter((t) => t.status === "REJECTED");

    const hoursMap = new Map<string, number>();
    for (const t of timesheets) {
      hoursMap.set(t.user.name, (hoursMap.get(t.user.name) ?? 0) + t.hours);
    }
    const topContributors = [...hoursMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, hours]) => ({ name, hours }));

    return {
      totalEntries: timesheets.length,
      totalHours,
      breakdown: {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
      },
      approvalRate:
        timesheets.length > 0
          ? Math.round((approved.length / timesheets.length) * 100)
          : 0,
      topContributors,
    };
  },
};

/* ------------------------------------------------------------------ */
/*  5. get_attendance_summary                                          */
/* ------------------------------------------------------------------ */

const getAttendanceSummary: AdminTool = {
  declaration: {
    name: "get_attendance_summary",
    description:
      "Returns attendance records with check-in/out times and hours worked. Optionally filter by employee name.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        employee: {
          type: SchemaType.STRING,
          description: "Filter by employee name (partial match). Omit for all.",
        },
      },
    },
  },
  async execute(args) {
    const where: Record<string, unknown> = {};
    if (args.employee && typeof args.employee === "string") {
      const user = await prisma.user.findFirst({
        where: { name: { contains: String(args.employee) } },
      });
      if (!user) return { error: `No employee matching "${args.employee}".` };
      where.userId = user.id;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const rows = records.map((r) => {
      const hours =
        r.checkIn && r.checkOut
          ? Math.round(
              ((r.checkOut.getTime() - r.checkIn.getTime()) / (1000 * 60 * 60)) * 100
            ) / 100
          : 0;
      return {
        employee: r.user.name,
        date: r.createdAt.toISOString().slice(0, 10),
        checkIn: r.checkIn?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) ?? "—",
        checkOut: r.checkOut?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) ?? "—",
        hours,
      };
    });

    const totalHours = rows.reduce((s, r) => s + r.hours, 0);
    const avgHours = rows.length > 0 ? Math.round((totalHours / rows.length) * 100) / 100 : 0;

    return {
      totalRecords: rows.length,
      totalHours: Math.round(totalHours * 100) / 100,
      avgHoursPerDay: avgHours,
      records: rows,
    };
  },
};

/* ------------------------------------------------------------------ */
/*  6. get_project_summary                                             */
/* ------------------------------------------------------------------ */

const getProjectSummary: AdminTool = {
  declaration: {
    name: "get_project_summary",
    description:
      "Returns a summary of each project: member count, task count by status, and total hours logged.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  async execute() {
    const projects = await prisma.project.findMany({
      include: {
        members: { include: { user: { select: { name: true } } } },
        tasks: {
          include: {
            timesheets: { select: { hours: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      totalProjects: projects.length,
      projects: projects.map((p) => {
        const totalHours = p.tasks.reduce(
          (s, t) => s + t.timesheets.reduce((s2, ts) => s2 + ts.hours, 0),
          0
        );
        return {
          name: p.name,
          color: p.color,
          members: p.members.map((m) => m.user.name),
          memberCount: p.members.length,
          tasks: {
            total: p.tasks.length,
            todo: p.tasks.filter((t) => t.status === "TODO").length,
            inProgress: p.tasks.filter((t) => t.status === "IN_PROGRESS").length,
            done: p.tasks.filter((t) => t.status === "DONE").length,
          },
          totalHoursLogged: totalHours,
        };
      }),
    };
  },
};

/* ------------------------------------------------------------------ */
/*  Registry                                                           */
/* ------------------------------------------------------------------ */

export const adminTools: Record<string, AdminTool> = {
  get_employee_list: getEmployeeList,
  get_employee_stats: getEmployeeStats,
  get_task_overview: getTaskOverview,
  get_timesheet_analytics: getTimesheetAnalytics,
  get_attendance_summary: getAttendanceSummary,
  get_project_summary: getProjectSummary,
};

export const adminToolDeclarations: FunctionDeclaration[] = Object.values(adminTools).map(
  (t) => t.declaration
);

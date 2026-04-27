const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function buildAttendanceDay(daysAgo, startHour, durationHours) {
  const day = new Date();
  day.setDate(day.getDate() - daysAgo);
  day.setHours(0, 0, 0, 0);

  const checkIn = new Date(day);
  checkIn.setHours(startHour, 0, 0, 0);

  const checkOut = new Date(checkIn);
  checkOut.setTime(checkIn.getTime() + durationHours * 60 * 60 * 1000);

  return { checkIn, checkOut };
}

async function main() {
  await prisma.approval.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.task.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.user.deleteMany();

  const [employeeOne, employeeTwo, manager, admin] = await Promise.all([
    prisma.user.create({
      data: {
        id: "emp-001",
        name: "Alice Johnson",
        email: "alice@company.com",
        role: "EMPLOYEE",
      },
    }),
    prisma.user.create({
      data: {
        id: "emp-002",
        name: "Bob Williams",
        email: "bob@company.com",
        role: "EMPLOYEE",
      },
    }),
    prisma.user.create({
      data: {
        id: "mgr-001",
        name: "Carol Davis",
        email: "carol@company.com",
        role: "MANAGER",
      },
    }),
    prisma.user.create({
      data: {
        id: "adm-001",
        name: "David Chen",
        email: "david@company.com",
        role: "ADMIN",
      },
    }),
  ]);

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        id: "task-001",
        title: "Build Dashboard UI",
        description: "Create a polished employee dashboard with status cards and operational tables.",
        assignedTo: employeeOne.id,
        status: "IN_PROGRESS",
      },
    }),
    prisma.task.create({
      data: {
        id: "task-002",
        title: "API Integration",
        description: "Connect server actions, Prisma workflows, and evaluation responses into the interface.",
        assignedTo: employeeOne.id,
        status: "TODO",
      },
    }),
    prisma.task.create({
      data: {
        id: "task-003",
        title: "Database Optimization",
        description: "Review indexes and query patterns for the workforce reporting layer.",
        assignedTo: employeeTwo.id,
        status: "DONE",
      },
    }),
    prisma.task.create({
      data: {
        id: "task-004",
        title: "Write Unit Tests",
        description: "Add targeted coverage around attendance and timesheet workflows.",
        assignedTo: employeeTwo.id,
        status: "IN_PROGRESS",
      },
    }),
    prisma.task.create({
      data: {
        id: "task-005",
        title: "Security Audit",
        description: "Review role boundaries and validate mutation flows before release.",
        assignedTo: employeeOne.id,
        status: "TODO",
      },
    }),
  ]);

  const attendanceFixtures = [
    [employeeOne.id, buildAttendanceDay(1, 9, 8.5)],
    [employeeOne.id, buildAttendanceDay(2, 9, 8)],
    [employeeOne.id, buildAttendanceDay(3, 8, 9)],
    [employeeOne.id, buildAttendanceDay(4, 9, 8.25)],
    [employeeOne.id, buildAttendanceDay(5, 9, 7.75)],
    [employeeTwo.id, buildAttendanceDay(1, 10, 7.5)],
    [employeeTwo.id, buildAttendanceDay(2, 9, 8.75)],
    [employeeTwo.id, buildAttendanceDay(3, 9, 8.25)],
    [employeeTwo.id, buildAttendanceDay(4, 10, 7.25)],
    [employeeTwo.id, buildAttendanceDay(5, 9, 8)],
  ];

  await Promise.all(
    attendanceFixtures.map(([userId, attendance]) =>
      prisma.attendance.create({
        data: {
          userId,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
        },
      })
    )
  );

  const [ts1, ts2, ts3, ts4, ts5] = await Promise.all([
    prisma.timesheet.create({
      data: {
        id: "ts-001",
        userId: employeeOne.id,
        taskId: tasks[0].id,
        description: "Delivered the dashboard shell, summary cards, and interaction states for employee workflows.",
        hours: 6,
        status: "PENDING",
      },
    }),
    prisma.timesheet.create({
      data: {
        id: "ts-002",
        userId: employeeOne.id,
        taskId: tasks[1].id,
        description: "Connected the API client contract and validated the mutation payload structure.",
        hours: 4,
        status: "APPROVED",
      },
    }),
    prisma.timesheet.create({
      data: {
        id: "ts-003",
        userId: employeeTwo.id,
        taskId: tasks[2].id,
        description: "Improved query performance and cleaned up relational loading for reporting views.",
        hours: 8,
        status: "PENDING",
      },
    }),
    prisma.timesheet.create({
      data: {
        id: "ts-004",
        userId: employeeTwo.id,
        taskId: tasks[3].id,
        description: "Added coverage for edge cases in authentication, but gaps remain around failure handling.",
        hours: 5,
        status: "REJECTED",
      },
    }),
    prisma.timesheet.create({
      data: {
        id: "ts-005",
        userId: employeeOne.id,
        taskId: tasks[4].id,
        description: "Prepared a checklist for role-based access review and deployment hardening.",
        hours: 3.5,
        status: "APPROVED",
      },
    }),
  ]);

  await Promise.all([
    prisma.approval.create({
      data: {
        timesheetId: ts2.id,
        managerId: manager.id,
        feedback: "Solid delivery. The action wiring was clear and easy to review.",
        decision: "APPROVED",
      },
    }),
    prisma.approval.create({
      data: {
        timesheetId: ts4.id,
        managerId: manager.id,
        feedback: "Coverage direction is right, but missing edge cases around duplicate check-in and invalid task ownership.",
        decision: "REJECTED",
      },
    }),
    prisma.approval.create({
      data: {
        timesheetId: ts5.id,
        managerId: manager.id,
        feedback: "Good operational thinking. Turn the checklist into concrete remediation tasks next.",
        decision: "APPROVED",
      },
    }),
  ]);

  console.log("Seeded workforce demo successfully.");
  console.log(`Users: 4 (${employeeOne.name}, ${employeeTwo.name}, ${manager.name}, ${admin.name})`);
  console.log(`Tasks: ${tasks.length}`);
  console.log("Timesheets: 5");
  console.log("Approvals: 3");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

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
  await prisma.message.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const [admin, manager, alice, bob, carol] = await Promise.all([
    prisma.user.create({
      data: {
        id: "adm-001",
        name: "David Chen",
        email: "admin@demo.com",
        passwordHash: hash("admin123"),
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        id: "mgr-001",
        name: "Carol Davis",
        email: "manager@demo.com",
        passwordHash: hash("manager123"),
        role: "MANAGER",
      },
    }),
    prisma.user.create({
      data: {
        id: "emp-001",
        name: "Alice Johnson",
        email: "alice@demo.com",
        passwordHash: hash("employee123"),
        role: "EMPLOYEE",
      },
    }),
    prisma.user.create({
      data: {
        id: "emp-002",
        name: "Bob Williams",
        email: "bob@demo.com",
        passwordHash: hash("employee123"),
        role: "EMPLOYEE",
      },
    }),
    prisma.user.create({
      data: {
        id: "emp-003",
        name: "Carol Singh",
        email: "carol@demo.com",
        passwordHash: hash("employee123"),
        role: "EMPLOYEE",
      },
    }),
  ]);

  const [doozy, marketing] = await Promise.all([
    prisma.project.create({
      data: { id: "prj-doozy", name: "Doozy App", color: "#16A34A" },
    }),
    prisma.project.create({
      data: { id: "prj-marketing", name: "Marketing Site", color: "#F59E0B" },
    }),
  ]);

  await prisma.projectMember.createMany({
    data: [
      { projectId: doozy.id, userId: manager.id, role: "OWNER" },
      { projectId: doozy.id, userId: alice.id, role: "MEMBER" },
      { projectId: doozy.id, userId: bob.id, role: "MEMBER" },
      { projectId: marketing.id, userId: manager.id, role: "OWNER" },
      { projectId: marketing.id, userId: alice.id, role: "MEMBER" },
      { projectId: marketing.id, userId: carol.id, role: "MEMBER" },
    ],
  });

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        id: "task-001",
        title: "Build Dashboard UI",
        description: "Create polished employee dashboard with status cards.",
        assignedTo: alice.id,
        projectId: doozy.id,
        status: "IN_PROGRESS",
        priority: "HIGH",
      },
    }),
    prisma.task.create({
      data: {
        id: "task-002",
        title: "API Integration",
        description: "Connect server actions and Prisma workflows.",
        assignedTo: alice.id,
        projectId: doozy.id,
        status: "TODO",
        priority: "MEDIUM",
      },
    }),
    prisma.task.create({
      data: {
        id: "task-003",
        title: "Database Optimization",
        description: "Review indexes and query patterns.",
        assignedTo: bob.id,
        projectId: doozy.id,
        status: "DONE",
        priority: "MEDIUM",
      },
    }),
    prisma.task.create({
      data: {
        id: "task-004",
        title: "Write Unit Tests",
        description: "Add coverage around attendance and timesheet workflows.",
        assignedTo: bob.id,
        projectId: doozy.id,
        status: "IN_PROGRESS",
        priority: "LOW",
      },
    }),
    prisma.task.create({
      data: {
        id: "task-005",
        title: "Landing Page Copy",
        description: "Draft marketing landing page sections.",
        assignedTo: carol.id,
        projectId: marketing.id,
        status: "TODO",
        priority: "MEDIUM",
      },
    }),
    prisma.task.create({
      data: {
        id: "task-006",
        title: "Brand Visual Refresh",
        description: "Update brand assets across the marketing site.",
        assignedTo: alice.id,
        projectId: marketing.id,
        status: "TODO",
        priority: "HIGH",
      },
    }),
  ]);

  const attendanceFixtures = [
    [alice.id, buildAttendanceDay(1, 9, 8.5)],
    [alice.id, buildAttendanceDay(2, 9, 8)],
    [alice.id, buildAttendanceDay(3, 8, 9)],
    [alice.id, buildAttendanceDay(4, 9, 8.25)],
    [alice.id, buildAttendanceDay(5, 9, 7.75)],
    [bob.id, buildAttendanceDay(1, 10, 7.5)],
    [bob.id, buildAttendanceDay(2, 9, 8.75)],
    [bob.id, buildAttendanceDay(3, 9, 8.25)],
    [carol.id, buildAttendanceDay(1, 9, 8)],
    [carol.id, buildAttendanceDay(2, 9, 7.5)],
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
        userId: alice.id,
        taskId: tasks[0].id,
        description: "Delivered dashboard shell and summary cards.",
        hours: 6,
        status: "PENDING",
      },
    }),
    prisma.timesheet.create({
      data: {
        id: "ts-002",
        userId: alice.id,
        taskId: tasks[1].id,
        description: "Wired API client and validated mutation payloads.",
        hours: 4,
        status: "APPROVED",
      },
    }),
    prisma.timesheet.create({
      data: {
        id: "ts-003",
        userId: bob.id,
        taskId: tasks[2].id,
        description: "Tuned reporting queries and relation loading.",
        hours: 8,
        status: "PENDING",
      },
    }),
    prisma.timesheet.create({
      data: {
        id: "ts-004",
        userId: bob.id,
        taskId: tasks[3].id,
        description: "Added auth tests; gaps remain on failure paths.",
        hours: 5,
        status: "REJECTED",
      },
    }),
    prisma.timesheet.create({
      data: {
        id: "ts-005",
        userId: carol.id,
        taskId: tasks[4].id,
        description: "Drafted hero and feature copy for marketing site.",
        hours: 3.5,
        status: "PENDING",
      },
    }),
  ]);

  await Promise.all([
    prisma.approval.create({
      data: {
        timesheetId: ts2.id,
        managerId: manager.id,
        feedback: "Solid delivery, clear wiring.",
        decision: "APPROVED",
      },
    }),
    prisma.approval.create({
      data: {
        timesheetId: ts4.id,
        managerId: manager.id,
        feedback: "Cover duplicate check-in and invalid task ownership.",
        decision: "REJECTED",
      },
    }),
  ]);

  console.log("Seeded.");
  console.log("Logins:");
  console.log("  admin@demo.com / admin123");
  console.log("  manager@demo.com / manager123");
  console.log("  alice@demo.com / employee123");
  console.log("  bob@demo.com / employee123");
  console.log("  carol@demo.com / employee123");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

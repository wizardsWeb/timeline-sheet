import { prisma } from "@/lib/db/prisma";

export const attendanceAgent = {
  /**
   * Check in a user. Prevents duplicate check-in for the same day.
   */
  async checkIn(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check for existing check-in today
    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    if (existing) {
      throw new Error("Already checked in today");
    }

    return prisma.attendance.create({
      data: {
        userId,
        checkIn: new Date(),
      },
    });
  },

  /**
   * Check out a user. Finds today's record and sets checkOut.
   */
  async checkOut(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const record = await prisma.attendance.findFirst({
      where: {
        userId,
        createdAt: { gte: today, lt: tomorrow },
        checkOut: null,
      },
    });

    if (!record) {
      throw new Error("No active check-in found for today");
    }

    return prisma.attendance.update({
      where: { id: record.id },
      data: { checkOut: new Date() },
    });
  },

  /**
   * Get today's attendance for a user.
   */
  async getTodayAttendance(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.attendance.findFirst({
      where: {
        userId,
        createdAt: { gte: today, lt: tomorrow },
      },
    });
  },

  /**
   * Get all attendance records for a user.
   */
  async getAttendanceHistory(userId: string) {
    return prisma.attendance.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  },

  /**
   * Calculate total working hours from attendance records.
   */
  calculateWorkingHours(
    records: { checkIn: Date | null; checkOut: Date | null }[]
  ): number {
    return records.reduce((total, record) => {
      if (record.checkIn && record.checkOut) {
        const hours =
          (record.checkOut.getTime() - record.checkIn.getTime()) /
          (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);
  },
};

"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function getTeamMessages() {
  return await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
}

export async function sendTeamMessage(senderId: string, content: string) {
  if (!senderId || !content || content.trim() === "") {
    throw new Error("Invalid message data");
  }

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      senderId,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  revalidatePath("/chat");
  return message;
}

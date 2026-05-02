"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth";

const SendSchema = z.object({
  content: z.string().trim().min(1, "Empty message").max(2000),
});

export async function sendMessageAction(formData: FormData) {
  const me = await requireSession();
  const parsed = SendSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) return;
  await prisma.message.create({
    data: { senderId: me.id, content: parsed.data.content },
  });
  revalidatePath("/employee/chat");
}

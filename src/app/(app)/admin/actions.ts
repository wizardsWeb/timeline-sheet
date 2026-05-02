"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { hashPassword, requireRole } from "@/lib/auth";

const REVALIDATE = [
  "/overview",
  "/admin/users",
  "/admin/timesheets",
  "/admin/tasks",
  "/admin/system",
  "/employee/members",
];

function revalidateAll() {
  for (const p of REVALIDATE) revalidatePath(p);
}

export type ActionState = { ok?: boolean; error?: string } | null;

const CreateUserSchema = z.object({
  name: z.string().trim().min(2, "Name too short"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(8, "Password must be ≥ 8 chars"),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]),
});

export async function createUserAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");
  const parsed = CreateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Email already in use" };

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { name, email, passwordHash, role },
  });
  revalidateAll();
  return { ok: true };
}

export async function updateUserRoleAction(formData: FormData) {
  const me = await requireRole("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!userId || !["EMPLOYEE", "MANAGER", "ADMIN"].includes(role)) return;
  if (userId === me.id) return; // do not let admin demote self
  await prisma.user.update({
    where: { id: userId },
    data: { role: role as "EMPLOYEE" | "MANAGER" | "ADMIN" },
  });
  revalidateAll();
}

export async function deleteUserAction(formData: FormData) {
  const me = await requireRole("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === me.id) return;
  await prisma.user.delete({ where: { id: userId } });
  revalidateAll();
}

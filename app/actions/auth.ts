"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, getSession } from "@/lib/auth/session";

export type ActionState = { error?: string; success?: string } | undefined;

const DUMMY_HASH = bcrypt.hashSync("devsoul-dummy-password", 12);
const MIN_PASSWORD_LENGTH = 8;

function safeRedirectPath(from: FormDataEntryValue | null) {
  const value = typeof from === "string" ? from : "";
  return /^\/(?![/\\])/.test(value) ? value : "/dashboard";
}

export async function login(_state: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Ingresá email y contraseña." };

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

  if (!user || !valid) return { error: "Email o contraseña incorrectos." };

  await createSession({ userId: user.id, role: user.role });
  redirect(safeRedirectPath(formData.get("from")));
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function changePassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next || !confirm) return { error: "Completá todos los campos." };
  if (next.length < MIN_PASSWORD_LENGTH) {
    return { error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` };
  }
  if (next !== confirm) return { error: "Las contraseñas nuevas no coinciden." };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await bcrypt.compare(current, user.password))) {
    return { error: "La contraseña actual es incorrecta." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(next, 12) },
  });

  return { success: "Contraseña actualizada." };
}

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_TTL_MS, decrypt, encrypt, type SessionPayload } from "./jwt";

export async function createSession(payload: SessionPayload) {
  const token = await encrypt(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + SESSION_TTL_MS),
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(SESSION_COOKIE)?.value);
}

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export const FINANCIAL_ROLES: Role[] = [Role.OWNER, Role.FINANCIAL];

type Guard =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

export async function requireRole(roles?: Role[]): Promise<Guard> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if (roles && !roles.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No tenés permisos para esta acción" }, { status: 403 }),
    };
  }
  return { ok: true, session };
}

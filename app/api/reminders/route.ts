import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { runReminders } from "@/lib/billing/reminders";

export async function GET() {
  try {
    return NextResponse.json(await runReminders({ dryRun: true }));
  } catch (error) {
    console.error("[GET /api/reminders]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const auth = await requireRole([Role.OWNER]);
    if (!auth.ok) return auth.response;

    const result = await runReminders();
    if (!result.configured) {
      return NextResponse.json(
        { error: "El envío de emails no está configurado (RESEND_API_KEY y EMAIL_FROM)", ...result },
        { status: 503 }
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/reminders]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

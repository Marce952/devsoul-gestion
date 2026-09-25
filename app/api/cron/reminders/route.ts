import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/auth/cron";
import { runReminders } from "@/lib/billing/reminders";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const result = await runReminders();
    const count = (status: string) => result.outcomes.filter((o) => o.status === status).length;
    console.log(
      `[cron/reminders] ${result.today}: ${count("SENT")} enviados, ${count("FAILED")} fallidos${result.configured ? "" : " (email sin configurar)"}`
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/cron/reminders]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

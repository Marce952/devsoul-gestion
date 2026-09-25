import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/auth/cron";
import { generateRecurringInvoices } from "@/lib/billing/recurring";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const result = await generateRecurringInvoices();
    console.log(`[cron/invoices] ${result.period}: ${result.created.length} creadas, ${result.skipped} omitidas`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/cron/invoices]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

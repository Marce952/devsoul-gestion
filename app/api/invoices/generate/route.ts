import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { generateRecurringInvoices } from "@/lib/billing/recurring";
import { currentPeriod, isValidPeriod } from "@/lib/dates";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([Role.OWNER]);
    if (!auth.ok) return auth.response;

    const body: { period?: string } = await req.json().catch(() => ({}));
    const period = body.period ?? currentPeriod();
    if (!isValidPeriod(period)) {
      return NextResponse.json({ error: "Período inválido (YYYY-MM)" }, { status: 400 });
    }

    return NextResponse.json(await generateRecurringInvoices(period));
  } catch (error) {
    console.error("[POST /api/invoices/generate]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

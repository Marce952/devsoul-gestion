import { NextRequest, NextResponse } from "next/server";
import { ReminderKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { businessDateKey, daysBetween, dueDateKey } from "@/lib/dates";
import { reminderKindFor } from "@/lib/billing/reminders";
import { renderReminderEmail } from "@/lib/billing/reminder-template";

export async function GET(req: NextRequest) {
  const invoiceId = req.nextUrl.searchParams.get("invoiceId");
  const kindParam = req.nextUrl.searchParams.get("kind") as ReminderKind | null;
  if (!invoiceId) return NextResponse.json({ error: "invoiceId requerido" }, { status: 400 });

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      contract: {
        select: {
          client: { select: { companyName: true, contactName: true } },
          software: { select: { name: true } },
        },
      },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });

  const daysFromDue = daysBetween(dueDateKey(invoice.dueDate), businessDateKey());
  const kind =
    kindParam && Object.values(ReminderKind).includes(kindParam)
      ? kindParam
      : (reminderKindFor(daysFromDue) ?? ReminderKind.BEFORE_DUE);

  const { html } = renderReminderEmail({
    kind,
    contactName: invoice.contract.client.contactName,
    companyName: invoice.contract.client.companyName,
    softwareName: invoice.contract.software.name,
    period: invoice.period,
    amount: invoice.amount.toString(),
    currency: invoice.currency,
    dueDate: invoice.dueDate,
    daysFromDue,
  });

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

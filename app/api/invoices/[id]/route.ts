import { NextRequest, NextResponse } from "next/server";
import { PaymentStatus, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FINANCIAL_ROLES, requireRole } from "@/lib/auth/session";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(FINANCIAL_ROLES);
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }
    if (invoice.status === PaymentStatus.PAID) {
      return NextResponse.json({ error: "La factura ya fue cobrada" }, { status: 400 });
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id },
        data: { status: PaymentStatus.PAID, paymentDate: now },
      });

      await tx.transaction.create({
        data: {
          type: TransactionType.INCOME,
          category: "Factura cobrada",
          amount: invoice.amount,
          currency: invoice.currency,
          description: `Factura #${id.slice(-6).toUpperCase()} — ${invoice.period}`,
          date: now,
        },
      });

      return inv;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/invoices/:id]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

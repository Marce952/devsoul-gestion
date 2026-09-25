import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { TransactionSource, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FINANCIAL_ROLES, requireRole } from "@/lib/auth/session";
import { buildLedgerEntry, parseAmount, parseDate } from "@/lib/finance/ledger";
import { RateUnavailableError } from "@/lib/finance/rates";

type TransferBody = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  amountReceived?: number;
  date: string;
  description?: string;
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(FINANCIAL_ROLES);
    if (!auth.ok) return auth.response;

    const body: TransferBody = await req.json();
    const amount = parseAmount(body.amount);
    const date = parseDate(body.date);

    if (!body.fromAccountId || !body.toAccountId || !amount || !date) {
      return NextResponse.json({ error: "Faltan campos requeridos o son inválidos" }, { status: 400 });
    }
    if (body.fromAccountId === body.toAccountId) {
      return NextResponse.json({ error: "Las cuentas de origen y destino deben ser distintas" }, { status: 400 });
    }

    const [from, to] = await Promise.all([
      prisma.financialAccount.findFirst({ where: { id: body.fromAccountId, active: true } }),
      prisma.financialAccount.findFirst({ where: { id: body.toAccountId, active: true } }),
    ]);
    if (!from || !to) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });

    const amountReceived = from.currency === to.currency ? amount : parseAmount(body.amountReceived);
    if (!amountReceived) {
      return NextResponse.json(
        { error: "Indicá el monto recibido en la moneda de la cuenta destino" },
        { status: 400 }
      );
    }

    const transferGroupId = randomUUID();
    const description = body.description?.trim() || `Transferencia ${from.name} → ${to.name}`;
    const common = { date, description, transferGroupId, source: TransactionSource.TRANSFER, createdById: auth.session.userId };

    const entries = await Promise.all([
      buildLedgerEntry({ ...common, account: from, type: TransactionType.TRANSFER_OUT, amount }),
      buildLedgerEntry({ ...common, account: to, type: TransactionType.TRANSFER_IN, amount: amountReceived }),
    ]);

    const created = await prisma.$transaction(entries.map((data) => prisma.transaction.create({ data })));

    return NextResponse.json({ transferGroupId, transactions: created }, { status: 201 });
  } catch (error) {
    if (error instanceof RateUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("[POST /api/transfers]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

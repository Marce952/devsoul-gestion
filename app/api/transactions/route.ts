import { NextRequest, NextResponse } from "next/server";
import { Currency, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateTransactionBody = {
  type: TransactionType;
  category: string;
  amount: number;
  currency: Currency;
  description?: string;
  date: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as TransactionType | null;
    const month = searchParams.get("month");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    let dateFilter = {};
    if (month) {
      const [y, m] = month.split("-").map(Number);
      if (y && m) {
        dateFilter = { date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } };
      }
    }

    const where = {
      ...(type && Object.values(TransactionType).includes(type) ? { type } : {}),
      ...dateFilter,
    };

    const [data, total, sums] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.groupBy({
        by: ["type"],
        where,
        _sum: { amount: true },
      }),
    ]);

    const income = Number(sums.find((s) => s.type === TransactionType.INCOME)?._sum.amount ?? 0);
    const expense = Number(sums.find((s) => s.type === TransactionType.EXPENSE)?._sum.amount ?? 0);

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: { income, expense, net: income - expense },
    });
  } catch (error) {
    console.error("[GET /api/transactions]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateTransactionBody = await req.json();
    const { type, category, amount, currency, description, date } = body;

    if (!type || !category || amount === undefined || !currency || !date) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (!Object.values(TransactionType).includes(type)) {
      return NextResponse.json({ error: "Tipo de transacción inválido" }, { status: 400 });
    }

    if (!Object.values(Currency).includes(currency)) {
      return NextResponse.json({ error: "Moneda inválida" }, { status: 400 });
    }

    if (Number(amount) <= 0) {
      return NextResponse.json({ error: "El monto debe ser mayor a cero" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        category,
        amount,
        currency,
        description: description || undefined,
        date: new Date(date),
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("[POST /api/transactions]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

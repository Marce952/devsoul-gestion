import { NextRequest, NextResponse } from "next/server";
import { Currency, RateSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FINANCIAL_ROLES, requireRole } from "@/lib/auth/session";
import { RATE_CASA, getRateToArs } from "@/lib/finance/rates";

export async function GET() {
  try {
    const [current, history] = await Promise.all([
      getRateToArs(Currency.USD).catch(() => null),
      prisma.exchangeRate.findMany({
        where: { currency: Currency.USD },
        orderBy: { date: "desc" },
        take: 30,
      }),
    ]);

    return NextResponse.json({ casa: RATE_CASA, current, history });
  } catch (error) {
    console.error("[GET /api/exchange-rates]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(FINANCIAL_ROLES);
    if (!auth.ok) return auth.response;

    const { date, rateToArs }: { date: string; rateToArs: number } = await req.json();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !(Number(rateToArs) > 0)) {
      return NextResponse.json({ error: "Fecha (YYYY-MM-DD) y cotización válidas requeridas" }, { status: 400 });
    }

    const day = new Date(`${date}T00:00:00.000Z`);
    const rate = await prisma.exchangeRate.upsert({
      where: { currency_date: { currency: Currency.USD, date: day } },
      create: { currency: Currency.USD, date: day, rateToArs, source: RateSource.MANUAL },
      update: { rateToArs, source: RateSource.MANUAL },
    });

    return NextResponse.json(rate, { status: 201 });
  } catch (error) {
    console.error("[POST /api/exchange-rates]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

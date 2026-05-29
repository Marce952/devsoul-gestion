import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";
import { PaymentStatus, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: CoreMessage[] } = await req.json();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [ingresoAgg, egresoAgg, pendingAgg, allInvoices] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: TransactionType.INCOME, date: { gte: startOfMonth } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: TransactionType.EXPENSE, date: { gte: startOfMonth } },
      }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { status: PaymentStatus.PENDING },
      }),
      prisma.invoice.findMany({
        select: {
          amount: true,
          contract: { select: { software: { select: { name: true } } } },
        },
      }),
    ]);

    const softwareMap = new Map<string, number>();
    for (const inv of allInvoices) {
      const name = inv.contract.software.name;
      softwareMap.set(name, (softwareMap.get(name) ?? 0) + Number(inv.amount));
    }
    const top3 = Array.from(softwareMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const mes = now.toLocaleString("es-AR", { month: "long", year: "numeric" });
    const fmt = (n: number) =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(n);

    const ingresos = Number(ingresoAgg._sum.amount ?? 0);
    const egresos = Number(egresoAgg._sum.amount ?? 0);
    const pending = Number(pendingAgg._sum.amount ?? 0);
    const pendingN = pendingAgg._count.id;

    const topLines = top3.length
      ? top3.map(([name, total], i) => `  ${i + 1}. ${name}: ${fmt(total)}`).join("\n")
      : "  (Sin datos)";

    const systemPrompt = `Sos el asistente financiero interno de Devsoul, una startup de desarrollo de software.
Tu rol es ayudar a los socios a tomar decisiones de negocio con base en datos reales.

Contexto financiero actual (${mes}):
- Ingresos del mes: ${fmt(ingresos)}
- Egresos del mes: ${fmt(egresos)}
- Balance neto del mes: ${fmt(ingresos - egresos)}
- Facturas pendientes de cobro: ${fmt(pending)} (${pendingN} facturas)
- Top 3 softwares por facturación histórica:
${topLines}

Respondé siempre en español rioplatense. Sé conciso, directo y orientado a la toma de decisiones.`;

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[POST /api/ia/chat]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

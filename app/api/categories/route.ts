import { NextRequest, NextResponse } from "next/server";
import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FINANCIAL_ROLES, requireRole } from "@/lib/auth/session";

const CATEGORY_TYPES: TransactionType[] = [TransactionType.INCOME, TransactionType.EXPENSE];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type") as TransactionType | null;
    const includeInactive = searchParams.get("all") === "true";

    const categories = await prisma.transactionCategory.findMany({
      where: {
        ...(type && CATEGORY_TYPES.includes(type) ? { type } : {}),
        ...(includeInactive ? {} : { active: true }),
      },
      include: { _count: { select: { transactions: true } } },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(FINANCIAL_ROLES);
    if (!auth.ok) return auth.response;

    const { name, type }: { name: string; type: TransactionType } = await req.json();

    if (!name?.trim() || !CATEGORY_TYPES.includes(type)) {
      return NextResponse.json({ error: "Nombre y tipo (INCOME/EXPENSE) requeridos" }, { status: 400 });
    }

    const category = await prisma.transactionCategory.create({ data: { name: name.trim(), type } });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
    }
    console.error("[POST /api/categories]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

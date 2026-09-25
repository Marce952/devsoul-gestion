import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FINANCIAL_ROLES, requireRole } from "@/lib/auth/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(FINANCIAL_ROLES);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body: { name?: string; active?: boolean } = await req.json();

    const existing = await prisma.transactionCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    const updated = await prisma.transactionCategory.update({
      where: { id },
      data: {
        ...(body.name?.trim() && { name: body.name.trim() }),
        ...(body.active !== undefined && { active: body.active }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
    }
    console.error("[PATCH /api/categories/[id]]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

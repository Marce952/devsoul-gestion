import { NextRequest, NextResponse } from "next/server";
import { SoftwareType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type UpdateSoftwareBody = {
  name?: string;
  description?: string;
  type?: SoftwareType;
  basePrice?: number;
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: UpdateSoftwareBody = await req.json();

    const existing = await prisma.software.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Software no encontrado" }, { status: 404 });
    }

    const updated = await prisma.software.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.type && { type: body.type }),
        ...(body.basePrice != null && body.basePrice > 0 && { basePrice: body.basePrice }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /api/softwares/:id]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.software.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Software no encontrado" }, { status: 404 });
    }

    await prisma.software.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/softwares/:id]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

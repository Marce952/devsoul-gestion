import { NextRequest, NextResponse } from "next/server";
import { SoftwareType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateSoftwareBody = {
  name: string;
  description?: string;
  type: SoftwareType;
  basePrice: number;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as SoftwareType | null;

    const softwares = await prisma.software.findMany({
      where: { deletedAt: null, ...(type ? { type } : {}) },
      include: {
        _count: { select: { contracts: { where: { deletedAt: null } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(softwares);
  } catch (error) {
    console.error("[GET /api/softwares]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateSoftwareBody = await req.json();
    const { name, description, type, basePrice } = body;

    if (!name || !type || basePrice == null || basePrice <= 0) {
      return NextResponse.json({ error: "Faltan campos requeridos o precio inválido" }, { status: 400 });
    }

    const software = await prisma.software.create({
      data: {
        name,
        description: description || null,
        type,
        basePrice,
      },
    });

    return NextResponse.json(software, { status: 201 });
  } catch (error) {
    console.error("[POST /api/softwares]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

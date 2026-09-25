import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type UpdateClientBody = {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string | null;
  status?: boolean;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateClientBody = await req.json();

    const existing = await prisma.client.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...(body.companyName !== undefined && { companyName: body.companyName }),
        ...(body.contactName !== undefined && { contactName: body.contactName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un cliente con ese email" }, { status: 409 });
    }
    console.error("[PUT /api/clients/[id]]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.client.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const activeContracts = await prisma.contract.count({
      where: { clientId: id, active: true, deletedAt: null },
    });
    if (activeContracts > 0) {
      return NextResponse.json(
        { error: "El cliente tiene contratos activos. Finalizalos antes de archivarlo." },
        { status: 409 }
      );
    }

    await prisma.client.update({ where: { id }, data: { status: false, deletedAt: new Date() } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/clients/[id]]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

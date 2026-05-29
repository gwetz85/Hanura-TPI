import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "DPC") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { tanggalSurat, nomorSurat, instansiPengirim, perihal, fileUrl } = body;

    const updated = await prisma.incomingLetter.update({
      where: { id },
      data: {
        tanggalSurat,
        nomorSurat,
        instansiPengirim,
        perihal,
        fileUrl: fileUrl !== undefined ? fileUrl : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating incoming letter:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "DPC") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.incomingLetter.delete({ where: { id } });

    return NextResponse.json({ message: "Letter deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting incoming letter:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

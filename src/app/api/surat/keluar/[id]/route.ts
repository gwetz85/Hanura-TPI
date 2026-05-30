import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["DPC", "ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { tanggalSurat, nomorSurat, penerima, perihal, fileUrl } = body;

    const updated = await prisma.outgoingLetter.update({
      where: { id },
      data: {
        tanggalSurat,
        nomorSurat,
        penerima,
        perihal,
        fileUrl: fileUrl !== undefined ? fileUrl : undefined
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating outgoing letter:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["DPC", "ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.outgoingLetter.delete({ where: { id } });

    return NextResponse.json({ message: "Letter deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting outgoing letter:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

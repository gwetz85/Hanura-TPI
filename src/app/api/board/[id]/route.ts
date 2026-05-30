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
    const { level, position, name, ktaNumber, nik, nomorSk, photoUrl } = body;

    if (!level || !position || !name) {
      return NextResponse.json({ error: "Level, Jabatan, dan Nama wajib diisi" }, { status: 400 });
    }

    const updatedBoardMember = await prisma.boardMember.update({
      where: { id },
      data: {
        level,
        position,
        name,
        ktaNumber: ktaNumber || null,
        nik: nik || null,
        nomorSk: nomorSk || null,
        photoUrl: photoUrl || null,
      }
    });

    return NextResponse.json(updatedBoardMember);
  } catch (error) {
    console.error("Error updating board member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["DPC", "ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.boardMember.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Board member deleted successfully" });
  } catch (error) {
    console.error("Error deleting board member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

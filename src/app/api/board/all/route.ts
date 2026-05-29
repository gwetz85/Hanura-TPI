import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "DPC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");

    if (level) {
      await prisma.boardMember.deleteMany({
        where: { level }
      });
      return NextResponse.json({ success: true, message: `Semua data pengurus ${level} berhasil dihapus` });
    } else {
      await prisma.boardMember.deleteMany({});
      return NextResponse.json({ success: true, message: "Semua data pengurus berhasil dihapus" });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

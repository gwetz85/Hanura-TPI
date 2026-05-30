import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const boardMembers = await prisma.boardMember.findMany({
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(boardMembers);
  } catch (error) {
    console.error("Error fetching board members:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["DPC", "ADMIN"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { level, position, name, ktaNumber, nik, nomorSk, photoUrl } = body;

    if (!level || !position || !name) {
      return NextResponse.json({ error: "Level, Jabatan, dan Nama wajib diisi" }, { status: 400 });
    }

    const newBoardMember = await prisma.boardMember.create({
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

    return NextResponse.json(newBoardMember, { status: 201 });
  } catch (error) {
    console.error("Error creating board member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

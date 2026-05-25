import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "DPC") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const suratKeluar = await prisma.outgoingLetter.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suratKeluar);
  } catch (error) {
    console.error("Error fetching surat keluar:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "DPC") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tanggalSurat, nomorSurat, penerima, perihal } = await request.json();

    if (!tanggalSurat || !nomorSurat || !penerima || !perihal) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newSurat = await prisma.outgoingLetter.create({
      data: {
        tanggalSurat,
        nomorSurat,
        penerima,
        perihal,
      },
    });

    return NextResponse.json(newSurat, { status: 201 });
  } catch (error) {
    console.error("Error creating surat keluar:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

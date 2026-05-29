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

    const suratMasuk = await prisma.incomingLetter.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suratMasuk);
  } catch (error) {
    console.error("Error fetching surat masuk:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "DPC") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tanggalSurat, nomorSurat, instansiPengirim, perihal, fileUrl } = await request.json();

    if (!tanggalSurat || !nomorSurat || !instansiPengirim || !perihal) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newSurat = await prisma.incomingLetter.create({
      data: {
        tanggalSurat,
        nomorSurat,
        instansiPengirim,
        perihal,
        fileUrl: fileUrl || null,
      },
    });

    return NextResponse.json(newSurat, { status: 201 });
  } catch (error) {
    console.error("Error creating surat masuk:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

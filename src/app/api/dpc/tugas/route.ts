import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  // Only ADMIN, DPC, PETUGAS can access
  if (session.user.role.startsWith("PAC")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const tugasList = await prisma.tugas.findMany({
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { name: true, role: true } } }
  });
  return NextResponse.json(tugasList);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  if (session.user.role.startsWith("PAC")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { dasarKegiatan, namaKegiatan, lokasi, tanggal, suratTugasUrl, hasilPertemuan } = await req.json();

  if (!dasarKegiatan || !namaKegiatan || !lokasi || !tanggal || !hasilPertemuan) {
    return NextResponse.json({ error: "Semua field wajib diisi kecuali Surat Tugas" }, { status: 400 });
  }

  const tugas = await prisma.tugas.create({
    data: {
      dasarKegiatan,
      namaKegiatan,
      lokasi,
      tanggal: new Date(tanggal),
      suratTugasUrl,
      hasilPertemuan,
      creatorId: session.user.id
    }
  });

  return NextResponse.json(tugas);
}

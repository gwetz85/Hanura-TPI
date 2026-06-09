import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  if (session.user.role.startsWith("PAC")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { dasarKegiatan, namaKegiatan, lokasi, tanggal, suratTugasUrl, hasilPertemuan } = await req.json();

  if (!dasarKegiatan || !namaKegiatan || !lokasi || !tanggal || !hasilPertemuan) {
    return NextResponse.json({ error: "Semua field wajib diisi kecuali Surat Tugas" }, { status: 400 });
  }

  try {
    const tugas = await prisma.tugas.update({
      where: { id },
      data: {
        dasarKegiatan,
        namaKegiatan,
        lokasi,
        tanggal: new Date(tanggal),
        ...(suratTugasUrl !== undefined ? { suratTugasUrl } : {}),
        hasilPertemuan
      }
    });
    return NextResponse.json(tugas);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update tugas" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  if (session.user.role.startsWith("PAC")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await prisma.tugas.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete tugas" }, { status: 500 });
  }
}

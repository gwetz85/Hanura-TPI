import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * PATCH /api/dpc/members/verify
 * Allows DPC to toggle isVerified status for any member
 * Body: { memberId: string, isVerified: boolean }
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "DPC") {
      return NextResponse.json({ error: "Unauthorized – hanya DPC yang dapat mengakses endpoint ini" }, { status: 401 });
    }

    const body = await req.json();
    const { memberId, isVerified } = body;

    if (!memberId || typeof isVerified !== "boolean") {
      return NextResponse.json({ error: "memberId dan isVerified (boolean) wajib diisi" }, { status: 400 });
    }

    // Check member exists
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: { isVerified },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error verifying member (DPC):", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.role.startsWith("PAC")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, isVerified } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    // Verify this member belongs to this PAC
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    });

    if (!member || member.pacId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized or Member not found" }, { status: 403 });
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: { isVerified },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error verifying member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

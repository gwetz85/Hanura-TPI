import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pacId = searchParams.get("pacId");

  let targetPacId = session.user.id;

  if (session.user.role === "DPC") {
    if (pacId) {
      targetPacId = pacId;
    } else {
      // If DPC doesn't specify a PAC, return all members
      const members = await prisma.member.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(members);
    }
  } else {
    // If not DPC, ignore query param and only allow fetching their own PAC members
    targetPacId = session.user.id;
  }

  const members = await prisma.member.findMany({
    where: { pacId: targetPacId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(members);
}

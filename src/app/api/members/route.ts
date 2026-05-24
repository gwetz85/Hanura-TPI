import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pacId = searchParams.get("pacId");
  const gender = searchParams.get("gender"); // "L", "P", or "other"

  let targetPacId = session.user.id;

  if (session.user.role === "DPC") {
    if (pacId) {
      targetPacId = pacId;
    } else {
      // If DPC doesn't specify a PAC, return all members (optionally filtered by gender)
      const genderWhere = buildGenderWhere(gender);
      const members = await prisma.member.findMany({
        where: genderWhere ?? undefined,
        orderBy: { noUrut: "asc" },
      });
      return NextResponse.json(members);
    }
  } else {
    // If not DPC, ignore query param and only allow fetching their own PAC members
    targetPacId = session.user.id;
  }

  const genderWhere = buildGenderWhere(gender);
  const members = await prisma.member.findMany({
    where: { pacId: targetPacId, ...(genderWhere ?? {}) },
    orderBy: { noUrut: "asc" },
  });
  return NextResponse.json(members);
}

function buildGenderWhere(gender: string | null) {
  if (gender === "L") return { OR: [{ gender: "L" }, { gender: "l" }] };
  if (gender === "P") return { OR: [{ gender: "P" }, { gender: "p" }] };
  if (gender === "other") return { AND: [{ gender: { notIn: ["L", "l", "P", "p"] } }] };
  return null;
}

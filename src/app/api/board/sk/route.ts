import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    if (!level) return NextResponse.json({ error: "Level required" }, { status: 400 });

    const sk = await prisma.boardSK.findUnique({
      where: { level }
    });
    
    return NextResponse.json(sk || { fileUrl: null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["DPC", "ADMIN"].includes(session.user?.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { level, fileUrl } = body;
    if (!level || !fileUrl) {
      return NextResponse.json({ error: "Missing level or fileUrl" }, { status: 400 });
    }

    const sk = await prisma.boardSK.upsert({
      where: { level },
      update: { fileUrl },
      create: { level, fileUrl }
    });

    return NextResponse.json(sk);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

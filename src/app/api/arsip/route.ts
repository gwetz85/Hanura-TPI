import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  // Hanya ADMIN atau DPC yang bisa mengakses arsip
  if (session.user.role !== "ADMIN" && session.user.role !== "DPC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const archives = await prisma.archive.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploader: { select: { name: true, role: true } } }
  });
  return NextResponse.json(archives);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  if (session.user.role !== "ADMIN" && session.user.role !== "DPC") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { title, description, fileUrl } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const archive = await prisma.archive.create({
    data: {
      title,
      description,
      fileUrl,
      uploaderId: session.user.id
    }
  });

  return NextResponse.json(archive);
}

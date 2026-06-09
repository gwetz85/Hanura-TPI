import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  if (!session?.user || !["ADMIN", "DPC", "PETUGAS"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const documentations = await prisma.documentation.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploader: { select: { name: true, role: true } } }
  });
  return NextResponse.json(documentations);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  if (!session?.user || !["ADMIN", "DPC", "PETUGAS"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { title, description, photoUrls } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const documentation = await prisma.documentation.create({
    data: {
      title,
      description,
      photoUrls: photoUrls || [],
      uploaderId: session.user.id
    }
  });

  return NextResponse.json(documentation);
}

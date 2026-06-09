import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  if (session.user.role !== "ADMIN" && session.user.role !== "DPC" && session.user.role !== "PETUGAS") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { title, description, fileUrl } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const archive = await prisma.archive.update({
      where: { id },
      data: {
        title,
        description,
        ...(fileUrl ? { fileUrl } : {})
      }
    });
    return NextResponse.json(archive);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update archive" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  if (session.user.role !== "ADMIN" && session.user.role !== "DPC" && session.user.role !== "PETUGAS") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await prisma.archive.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete archive" }, { status: 500 });
  }
}

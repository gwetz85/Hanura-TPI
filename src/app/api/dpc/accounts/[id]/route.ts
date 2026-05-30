import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { username, password, name, role } = await request.json();

    if (!username || !name || !role) {
      return NextResponse.json({ error: "Nama, username, dan role harus diisi" }, { status: 400 });
    }

    const validRoles = ["PAC_BARAT", "PAC_KOTA", "PAC_TIMUR", "PAC_BUKIT_BESTARI"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Role PAC tidak valid" }, { status: 400 });
    }

    // Check if the user exists
    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.toLowerCase().trim(),
        id: { not: id }
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username sudah digunakan oleh akun lain" }, { status: 400 });
    }

    // Build update data
    const updateData: any = {
      username: username.toLowerCase().trim(),
      name: name.trim(),
      role
    };

    // Hash the password if updated
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating PAC account:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Prevent DPC from deleting itself
    if (id === session.user?.id) {
      return NextResponse.json({ error: "Tidak dapat menghapus akun Anda sendiri" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Use a transaction to perform manual cascade delete safely
    await prisma.$transaction([
      prisma.prospectiveMember.deleteMany({ where: { pacId: id } }),
      prisma.activitySuggestion.deleteMany({ where: { pacId: id } }),
      prisma.member.deleteMany({ where: { pacId: id } }),
      prisma.user.delete({ where: { id } })
    ]);

    return NextResponse.json({ message: "Akun PAC dan semua data terkait berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting PAC account:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

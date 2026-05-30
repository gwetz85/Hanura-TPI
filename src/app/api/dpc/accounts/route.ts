import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const pacUsers = await prisma.user.findMany({
      where: {
        role: { not: "ADMIN" }
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json(pacUsers);
  } catch (error) {
    console.error("Error fetching PAC accounts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { username, password, name, role } = await request.json();

    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 });
    }

    const validRoles = ["DPC", "PAC_BARAT", "PAC_KOTA", "PAC_TIMUR", "PAC_BUKIT_BESTARI"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Role PAC tidak valid" }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        role
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json(newUser, { status: 211 as any }); // standard 201 is fine, standard Next.js 200 or 201
  } catch (error) {
    console.error("Error creating PAC account:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

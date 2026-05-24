import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "DPC") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pacId, name, nik, address, phone } = await req.json();

    if (!pacId || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newMember = await prisma.member.create({
      data: {
        pacId,
        name,
        nik: nik || null,
        address: address || null,
        phone: phone || null,
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

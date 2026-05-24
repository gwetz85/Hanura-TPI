import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Only PAC users can submit KTA
  if (!session.user.role?.startsWith("PAC_")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, nik, address, phone, photoKtpUrl } = body;

  if (!name || !nik) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const newMember = await prisma.prospectiveMember.create({
      data: {
        name,
        nik,
        address: address ?? "",
        phone: phone ?? "",
        photoKtpUrl: photoKtpUrl ?? null,
        pac: { connect: { id: session.user.id } },
      },
    });
    return NextResponse.json(newMember);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

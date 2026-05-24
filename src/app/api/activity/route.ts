import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Only PAC users can suggest activities
  if (!session.user.role?.startsWith("PAC_")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, date, reply } = body;

  if (!title || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const suggestion = await prisma.activitySuggestion.create({
      data: {
        title,
        description,
        date: date ? new Date(date) : null,
        reply: reply ?? null,
        pac: { connect: { id: session.user.id } },
      },
    });
    return NextResponse.json(suggestion);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

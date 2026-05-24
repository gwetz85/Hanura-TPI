import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (!session.user.role?.startsWith("PAC_")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, date, time, location, activityType } = body;

  if (!title || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const suggestion = await prisma.activitySuggestion.create({
      data: {
        title,
        description,
        date: date ? new Date(date) : null,
        time: time ?? null,
        location: location ?? null,
        activityType: activityType ?? null,
        pac: { connect: { id: session.user.id } },
      },
    });
    return NextResponse.json(suggestion);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const where = session.user.role === "DPC"
      ? {}
      : { pacId: session.user.id };

    const suggestions = await prisma.activitySuggestion.findMany({
      where,
      include: {
        pac: { select: { id: true, name: true, role: true } },
        comments: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(suggestions);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

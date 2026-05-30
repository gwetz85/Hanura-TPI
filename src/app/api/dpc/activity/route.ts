import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["DPC", "ADMIN"].includes(session.user?.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, date, time, location, activityType, pacId } = body;

  if (!title || !description || !pacId) {
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
        pac: { connect: { id: pacId } },
        creatorRole: "DPC",
        isReadByDpc: true,
        isReadByPac: false,
      },
      include: {
        pac: { select: { id: true, name: true, role: true } },
        comments: { select: { id: true } },
      }
    });
    return NextResponse.json(suggestion);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

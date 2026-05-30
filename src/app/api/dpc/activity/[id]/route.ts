import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET single suggestion with comments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const suggestion = await prisma.activitySuggestion.findUnique({
    where: { id },
    include: {
      pac: { select: { id: true, name: true, role: true } },
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!suggestion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // PAC can only see their own suggestions
  if (!["DPC", "ADMIN"].includes(session.user?.role as string) && suggestion.pacId !== session.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(suggestion);
}

// PUT - update suggestion fields (DPC only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["DPC", "ADMIN"].includes(session.user?.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { reply, status } = await request.json();

  const updated = await prisma.activitySuggestion.update({
    where: { id },
    data: { reply: reply ?? null, status: status ?? "REPLIED" },
  });

  return NextResponse.json(updated);
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST - add a comment to a suggestion
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: suggestionId } = await params;
  const { message } = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
  }

  // Verify the suggestion exists and user has access
  const suggestion = await prisma.activitySuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // PAC can only comment on their own suggestions
  if (session.user.role !== "DPC" && suggestion.pacId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comment = await prisma.activityComment.create({
    data: {
      suggestionId,
      authorId: session.user.id!,
      message: message.trim(),
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

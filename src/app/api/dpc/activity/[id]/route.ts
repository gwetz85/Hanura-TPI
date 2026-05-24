import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "DPC") {
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

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

  // Update read status
  const isDpcAdmin = ["DPC", "ADMIN"].includes(session.user?.role as string);
  if (isDpcAdmin && !suggestion.isReadByDpc) {
    await prisma.activitySuggestion.update({ where: { id }, data: { isReadByDpc: true } });
  } else if (!isDpcAdmin && !suggestion.isReadByPac) {
    await prisma.activitySuggestion.update({ where: { id }, data: { isReadByPac: true } });
  }

  return NextResponse.json(suggestion);
}

// PUT - update suggestion fields
// DPC/ADMIN: can edit all fields
// PAC (owner): can only change status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const isDpcAdmin = ["DPC", "ADMIN"].includes(session.user?.role as string);

  // Check if suggestion exists
  const existing = await prisma.activitySuggestion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // PAC can only change status on their own suggestions
  if (!isDpcAdmin) {
    if (existing.pacId !== session.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // PAC can only update status
    const validStatuses = ["PENDING", "BATAL", "SEDANG_BERLANGSUNG", "SELESAI"];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const updated = await prisma.activitySuggestion.update({
      where: { id },
      data: { status: body.status, isReadByDpc: false },
    });
    return NextResponse.json(updated);
  }

  // DPC/ADMIN can edit everything
  const validStatuses = ["PENDING", "BATAL", "SEDANG_BERLANGSUNG", "SELESAI"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.date !== undefined) updateData.date = body.date ? new Date(body.date) : null;
  if (body.time !== undefined) updateData.time = body.time || null;
  if (body.location !== undefined) updateData.location = body.location || null;
  if (body.activityType !== undefined) updateData.activityType = body.activityType || null;
  if (body.reply !== undefined) updateData.reply = body.reply || null;
  if (body.status && validStatuses.includes(body.status)) updateData.status = body.status;

  // Mark as unread for PAC when DPC edits
  updateData.isReadByPac = false;

  const updated = await prisma.activitySuggestion.update({
    where: { id },
    data: updateData,
    include: {
      pac: { select: { id: true, name: true, role: true } },
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json(updated);
}

// DELETE - delete suggestion (DPC/ADMIN only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["DPC", "ADMIN"].includes(session.user?.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.activitySuggestion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Comments will be cascade deleted due to onDelete: Cascade in schema
  await prisma.activitySuggestion.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

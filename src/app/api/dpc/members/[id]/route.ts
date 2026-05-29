import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "DPC") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Whitelist only valid Member fields and type-cast properly
    const data: Record<string, unknown> = {};
    if (body.pacId !== undefined) data.pacId = body.pacId;
    if (body.noUrut !== undefined) {
      if (body.noUrut === "" || body.noUrut === null) {
        data.noUrut = null;
      } else {
        const parsed = parseInt(String(body.noUrut), 10);
        data.noUrut = isNaN(parsed) ? null : parsed;
      }
    }
    if (body.nomorKta !== undefined) data.nomorKta = body.nomorKta || null;
    if (body.name !== undefined) data.name = body.name;
    if (body.nik !== undefined) data.nik = body.nik || null;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.gender !== undefined) data.gender = body.gender || null;
    if (body.birthPlace !== undefined) data.birthPlace = body.birthPlace || null;
    if (body.birthDate !== undefined) data.birthDate = body.birthDate || null;
    if (body.maritalStatus !== undefined) data.maritalStatus = body.maritalStatus || null;
    if (body.jobStatus !== undefined) data.jobStatus = body.jobStatus || null;
    if (body.address !== undefined) data.address = body.address || null;
    if (body.village !== undefined) data.village = body.village || null;
    if (body.subDistrict !== undefined) data.subDistrict = body.subDistrict || null;
    if (body.isVerified !== undefined) data.isVerified = Boolean(body.isVerified);

    const updatedMember = await prisma.member.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "DPC") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.member.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

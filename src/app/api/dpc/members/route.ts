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

    const body = await req.json();

    if (Array.isArray(body)) {
      // Bulk insert
      const members = body.map((m: any) => ({
        pacId: m.pacId,
        noUrut: m.noUrut ? parseInt(m.noUrut) : null,
        nomorKta: m.nomorKta || null,
        name: m.name,
        nik: m.nik || null,
        phone: m.phone || null,
        gender: m.gender || null,
        birthPlace: m.birthPlace || null,
        birthDate: m.birthDate || null,
        agama: m.agama || null,
        maritalStatus: m.maritalStatus || null,
        jobStatus: m.jobStatus || null,
        address: m.address || null,
        village: m.village || null,
        subDistrict: m.subDistrict || null,
        isVerified: m.isVerified || false,
      }));

      // Filter out invalid items (must have pacId and name)
      const validMembers = members.filter((m: any) => m.pacId && m.name);

      await prisma.member.createMany({
        data: validMembers,
      });
      return NextResponse.json({ message: `Successfully inserted ${validMembers.length} members` }, { status: 201 });
    } else {
      // Single insert
      const { pacId, noUrut, nomorKta, name, nik, phone, gender, birthPlace, birthDate, agama, maritalStatus, jobStatus, address, village, subDistrict, isVerified } = body;

      if (!pacId || !name) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const newMember = await prisma.member.create({
        data: {
          pacId,
          noUrut: noUrut ? parseInt(noUrut) : null,
          nomorKta: nomorKta || null,
          name,
          nik: nik || null,
          phone: phone || null,
          gender: gender || null,
          birthPlace: birthPlace || null,
          birthDate: birthDate || null,
          agama: agama || null,
          maritalStatus: maritalStatus || null,
          jobStatus: jobStatus || null,
          address: address || null,
          village: village || null,
          subDistrict: subDistrict || null,
          isVerified: isVerified || false,
        },
      });

      return NextResponse.json(newMember, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating member(s):", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "DPC") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pacId = searchParams.get("pacId");

    if (!pacId) {
      return NextResponse.json({ error: "Missing pacId parameter" }, { status: 400 });
    }

    await prisma.member.deleteMany({
      where: { pacId },
    });

    return NextResponse.json({ message: "Successfully deleted all members for this PAC" });
  } catch (error) {
    console.error("Error deleting members:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

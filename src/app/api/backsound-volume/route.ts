import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - ambil volume saat ini
export async function GET() {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "backsound_volume" }
  });
  const volume = setting ? parseFloat(setting.value) : 0.5;
  return NextResponse.json({ volume });
}

// POST - simpan volume baru (hanya Admin)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const volume = parseFloat(body.volume);
  if (isNaN(volume) || volume < 0 || volume > 1) {
    return NextResponse.json({ error: "Volume harus antara 0 dan 1" }, { status: 400 });
  }

  await prisma.appSetting.upsert({
    where: { key: "backsound_volume" },
    update: { value: volume.toString() },
    create: { key: "backsound_volume", value: volume.toString() }
  });

  return NextResponse.json({ success: true, volume });
}

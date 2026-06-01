import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const fileData = body.fileData; // format: "data:audio/mpeg;base64,....."
    
    if (!fileData) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!fileData.startsWith("data:audio/")) {
      return NextResponse.json({ error: "Only audio files are allowed" }, { status: 400 });
    }

    // Extract the base64 part
    const base64String = fileData.split(",")[1];
    if (!base64String) {
      return NextResponse.json({ error: "Invalid file data format" }, { status: 400 });
    }

    // Save base64 string directly to DB (Vercel Serverless environment is Read-Only for FS)
    await prisma.appSetting.upsert({
      where: { key: "backsound_base64" },
      update: { value: base64String },
      create: { key: "backsound_base64", value: base64String }
    });

    return NextResponse.json({ success: true, message: "Backsound uploaded successfully" });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

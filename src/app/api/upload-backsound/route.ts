import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";

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

    const buffer = Buffer.from(base64String, "base64");

    // Save to public/uploads/backsound.mp3
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, "backsound.mp3");
    await writeFile(filePath, buffer);

    return NextResponse.json({ success: true, message: "Backsound uploaded successfully" });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

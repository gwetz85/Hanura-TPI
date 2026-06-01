import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "backsound_base64" }
    });

    if (!setting || !setting.value) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = Buffer.from(setting.value, "base64");
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    console.error("Failed to load backsound:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

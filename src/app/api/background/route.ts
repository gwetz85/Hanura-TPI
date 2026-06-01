import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "background_base64" }
    });

    if (!setting || !setting.value) {
      return new NextResponse(null, { status: 404 });
    }

    // setting.value is "data:image/jpeg;base64,...." or similar
    const [header, base64] = setting.value.split(",");
    
    // Extract mime type from header "data:image/jpeg;base64"
    const mimeType = header.replace("data:", "").replace(";base64", "");

    const buffer = Buffer.from(base64, "base64");
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    console.error("Failed to load background:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

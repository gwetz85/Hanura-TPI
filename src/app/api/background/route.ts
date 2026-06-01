import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: "background_base64" },
      select: { value: true, updatedAt: true }
    });

    if (!setting || !setting.value) {
      return new NextResponse(null, { status: 404 });
    }

    const [header, base64] = setting.value.split(",");
    const mimeType = header.replace("data:", "").replace(";base64", "");
    const buffer = Buffer.from(base64, "base64");

    // Use updatedAt as ETag for efficient cache validation
    const etag = `"${setting.updatedAt.getTime()}"`;
    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        // Cache in browser for 24h, CDN edge for 5 min
        "Cache-Control": "public, max-age=86400, s-maxage=300, stale-while-revalidate=3600",
        "ETag": etag,
        "Vary": "Accept-Encoding",
      }
    });
  } catch (error) {
    console.error("Failed to load background:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

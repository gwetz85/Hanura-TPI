import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = `${Date.now()}_${file.name}`;
  const uploadPath = path.join(process.cwd(), "public", "uploads", filename);
  await fs.writeFile(uploadPath, buffer);
  const urlPath = `/uploads/${filename}`;
  return NextResponse.json({ url: urlPath });
}

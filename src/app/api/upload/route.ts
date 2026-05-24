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
  const uploadedFile = file as any;
  const filename = `${Date.now()}_${uploadedFile.name || "uploaded_file"}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const uploadPath = path.join(uploadDir, filename);
  await fs.writeFile(uploadPath, buffer);
  const urlPath = `/uploads/${filename}`;
  return NextResponse.json({ url: urlPath });
}

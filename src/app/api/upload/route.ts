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
  
  // Get MIME type
  const mimeType = file.type || "application/octet-stream";
  
  // Convert to Base64 Data URI
  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;
  
  return NextResponse.json({ url: dataUri });
}

import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

/**
 * POST /api/admin/upload
 * Handles multipart/form-data with a "file" field.
 * Saves to public/uploads/ and returns the URL.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Create a unique filename
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${Date.now()}-${Math.round(Math.random() * 10000)}${ext}`;
    
    // Save to public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadDir, filename);

    // Make sure the directory exists
    try {
      await writeFile(filepath, buffer);
    } catch (e) {
      // In case public/uploads doesn't exist, we fallback
      const fs = require('fs');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      await writeFile(filepath, buffer);
    }

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

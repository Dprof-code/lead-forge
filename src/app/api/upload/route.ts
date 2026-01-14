import { NextResponse } from "next/server";
import {
  uploadFile,
  isProductionWithCloudinary,
  getFilePath,
} from "@/lib/file-storage";
import { writeFile } from "fs/promises";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are allowed" },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileName = `upload_${timestamp}_${file.name}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (isProductionWithCloudinary()) {
      // Upload to Cloudinary
      const url = await uploadFile(fileName, buffer);

      return NextResponse.json({
        success: true,
        filePath: url, // Return Blob URL
        fileName,
      });
    } else {
      // Save locally
      const filePath = await getFilePath(fileName);
      await writeFile(filePath, buffer);

      return NextResponse.json({
        success: true,
        filePath: `downloads/${fileName}`,
        fileName,
      });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

import path from "path";
import { mkdir, writeFile, readFile } from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Check if we're in production environment with Cloudinary configured
 */
export function isProductionWithCloudinary(): boolean {
  const hasCloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  const isProduction = process.env.NODE_ENV === "production";

  console.log("Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    HAS_CLOUDINARY: hasCloudinary,
    isProduction,
    result: hasCloudinary && isProduction,
  });

  return hasCloudinary && isProduction;
}

/**
 * Get the appropriate storage directory for local development
 */
export function getLocalStorageDir(): string {
  return path.join(process.cwd(), "public", "downloads");
}

/**
 * Ensure local storage directory exists
 */
export async function ensureLocalStorageDir(): Promise<string> {
  const dir = getLocalStorageDir();
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    // Directory already exists or other error - ignore
  }
  return dir;
}

/**
 * Upload file to Cloudinary or local storage
 */
export async function uploadFile(
  filename: string,
  data: Buffer | string
): Promise<string> {
  if (isProductionWithCloudinary()) {
    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "lead-forge",
            public_id: filename.replace(/\.[^/.]+$/, ""), // Remove extension
            resource_type: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else if (result) resolve(result.secure_url);
            else reject(new Error("Upload failed"));
          }
        )
        .end(data);
    });
  } else {
    // Save locally
    const dir = await ensureLocalStorageDir();
    const filePath = path.join(dir, filename);
    await writeFile(filePath, data);
    return `/downloads/${filename}`;
  }
}

/**
 * Get file content from Cloudinary or local storage
 */
export async function getFileContent(filenameOrUrl: string): Promise<Buffer> {
  if (isProductionWithCloudinary()) {
    // Fetch from Cloudinary URL
    const url = filenameOrUrl.startsWith("http")
      ? filenameOrUrl
      : filenameOrUrl;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    // Read from local storage
    const filename = filenameOrUrl.replace(/^\/downloads\//, "");
    const dir = getLocalStorageDir();
    const filePath = path.join(dir, filename);
    return await readFile(filePath);
  }
}

/**
 * Get full file path for local development or filename for production
 */
export async function getFilePath(filename: string): Promise<string> {
  if (isProductionWithCloudinary()) {
    // For Cloudinary, return just the filename (will be uploaded)
    return filename;
  } else {
    // For local, return full path
    const dir = await ensureLocalStorageDir();
    return path.join(dir, filename);
  }
}

/**
 * Delete file from Cloudinary or local storage
 */
export async function deleteFile(filenameOrUrl: string): Promise<void> {
  if (isProductionWithCloudinary()) {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const publicId = filenameOrUrl.split('/').slice(-1)[0].split('.')[0];
    await cloudinary.uploader.destroy(`lead-forge/${publicId}`);
  } else {
    // Delete from local storage
    const { unlink } = await import("fs/promises");
    const filename = filenameOrUrl.replace(/^\/downloads\//, "");
    const dir = getLocalStorageDir();
    const filePath = path.join(dir, filename);
    await unlink(filePath);
  }
}

/**
 * Legacy function - kept for backwards compatibility
 */
export async function ensureStorageDir(): Promise<string> {
  if (isVercelProduction()) {
    return "/tmp/downloads"; // Fallback, but won't be used
  }
  return await ensureLocalStorageDir();
}

/**
 * Legacy function - kept for backwards compatibility
 */
export function getStorageDir(): string {
  if (isVercelProduction()) {
    return "/tmp/downloads";
  }
  return getLocalStorageDir();
}

import path from "path";
import { mkdir, writeFile, readFile } from "fs/promises";
import { put, del, head } from "@vercel/blob";

/**
 * Check if we're in Vercel production environment
 */
export function isVercelProduction(): boolean {
  return process.env.NODE_ENV === "production" && process.env.VERCEL === "1";
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
 * Upload file to Vercel Blob or local storage
 */
export async function uploadFile(
  filename: string,
  data: Buffer | string
): Promise<string> {
  if (isVercelProduction()) {
    // Upload to Vercel Blob
    const blob = await put(filename, data, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  } else {
    // Save locally
    const dir = await ensureLocalStorageDir();
    const filePath = path.join(dir, filename);
    await writeFile(filePath, data);
    return `/downloads/${filename}`;
  }
}

/**
 * Get file content from Vercel Blob or local storage
 */
export async function getFileContent(
  filenameOrUrl: string
): Promise<Buffer> {
  if (isVercelProduction()) {
    // Fetch from Vercel Blob URL
    const url = filenameOrUrl.startsWith("http")
      ? filenameOrUrl
      : `${process.env.BLOB_READ_WRITE_TOKEN}/${filenameOrUrl}`;
    
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
  if (isVercelProduction()) {
    // For Vercel, return just the filename (will be uploaded to Blob)
    return filename;
  } else {
    // For local, return full path
    const dir = await ensureLocalStorageDir();
    return path.join(dir, filename);
  }
}

/**
 * Delete file from Vercel Blob or local storage
 */
export async function deleteFile(filenameOrUrl: string): Promise<void> {
  if (isVercelProduction()) {
    await del(filenameOrUrl);
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

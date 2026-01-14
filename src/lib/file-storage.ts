import path from "path";
import { mkdir } from "fs/promises";

/**
 * Get the appropriate storage directory based on environment
 * - Development: public/downloads (for easy access)
 * - Production (Vercel): /tmp (writable directory)
 */
export function getStorageDir(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const isVercel = process.env.VERCEL === "1";

  if (isProduction && isVercel) {
    // Use /tmp on Vercel (only writable directory)
    return "/tmp/downloads";
  }

  // Use public/downloads locally
  return path.join(process.cwd(), "public", "downloads");
}

/**
 * Ensure storage directory exists
 */
export async function ensureStorageDir(): Promise<string> {
  const dir = getStorageDir();
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    // Directory already exists or other error - ignore
  }
  return dir;
}

/**
 * Get full file path for a filename
 */
export async function getFilePath(filename: string): Promise<string> {
  const dir = await ensureStorageDir();
  return path.join(dir, filename);
}

/**
 * Check if we're in Vercel production environment
 */
export function isVercelProduction(): boolean {
  return process.env.NODE_ENV === "production" && process.env.VERCEL === "1";
}

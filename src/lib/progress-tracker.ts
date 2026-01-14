/**
 * In-memory progress tracker for scraping jobs
 * In production, consider using Redis for multi-instance support
 */

interface JobProgress {
  current: number;
  total: number;
  status: "running" | "completed" | "failed";
  error?: string;
  result?: any;
}

const progressMap = new Map<string, JobProgress>();

export function setProgress(
  jobId: string,
  current: number,
  total: number,
  status: "running" | "completed" | "failed" = "running",
  result?: any,
  error?: string
) {
  progressMap.set(jobId, { current, total, status, result, error });
}

export function getProgress(jobId: string): JobProgress | null {
  return progressMap.get(jobId) || null;
}

export function deleteProgress(jobId: string) {
  progressMap.delete(jobId);
}

export function clearOldProgress() {
  // Clear progress older than 1 hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [jobId, _] of progressMap.entries()) {
    const timestamp = parseInt(jobId.split("_")[1]);
    if (timestamp < oneHourAgo) {
      progressMap.delete(jobId);
    }
  }
}

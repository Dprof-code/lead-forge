import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { emailScraperWorker } from "@/workers/email-scraper.worker";

export const dynamic = "force-dynamic";

// Get job status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Check worker for job status
    const job = emailScraperWorker.getJob(jobId);

    if (job) {
      return NextResponse.json({
        success: true,
        status: job.status,
        jobId: job.id,
        progress: job.progress,
        stats: job.stats,
        outputFile: job.outputFile,
        downloadUrl:
          job.status === "completed"
            ? `/api/download/${job.outputFile}`
            : undefined,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
      });
    }

    // Fallback: check if output file exists (for completed jobs)
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const outputFilename = `email_scrape_${jobId}_results.csv`;
    const outputPath = path.join(uploadsDir, outputFilename);

    try {
      await fs.access(outputPath);

      // File exists - job is complete
      const stats = await fs.stat(outputPath);

      return NextResponse.json({
        success: true,
        status: "completed",
        jobId,
        progress: 100,
        outputFile: outputFilename,
        downloadUrl: `/api/download/${outputFilename}`,
        fileSize: stats.size,
        completedAt: stats.mtime,
      });
    } catch {
      // File doesn't exist and no job in worker - job not found
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error checking job status:", error);
    return NextResponse.json(
      { error: "Failed to check job status" },
      { status: 500 }
    );
  }
}

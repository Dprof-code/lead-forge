import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  emailScraperWorker,
  EmailScraperJob,
} from "@/workers/email-scraper.worker";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max for API route

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const useSelenium = formData.get("useSelenium") === "true";
    const delay = parseFloat(formData.get("delay") as string) || 2.0;
    const websiteColumn =
      (formData.get("websiteColumn") as string) || "website";
    const verifyEmails = formData.get("verifyEmails") !== "false"; // Default to true

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Save uploaded file
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const filename = `email_scrape_${timestamp}_${randomId}.csv`;
    const filepath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(bytes));

    // Output file path
    const outputFilename = `email_scrape_${timestamp}_${randomId}_results.csv`;
    const jobId = `${timestamp}_${randomId}`;

    console.log("📧 Starting email scraping job...");
    console.log("Job ID:", jobId);
    console.log("Input file:", filename);
    console.log("Settings:", {
      useSelenium,
      delay,
      websiteColumn,
      verifyEmails,
    });

    // Create job
    const job: EmailScraperJob = {
      id: jobId,
      inputFile: filename,
      outputFile: outputFilename,
      config: {
        useSelenium,
        delay,
        websiteColumn,
        verifyEmails,
      },
      status: "pending",
      progress: 0,
    };

    // Add job to worker BEFORE processing to avoid race condition
    emailScraperWorker.addJob(job);

    // Start processing in background (don't await)
    emailScraperWorker.processJob(job).catch((error) => {
      console.error(`Job ${jobId} failed:`, error);
    });

    // Return job info immediately
    return NextResponse.json({
      success: true,
      message: "Email scraping job started",
      jobId,
      inputFile: filename,
      outputFile: outputFilename,
      config: {
        useSelenium,
        delay,
        websiteColumn,
        verifyEmails,
      },
    });
  } catch (error) {
    console.error("Error in email scraping API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Get all jobs
export async function GET(request: NextRequest) {
  try {
    const jobs = emailScraperWorker.getAllJobs();

    return NextResponse.json({
      success: true,
      jobs: jobs.map((job) => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        stats: job.stats,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
      })),
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

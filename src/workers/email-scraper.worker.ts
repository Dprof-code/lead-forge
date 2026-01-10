/**
 * Email Scraping Worker
 * Processes email scraping jobs in the background
 */

import { spawn } from "child_process";
import path from "path";
import { promises as fs } from "fs";

export interface EmailScraperJob {
  id: string;
  inputFile: string;
  outputFile: string;
  config: {
    useSelenium: boolean;
    delay: number;
    websiteColumn: string;
    verifyEmails?: boolean;
  };
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  stats?: {
    totalBusinesses: number;
    websitesScraped: number;
    emailsFound: number;
    noEmail: number;
    errors: number;
    successRate: number;
  };
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export class EmailScraperWorker {
  private activeJobs: Map<string, EmailScraperJob> = new Map();

  async processJob(job: EmailScraperJob): Promise<EmailScraperJob> {
    console.log(`🚀 Starting email scraping job: ${job.id}`);

    // Update job status
    job.status = "running";
    job.startedAt = new Date();
    job.progress = 0;
    this.activeJobs.set(job.id, job);

    const pythonScript = path.join(process.cwd(), "python", "scrape_emails.py");
    const inputPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      job.inputFile
    );
    const outputPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      job.outputFile
    );

    // Build command arguments
    const args = [
      pythonScript,
      inputPath,
      "--output",
      outputPath,
      "--delay",
      job.config.delay.toString(),
      "--website-column",
      job.config.websiteColumn,
    ];

    if (job.config.useSelenium) {
      args.push("--selenium");
    } else {
      args.push("--fast");
    }

    // Add email verification flag if disabled
    if (job.config.verifyEmails === false) {
      args.push("--no-verify");
    }

    console.log("Executing:", "python", args.join(" "));

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn("python", args, {
        cwd: process.cwd(),
        env: { ...process.env },
      });

      let stdout = "";
      let stderr = "";
      let currentProgress = 0;

      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        console.log(output);

        // Parse progress from output
        const progressMatch = output.match(/\[(\d+)\/(\d+)\]/);
        if (progressMatch) {
          const current = parseInt(progressMatch[1]);
          const total = parseInt(progressMatch[2]);
          currentProgress = Math.round((current / total) * 100);
          job.progress = currentProgress;
          this.activeJobs.set(job.id, job);
        }

        // Parse stats from JSON output
        const statsMatch = output.match(/JSON_STATS:(.+)/);
        if (statsMatch) {
          try {
            job.stats = JSON.parse(statsMatch[1]);
          } catch (e) {
            console.error("Failed to parse stats JSON:", e);
          }
        }
      });

      pythonProcess.stderr.on("data", (data) => {
        const error = data.toString();
        stderr += error;
        console.error(error);
      });

      pythonProcess.on("close", (code) => {
        job.completedAt = new Date();

        if (code === 0) {
          job.status = "completed";
          job.progress = 100;
          console.log(`✅ Email scraping job ${job.id} completed successfully`);

          // Parse final stats if not already set
          if (!job.stats) {
            job.stats = this.parseScrapingStats(stdout);
          }

          this.activeJobs.set(job.id, job);
          resolve(job);
        } else {
          job.status = "failed";
          job.error = `Process exited with code ${code}`;
          if (stderr) {
            job.error += `\n${stderr}`;
          }
          console.error(`❌ Email scraping job ${job.id} failed:`, job.error);
          this.activeJobs.set(job.id, job);
          reject(new Error(job.error));
        }
      });

      pythonProcess.on("error", (error) => {
        job.status = "failed";
        job.error = error.message;
        job.completedAt = new Date();
        console.error(`❌ Email scraping job ${job.id} error:`, error);
        this.activeJobs.set(job.id, job);
        reject(error);
      });
    });
  }

  private parseScrapingStats(output: string): EmailScraperJob["stats"] {
    const stats = {
      totalBusinesses: 0,
      websitesScraped: 0,
      emailsFound: 0,
      noEmail: 0,
      errors: 0,
      successRate: 0,
    };

    const lines = output.split("\n");
    for (const line of lines) {
      if (line.includes("Total businesses:")) {
        stats.totalBusinesses = parseInt(line.match(/\d+/)?.[0] || "0");
      }
      if (line.includes("Websites scraped:")) {
        stats.websitesScraped = parseInt(line.match(/\d+/)?.[0] || "0");
      }
      if (line.includes("Emails found:")) {
        const match = line.match(/(\d+)/);
        stats.emailsFound = match ? parseInt(match[0]) : 0;
      }
      if (line.includes("No email:")) {
        stats.noEmail = parseInt(line.match(/\d+/)?.[0] || "0");
      }
      if (line.includes("Errors:")) {
        stats.errors = parseInt(line.match(/\d+/)?.[0] || "0");
      }
    }

    if (stats.websitesScraped > 0) {
      stats.successRate = Math.round(
        (stats.emailsFound / stats.websitesScraped) * 100
      );
    }

    return stats;
  }

  getJob(jobId: string): EmailScraperJob | undefined {
    return this.activeJobs.get(jobId);
  }

  addJob(job: EmailScraperJob): void {
    this.activeJobs.set(job.id, job);
  }

  getAllJobs(): EmailScraperJob[] {
    return Array.from(this.activeJobs.values());
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;

    // For now, we can only mark as failed
    // TODO: Implement actual process cancellation
    job.status = "failed";
    job.error = "Job cancelled by user";
    job.completedAt = new Date();
    this.activeJobs.set(jobId, job);

    return true;
  }

  clearCompletedJobs(): void {
    for (const [id, job] of this.activeJobs.entries()) {
      if (job.status === "completed" || job.status === "failed") {
        this.activeJobs.delete(id);
      }
    }
  }
}

// Singleton instance
export const emailScraperWorker = new EmailScraperWorker();

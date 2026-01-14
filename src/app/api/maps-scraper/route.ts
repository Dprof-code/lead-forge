import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/db/prisma";
import csv from "csv-parser";
import { GoogleMapsScraperFast } from "@/lib/scrapers/google-maps-fast";
import { getFilePath, ensureStorageDir } from "@/lib/file-storage";
import { setProgress } from "@/lib/progress-tracker";

interface ScrapeRequest {
  csvFile?: string; // Path to uploaded CSV
  urls?: string[]; // Direct array of URLs
  maxResults?: number;
  delay?: number;
  headless?: boolean;
}

export async function POST(request: Request) {
  try {
    const body: ScrapeRequest = await request.json();
    const {
      csvFile,
      urls,
      maxResults = 20,
      delay = 2,
      headless = false,
    } = body;

    if (!csvFile && (!urls || urls.length === 0)) {
      return NextResponse.json(
        { error: "Either CSV file or URLs array is required" },
        { status: 400 }
      );
    }

    // Generate unique job ID
    const jobId = `scrape_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    const outputFileName = `${jobId}_results.csv`;
    const outputFile = await getFilePath(outputFileName);

    // Ensure storage directory exists
    await ensureStorageDir();

    // If CSV file is provided, parse it to get URLs
    let urlsToScrape: string[] = urls || [];

    if (csvFile) {
      urlsToScrape = await parseUrlsFromCSV(csvFile);
    }

    if (urlsToScrape.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs found to scrape" },
        { status: 400 }
      );
    }

    console.log(`Starting scrape of ${urlsToScrape.length} URLs...`);

    // Initialize progress
    setProgress(jobId, 0, urlsToScrape.length, "running");

    // Return job ID immediately so frontend can start polling
    // Run scraping in background
    (async () => {
      try {
        const scraper = new GoogleMapsScraperFast();

        const businesses = await scraper.scrapeMultipleURLs({
          urls: urlsToScrape,
          maxResults,
          delay: 1,
          headless,
          outputFile,
          onProgress: (current, total) => {
            // Update progress
            setProgress(jobId, current, total, "running");
            console.log(
              `Progress: ${current}/${total} URLs (${Math.round(
                (current / total) * 100
              )}%)`
            );
          },
        });

        // Save to CSV
        await GoogleMapsScraperFast.saveToCsv(businesses, outputFile);

        // Mark as completed with result
        setProgress(jobId, urlsToScrape.length, urlsToScrape.length, "completed", {
          count: businesses.length,
          businesses: businesses.slice(0, 10),
          downloadUrl: `/api/download/${jobId}_results.csv`,
        });

        console.log(`✅ Scraping completed: ${businesses.length} businesses`);
      } catch (error: any) {
        console.error("Scraping error:", error);
        setProgress(jobId, 0, urlsToScrape.length, "failed", null, error.message);
      }
    })();

    // Return job ID immediately
    return NextResponse.json({
      success: true,
      jobId,
      totalUrls: urlsToScrape.length,
    });
  } catch (error: any) {
    console.error("Maps scraper error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

async function parseUrlsFromCSV(filePath: string): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    const urls: string[] = [];

    // Use storage utility to get full path
    const fullPath = await getFilePath(filePath.replace(/^downloads\//, ""));

    fs.createReadStream(fullPath)
      .pipe(csv())
      .on("data", (row) => {
        // Look for URL column (flexible column name matching)
        const url =
          row["google_maps_url"] ||
          row["Google Maps URL"] ||
          row["url"] ||
          row["URL"];

        if (url && url.includes("google.com/maps")) {
          urls.push(url);
        }
      })
      .on("end", () => {
        resolve(urls);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

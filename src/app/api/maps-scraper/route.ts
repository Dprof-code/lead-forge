import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/db/prisma";
import csv from "csv-parser";
import { GoogleMapsScraperFast } from "@/lib/scrapers/google-maps-fast";

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
    const outputFile = path.join(
      process.cwd(),
      "public",
      "downloads",
      `${jobId}_results.csv`
    );

    // Ensure downloads directory exists
    const downloadsDir = path.join(process.cwd(), "public", "downloads");
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

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

    try {
      // Use fast JavaScript scraper
      const scraper = new GoogleMapsScraperFast();

      const businesses = await scraper.scrapeMultipleURLs({
        urls: urlsToScrape,
        maxResults,
        delay: 1, // Reduced delay for faster scraping
        headless,
        outputFile,
        onProgress: (current, total) => {
          console.log(
            `Progress: ${current}/${total} URLs (${Math.round(
              (current / total) * 100
            )}%)`
          );
        },
      });

      // Save to CSV
      await GoogleMapsScraperFast.saveToCsv(businesses, outputFile);

      return NextResponse.json({
        success: true,
        jobId,
        count: businesses.length,
        businesses: businesses.slice(0, 10), // Preview first 10
        downloadUrl: `/api/download/${jobId}_results.csv`,
      });
    } catch (scrapeError: any) {
      console.error("Scraping error:", scrapeError);
      return NextResponse.json(
        {
          error: "Scraping failed",
          details: scrapeError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Maps scraper error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

async function parseUrlsFromCSV(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const urls: string[] = [];
    const fullPath = path.join(process.cwd(), "public", filePath);

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

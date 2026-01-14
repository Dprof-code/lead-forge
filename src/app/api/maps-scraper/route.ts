import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/db/prisma";
import csv from "csv-parser";
import { GoogleMapsScraperFast } from "@/lib/scrapers/google-maps-fast";
import { getFilePath, ensureStorageDir, uploadFile, isVercelProduction } from "@/lib/file-storage";
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
        if (isVercelProduction()) {
          // In production, save to Vercel Blob
          const csvContent = await generateCSVContent(businesses);
          const blobUrl = await uploadFile(outputFileName, csvContent);
          
          // Mark as completed with result
          setProgress(
            jobId,
            urlsToScrape.length,
            urlsToScrape.length,
            "completed",
            {
              count: businesses.length,
              businesses: businesses.slice(0, 10),
              downloadUrl: blobUrl,
            }
          );
        } else {
          // In development, save to local file
          await GoogleMapsScraperFast.saveToCsv(businesses, outputFile);
          
          // Mark as completed with result
          setProgress(
            jobId,
            urlsToScrape.length,
            urlsToScrape.length,
            "completed",
            {
              count: businesses.length,
              businesses: businesses.slice(0, 10),
              downloadUrl: `/api/download/${jobId}_results.csv`,
            }
          );
        }

        console.log(`✅ Scraping completed: ${businesses.length} businesses`);
      } catch (error: any) {
        console.error("Scraping error:", error);
        setProgress(
          jobId,
          0,
          urlsToScrape.length,
          "failed",
          null,
          error.message
        );
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
  const urls: string[] = [];

  try {
    let csvContent: string;

    // Check if it's a Blob URL (starts with http)
    if (filePath.startsWith("http")) {
      // Fetch from Vercel Blob
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from Blob: ${response.statusText}`);
      }
      csvContent = await response.text();
    } else {
      // Read from local file system
      const fullPath = await getFilePath(filePath.replace(/^downloads\//, ""));
      const { readFile } = await import("fs/promises");
      csvContent = await readFile(fullPath, "utf-8");
    }

    // Parse CSV content
    return new Promise((resolve, reject) => {
      const { Readable } = require("stream");
      const stream = Readable.from([csvContent]);

      stream
        .pipe(csv())
        .on("data", (row: any) => {
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
        .on("error", (error: any) => {
          reject(error);
        });
    });
  } catch (error) {
    throw error;
  }
}

// Helper function to generate CSV content from businesses
async function generateCSVContent(businesses: any[]): Promise<string> {
  const csvHeader = "name,phone,website,rating,reviews,address,category\n";
  const csvRows = businesses.map((b) => {
    const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;
    return [
      escape(b.name),
      escape(b.phone),
      escape(b.website),
      escape(b.rating),
      escape(b.reviews),
      escape(b.address),
      escape(b.category),
    ].join(",");
  });

  return csvHeader + csvRows.join("\n");
}

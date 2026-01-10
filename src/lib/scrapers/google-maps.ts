import { chromium, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

interface Business {
  name: string;
  phone: string;
  website: string;
  rating: string;
  reviews: string;
  address: string;
  category: string;
}

interface ScrapeOptions {
  urls: string[];
  maxResults?: number;
  delay?: number;
  headless?: boolean;
  outputFile: string;
  onProgress?: (current: number, total: number) => void;
}

export class GoogleMapsScraper {
  private page: Page | null = null;
  private browser: any = null;

  async initialize(headless: boolean = true) {
    this.browser = await chromium.launch({
      headless,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    this.page = await context.newPage();
  }

  async scrapeURL(url: string, maxResults: number = 20): Promise<Business[]> {
    if (!this.page) throw new Error("Browser not initialized");

    const businesses: Business[] = [];
    const seenBusinesses = new Set<string>(); // Deduplicate by name+address

    try {
      await this.page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await this.page.waitForTimeout(3000); // Wait for Google Maps to render

      // Wait for results feed to appear
      try {
        await this.page.waitForSelector('div[role="feed"]', { timeout: 10000 });
      } catch (e) {
        console.error("No results found for URL:", url);
        return businesses;
      }

      // Scroll to load results
      await this.scrollResults(maxResults);

      // Get all business links
      const businessLinks = await this.page
        .locator('div[role="feed"] a[href*="maps/place"]')
        .all();
      const totalFound = Math.min(businessLinks.length, maxResults);

      console.log(
        `Found ${businessLinks.length} businesses, scraping ${totalFound}...`
      );

      for (let i = 0; i < totalFound; i++) {
        try {
          // Re-query to avoid stale elements
          const links = await this.page
            .locator('div[role="feed"] a[href*="maps/place"]')
            .all();
          if (i >= links.length) break;

          await links[i].click({ timeout: 3000 });
          await this.page.waitForTimeout(1000); // Wait for sidebar to load

          const business = await this.extractBusinessData();

          // Deduplicate
          const businessKey = `${business.name}-${business.address}`;
          if (!seenBusinesses.has(businessKey) && business.name !== "N/A") {
            businesses.push(business);
            seenBusinesses.add(businessKey);
          }

          // Go back to results
          await this.page.goBack({
            timeout: 3000,
            waitUntil: "domcontentloaded",
          });
          await this.page.waitForTimeout(300);
        } catch (error: any) {
          console.error(`Error scraping business ${i + 1}:`, error.message);
          continue;
        }
      }
    } catch (error: any) {
      console.error("Error scraping URL:", url, error.message);
    }

    return businesses;
  }

  private async scrollResults(maxResults: number) {
    if (!this.page) return;

    const feedSelector = 'div[role="feed"]';

    try {
      for (let i = 0; i < 3; i++) {
        // Max 3 scrolls for speed
        await this.page.evaluate((selector) => {
          const feed = document.querySelector(selector);
          if (feed) {
            feed.scrollTop = feed.scrollHeight;
          }
        }, feedSelector);

        await this.page.waitForTimeout(800);
      }
    } catch (error) {
      console.error("Error scrolling:", error);
    }
  }

  private async extractBusinessData(): Promise<Business> {
    if (!this.page) throw new Error("Page not initialized");

    const business: Business = {
      name: "N/A",
      phone: "N/A",
      website: "N/A",
      rating: "N/A",
      reviews: "0",
      address: "N/A",
      category: "N/A",
    };

    try {
      // Name
      const nameEl = await this.page.locator("h1.DUwDvf, h1").first();
      if ((await nameEl.count()) > 0) {
        business.name = (await nameEl.textContent()) || "N/A";
      }

      // Rating & Reviews
      const ratingEl = await this.page
        .locator('div.F7nice span[aria-label*="star"]')
        .first();
      if ((await ratingEl.count()) > 0) {
        const ariaLabel = await ratingEl.getAttribute("aria-label");
        if (ariaLabel) {
          const ratingMatch = ariaLabel.match(/(\d+\.?\d*)\s*star/);
          if (ratingMatch) business.rating = ratingMatch[1];

          const reviewMatch = ariaLabel.match(/(\d+[\d,]*)\s*review/);
          if (reviewMatch) business.reviews = reviewMatch[1].replace(",", "");
        }
      }

      // Phone
      const phoneButton = await this.page
        .locator('button[data-item-id*="phone"]')
        .first();
      if ((await phoneButton.count()) > 0) {
        const dataItemId = await phoneButton.getAttribute("data-item-id");
        if (dataItemId) {
          const phoneMatch = dataItemId.match(/phone:tel:(.+)/);
          business.phone = phoneMatch
            ? phoneMatch[1]
            : (await phoneButton.textContent()) || "N/A";
        }
      }

      // Website
      const websiteLink = await this.page
        .locator('a[data-item-id*="authority"]')
        .first();
      if ((await websiteLink.count()) > 0) {
        business.website = (await websiteLink.getAttribute("href")) || "N/A";
      }

      // Address
      const addressButton = await this.page
        .locator('button[data-item-id*="address"]')
        .first();
      if ((await addressButton.count()) > 0) {
        const ariaLabel = await addressButton.getAttribute("aria-label");
        business.address = ariaLabel?.replace("Address: ", "") || "N/A";
      }

      // Category
      const categoryButton = await this.page.locator("button.DkEaL").first();
      if ((await categoryButton.count()) > 0) {
        business.category = (await categoryButton.textContent()) || "N/A";
      }
    } catch (error: any) {
      console.error("Error extracting business data:", error.message);
    }

    return business;
  }

  async scrapeMultipleURLs(options: ScrapeOptions): Promise<Business[]> {
    const {
      urls,
      maxResults = 20,
      delay = 2,
      headless = true,
      onProgress,
    } = options;

    await this.initialize(headless);

    const allBusinesses: Business[] = [];
    const seenBusinesses = new Set<string>();

    for (let i = 0; i < urls.length; i++) {
      try {
        console.log(`\nScraping ${i + 1}/${urls.length}: ${urls[i]}`);

        const businesses = await this.scrapeURL(urls[i], maxResults);

        // Deduplicate globally
        businesses.forEach((business) => {
          const key = `${business.name}-${business.phone}-${business.address}`;
          if (!seenBusinesses.has(key)) {
            allBusinesses.push(business);
            seenBusinesses.add(key);
          }
        });

        if (onProgress) {
          onProgress(i + 1, urls.length);
        }

        // Delay between URLs
        if (i < urls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * 1000));
        }

        // Restart browser every 50 URLs to prevent crashes
        if ((i + 1) % 50 === 0 && i < urls.length - 1) {
          console.log("Restarting browser to prevent crashes...");
          await this.close();
          await this.initialize(headless);
        }
      } catch (error: any) {
        console.error(`Error processing URL ${i + 1}:`, error.message);
        continue;
      }
    }

    await this.close();
    return allBusinesses;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  static async saveToCsv(businesses: Business[], filename: string) {
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

    const csvContent = csvHeader + csvRows.join("\n");
    fs.writeFileSync(filename, csvContent, "utf-8");
    console.log(`\nSaved ${businesses.length} businesses to ${filename}`);
  }
}

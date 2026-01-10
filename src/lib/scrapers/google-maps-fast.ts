import { chromium, Page } from "playwright";
import * as fs from "fs";

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

export class GoogleMapsScraperFast {
  private page: Page | null = null;
  private browser: any = null;

  async initialize(headless: boolean = true) {
    this.browser = await chromium.launch({
      headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    this.page = await context.newPage();
  }

  async scrapeURL(url: string, maxResults: number = 20): Promise<Business[]> {
    if (!this.page) throw new Error("Browser not initialized");

    const businesses: Business[] = [];
    const seenBusinesses = new Set<string>();

    try {
      // Navigate with shorter timeout
      await this.page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      // Wait for results to appear
      try {
        await this.page.waitForSelector('div[role="feed"]', { timeout: 10000 });
        await this.page.waitForTimeout(2000); // Let results render
      } catch (e) {
        console.error("No results found for URL:", url);
        return businesses;
      }

      // Scroll to load more results
      await this.scrollResults();

      // Extract business data directly from the list
      const businessCards = await this.page
        .locator('div[role="feed"] > div > div[jsaction]')
        .all();

      console.log(`Found ${businessCards.length} business cards`);

      for (let i = 0; i < Math.min(businessCards.length, maxResults); i++) {
        try {
          const card = businessCards[i];

          // Click to open details
          await card.click({ timeout: 3000 });
          await this.page.waitForTimeout(1000);

          const business = await this.extractBusinessData();

          // Deduplicate
          const businessKey = `${business.name}-${business.address}`;
          if (
            !seenBusinesses.has(businessKey) &&
            business.name !== "N/A" &&
            business.name.length > 0
          ) {
            businesses.push(business);
            seenBusinesses.add(businessKey);
            console.log(`  ✓ Scraped: ${business.name}`);
          }
        } catch (error: any) {
          console.error(`  ✗ Error on business ${i + 1}:`, error.message);
          continue;
        }
      }
    } catch (error: any) {
      console.error("Error scraping URL:", url, error.message);
    }

    return businesses;
  }

  private async scrollResults() {
    if (!this.page) return;

    try {
      const feedSelector = 'div[role="feed"]';

      // Scroll 3 times to load more results
      for (let i = 0; i < 3; i++) {
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
      // Name - try multiple selectors
      try {
        const nameSelectors = ["h1.DUwDvf", "h1", "[role='heading']"];
        for (const selector of nameSelectors) {
          const el = this.page.locator(selector).first();
          if ((await el.count()) > 0) {
            const text = await el.textContent();
            if (text && text.trim()) {
              business.name = text.trim();
              break;
            }
          }
        }
      } catch (e) {}

      // Rating & Reviews
      try {
        const ratingText = await this.page
          .locator('span[role="img"][aria-label*="star"]')
          .first()
          .getAttribute("aria-label");

        if (ratingText) {
          const match = ratingText.match(/([\d.]+)\s*star/i);
          if (match) business.rating = match[1];

          const reviewMatch = ratingText.match(/([\d,]+)\s*review/i);
          if (reviewMatch) business.reviews = reviewMatch[1].replace(/,/g, "");
        }
      } catch (e) {}

      // Phone - try multiple approaches
      try {
        const phoneSelectors = [
          'button[data-item-id*="phone"]',
          'a[href^="tel:"]',
          'button:has-text("phone")',
        ];

        for (const selector of phoneSelectors) {
          const el = this.page.locator(selector).first();
          if ((await el.count()) > 0) {
            // Try data attribute first
            const dataId = await el.getAttribute("data-item-id");
            if (dataId && dataId.includes("phone:tel:")) {
              business.phone = dataId.replace("phone:tel:", "");
              break;
            }

            // Try href
            const href = await el.getAttribute("href");
            if (href && href.startsWith("tel:")) {
              business.phone = href.replace("tel:", "");
              break;
            }

            // Try text content
            const text = await el.textContent();
            if (text) {
              business.phone = text.trim();
              break;
            }
          }
        }
      } catch (e) {}

      // Website
      try {
        const websiteEl = this.page
          .locator('a[data-item-id*="authority"]')
          .first();
        if ((await websiteEl.count()) > 0) {
          const href = await websiteEl.getAttribute("href");
          if (href) business.website = href;
        }
      } catch (e) {}

      // Address
      try {
        const addressSelectors = [
          'button[data-item-id*="address"]',
          '[data-tooltip="Copy address"]',
        ];

        for (const selector of addressSelectors) {
          const el = this.page.locator(selector).first();
          if ((await el.count()) > 0) {
            const ariaLabel = await el.getAttribute("aria-label");
            if (ariaLabel) {
              business.address = ariaLabel.replace("Address: ", "").trim();
              break;
            }

            const text = await el.textContent();
            if (text && text.trim()) {
              business.address = text.trim();
              break;
            }
          }
        }
      } catch (e) {}

      // Category
      try {
        const categoryEl = this.page.locator("button.DkEaL").first();
        if ((await categoryEl.count()) > 0) {
          const text = await categoryEl.textContent();
          if (text) business.category = text.trim();
        }
      } catch (e) {}
    } catch (error: any) {
      console.error("Error extracting business data:", error.message);
    }

    return business;
  }

  async scrapeMultipleURLs(options: ScrapeOptions): Promise<Business[]> {
    const {
      urls,
      maxResults = 20,
      delay = 1,
      headless = true,
      onProgress,
    } = options;

    await this.initialize(headless);

    const allBusinesses: Business[] = [];
    const seenBusinesses = new Set<string>();

    console.log(`Starting scrape of ${urls.length} URLs...`);

    for (let i = 0; i < urls.length; i++) {
      try {
        console.log(`\nScraping ${i + 1}/${urls.length}: ${urls[i]}`);

        const businesses = await this.scrapeURL(urls[i], maxResults);

        // Global deduplication
        businesses.forEach((business) => {
          const key = `${business.name}-${business.phone}-${business.address}`;
          if (!seenBusinesses.has(key)) {
            allBusinesses.push(business);
            seenBusinesses.add(key);
          }
        });

        console.log(
          `Progress: ${i + 1}/${urls.length} URLs (${Math.round(
            ((i + 1) / urls.length) * 100
          )}%)`
        );

        if (onProgress) {
          onProgress(i + 1, urls.length);
        }

        // Short delay between URLs
        if (i < urls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * 1000));
        }

        // Restart browser every 30 URLs to prevent memory issues
        if ((i + 1) % 30 === 0 && i < urls.length - 1) {
          console.log("\n🔄 Restarting browser to prevent crashes...");
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
    console.log(`\n✓ Saved ${businesses.length} businesses to ${filename}`);
  }
}

# Email Scraper Feature

## Overview

The Email Scraper automatically extracts email addresses from business websites by visiting multiple pages including homepage, contact, about, and team pages.

## Features

✅ **Multi-Page Scraping**: Checks homepage, contact, about, and team pages  
✅ **Two Modes**:

- **Thorough (Selenium)**: Works with JavaScript-heavy sites, recommended (3-5s per site)
- **Fast (Requests)**: Basic scraping for static sites (1-2s per site)  
  ✅ **Smart Email Filtering**: Removes fake/test emails (example.com, test.com, etc.)  
  ✅ **Progress Tracking**: Real-time progress updates with statistics  
  ✅ **Resume Support**: Saves progress every 10 websites  
  ✅ **CSV Output**: Results added as new "email" column in CSV

## Architecture

### Components

1. **Frontend** (`/email-scraper`)

   - File upload with drag & drop
   - Scraping mode selection (Thorough/Fast)
   - Configurable delay between requests
   - Real-time progress display
   - Download results

2. **API Routes**

   - `POST /api/scrape/emails` - Start scraping job
   - `GET /api/scrape/emails` - Get all jobs
   - `GET /api/scrape/emails/[jobId]` - Get job status

3. **Worker** (`/workers/email-scraper.worker.ts`)

   - Background job processing
   - Python script execution
   - Progress tracking
   - Statistics collection

4. **Python Script** (`/python/scrape_emails.py`)
   - Selenium/Requests-based scraping
   - Multi-page email extraction
   - Smart filtering
   - Progress reporting

## Usage

### Web Interface

1. Navigate to `/email-scraper`
2. Upload CSV file with website URLs
3. Select scraping mode:
   - **Thorough**: Best for JavaScript sites
   - **Fast**: Quick scraping for simple sites
4. Set delay (2s recommended)
5. Click "Start Email Scraping"
6. Monitor progress
7. Download results when complete

### CSV Format

**Input CSV** (required column):

```csv
name,website,phone
ABC Plumbing,abcplumb.com,555-0100
XYZ HVAC,xyzhvac.com,555-0200
```

**Output CSV** (adds email column):

```csv
name,website,phone,email
ABC Plumbing,abcplumb.com,555-0100,info@abcplumb.com
XYZ HVAC,xyzhvac.com,555-0200,contact@xyzhvac.com, sales@xyzhvac.com
```

### Python Script (CLI)

```bash
# Basic usage
python python/scrape_emails.py input.csv

# With Selenium (recommended)
python python/scrape_emails.py input.csv --selenium

# Custom output file
python python/scrape_emails.py input.csv --output results.csv

# Fast mode (requests only)
python python/scrape_emails.py input.csv --fast

# Custom delay
python python/scrape_emails.py input.csv --delay 3

# Custom website column
python python/scrape_emails.py input.csv --website-column "site_url"
```

### API Usage

```javascript
// Start scraping job
const formData = new FormData();
formData.append("file", csvFile);
formData.append("useSelenium", "true");
formData.append("delay", "2");
formData.append("websiteColumn", "website");

const response = await fetch("/api/scrape/emails", {
  method: "POST",
  body: formData,
});

const { jobId } = await response.json();

// Check job status
const statusResponse = await fetch(`/api/scrape/emails/${jobId}`);
const { status, progress, stats } = await statusResponse.json();
```

## Configuration

### Scraping Settings

| Setting        | Default   | Description                            |
| -------------- | --------- | -------------------------------------- |
| Mode           | Thorough  | Selenium (thorough) or Requests (fast) |
| Delay          | 2s        | Delay between website requests         |
| Website Column | "website" | CSV column name with URLs              |

### Python Dependencies

Required packages (see `python/requirements.txt`):

- selenium
- webdriver-manager
- pandas
- requests
- urllib3

Install with:

```bash
pip install selenium webdriver-manager pandas requests urllib3
```

## How It Works

1. **Upload**: User uploads CSV with website URLs
2. **Job Creation**: API creates job and saves file
3. **Background Processing**: Worker executes Python script
4. **Multi-Page Scraping**:
   - Visits homepage
   - Extracts all emails
   - If no emails found, checks `/contact`, `/about`, `/team` pages
5. **Email Filtering**:
   - Validates email format
   - Removes fake domains (example.com, test.com)
   - Filters file extensions (.jpg, .png, etc.)
6. **Progress Saving**: Saves CSV every 10 websites
7. **Completion**: Returns CSV with email column

## Email Extraction Logic

### Pages Checked (in order)

1. Homepage
2. `/contact` or `/contact-us`
3. `/about` or `/about-us`
4. `/team`

### Filtering Rules

**Excluded Domains:**

- example.com, yourdomain.com, email.com
- test.com, domain.com
- sentry.io, wixpress.com, cloudflare.com
- schema.org, w3.org

**Excluded Patterns:**

- File extensions (.jpg, .png, .pdf, .css, .js)
- Emails longer than 100 characters
- Emails with spaces

**Validation:**

- Must contain `@` symbol
- Must have `.` in domain part
- Must match email regex pattern

## Performance

| Websites | Mode     | Delay | Estimated Time |
| -------- | -------- | ----- | -------------- |
| 10       | Thorough | 2s    | ~30 seconds    |
| 50       | Thorough | 2s    | ~2.5 minutes   |
| 100      | Thorough | 2s    | ~5 minutes     |
| 10       | Fast     | 1s    | ~15 seconds    |
| 50       | Fast     | 1s    | ~1 minute      |
| 100      | Fast     | 1s    | ~2 minutes     |

_Note: Times include page loading and processing_

## Troubleshooting

### ChromeDriver Issues

If Selenium fails to initialize:

```bash
# Install/update ChromeDriver
pip install --upgrade webdriver-manager

# Or manually download from:
# https://chromedriver.chromium.org/
```

### Permission Errors

Ensure uploads directory exists and is writable:

```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

### No Emails Found

Common reasons:

- Website blocks automated access
- Emails are in images (can't be scraped)
- Contact form only (no direct email)
- Website requires JavaScript (use Thorough mode)

### Rate Limiting

If getting blocked:

- Increase delay between requests (--delay 3 or higher)
- Use smaller batches
- Consider proxy rotation (future feature)

## Best Practices

1. **Be Respectful**:

   - Use 2-3 second delays minimum
   - Don't scrape the same site repeatedly
   - Follow robots.txt guidelines

2. **Mode Selection**:

   - Use **Thorough** for modern JavaScript sites
   - Use **Fast** only for simple HTML sites
   - When in doubt, use Thorough

3. **Batch Processing**:

   - Process 50-100 websites at a time
   - Monitor for errors
   - Review results before processing more

4. **Data Validation**:
   - Manually verify a sample of extracted emails
   - Remove duplicates after scraping
   - Check for obvious fake emails

## Future Enhancements

- [ ] Proxy rotation support
- [ ] Custom page paths (e.g., check `/reach-us`, `/info`)
- [ ] Email validation API integration
- [ ] Pause/Resume functionality
- [ ] Batch size limits
- [ ] Concurrent scraping (with rate limiting)
- [ ] Screenshot capture for analysis
- [ ] Email confidence scoring

## Security Notes

- Scraped data is stored in `public/uploads` (ensure proper permissions)
- Consider moving to private storage in production
- Implement user authentication before deployment
- Add rate limiting per user
- Monitor for abuse

## Legal Considerations

⚠️ **Important**: Web scraping may be subject to legal restrictions:

- Review website's Terms of Service
- Respect robots.txt
- Don't scrape personal data without consent
- Use for legitimate business purposes only
- Comply with GDPR/CCPA if applicable

This tool is for **business lead generation** purposes only.

## Support

For issues or questions:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review Python script logs
3. Check browser console for errors
4. Verify CSV format

---

**Version**: 1.0  
**Last Updated**: January 7, 2026

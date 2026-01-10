# Email Scraper - Quick Start Guide

## Installation

### 1. Install Python Dependencies

```bash
cd python
pip install -r requirements.txt
```

Or install individually:

```bash
pip install selenium webdriver-manager pandas requests urllib3
```

### 2. Create Upload Directory

```bash
mkdir -p public/uploads
```

### 3. Verify Setup

Test the Python script:

```bash
python python/scrape_emails.py --help
```

You should see usage instructions.

## Testing the Email Scraper

### Create a Test CSV

Create `test_websites.csv`:

```csv
name,website
Google,google.com
GitHub,github.com
Stack Overflow,stackoverflow.com
```

### Test with Python Script

```bash
# Basic test (fast mode)
python python/scrape_emails.py test_websites.csv --fast --delay 1

# Full test (Selenium mode)
python python/scrape_emails.py test_websites.csv --selenium --delay 2
```

### Test with Web Interface

1. Start the development server:

```bash
npm run dev
```

2. Navigate to: http://localhost:3000/email-scraper

3. Upload `test_websites.csv`

4. Select "Fast" mode with 1-second delay

5. Click "Start Email Scraping"

6. Watch progress and download results

## Expected Results

The script will create `test_websites_with_emails.csv`:

```csv
name,website,email
Google,google.com,N/A
GitHub,github.com,support@github.com
Stack Overflow,stackoverflow.com,team@stackoverflow.com
```

_Note: Results may vary based on website structure changes_

## Troubleshooting

### ChromeDriver Not Found

```bash
# Reinstall webdriver-manager
pip install --upgrade webdriver-manager

# Clear cache
rm -rf ~/.wdm
```

### Module Not Found

```bash
# Verify all packages installed
pip list | grep -E "selenium|pandas|requests"
```

### Upload Fails

```bash
# Check directory permissions
ls -la public/uploads

# Create if missing
mkdir -p public/uploads
chmod 755 public/uploads
```

## Production Deployment

Before deploying to production:

1. **Environment Variables**:

```env
UPLOAD_DIR=/var/www/uploads
PYTHON_PATH=/usr/bin/python3
MAX_FILE_SIZE=10485760  # 10MB
```

2. **Install Python on Server**:

```bash
# Ubuntu/Debian
apt-get install python3 python3-pip chromium-browser

# Install dependencies
pip3 install -r python/requirements.txt
```

3. **Configure Chromium for Headless**:

```bash
# Add to Dockerfile or server setup
apt-get install -y chromium-browser chromium-chromedriver
```

4. **Set Up File Storage**:

- Move uploads to private directory
- Use S3/Cloud Storage for production
- Implement file cleanup cron job

## Next Steps

1. ✅ Test email scraper with sample CSV
2. ✅ Verify results are accurate
3. ✅ Try both Fast and Thorough modes
4. ✅ Check progress tracking works
5. ✅ Test download functionality

For detailed documentation, see [EMAIL_SCRAPER_COMPLETE.md](./EMAIL_SCRAPER_COMPLETE.md)

---

**Ready to use!** 🚀

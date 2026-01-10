# Google Maps Scraper - Quick Test Guide

## Prerequisites

1. **Python Dependencies Installed:**

```bash
cd python
pip install -r requirements.txt
```

2. **Chrome Browser Installed**

3. **Development Server Running:**

```bash
npm run dev
```

## Step-by-Step Test

### 1. Generate Test Queries

1. Navigate to http://localhost:3000/query-generator
2. Enter:
   - Business Type: `plumbing`
   - Country: `United States`
   - State: `Idaho`
   - City: `Boise`
3. Click "Generate Queries"
4. Download the CSV file
5. Note the download location (should be in `public/downloads/`)

### 2. Test Maps Scraper

1. Navigate to http://localhost:3000/maps-scraper
2. Upload the CSV you just downloaded
3. Configure settings:
   - Max Results: `10` (small test)
   - Delay: `2 seconds`
   - Headless: `unchecked` (to see it working)
4. Click "Start Scraping"

### 3. Verify Results

**Expected Behavior:**

- Chrome browser opens (if not headless)
- Visits each Google Maps URL
- Scrolls through results
- Clicks on businesses
- Extracts data
- Progress bar updates
- CSV file generated

**Success Indicators:**

- ✅ No errors in console
- ✅ Progress bar reaches 100%
- ✅ "Scraping Complete" message shows
- ✅ Preview table displays businesses
- ✅ Download button appears
- ✅ CSV file downloads successfully

### 4. Inspect Results CSV

Open the downloaded CSV and verify columns:

- `name` - Business name
- `phone` - Phone number
- `website` - Website URL
- `rating` - Star rating
- `reviews` - Review count
- `address` - Full address
- `category` - Business category

## Troubleshooting

### Error: "Python not found"

**Solution:**

```bash
# Windows
where python
# Should show: C:\Users\...\Python\Python3XX\python.exe

# If not found, install Python from python.org
```

### Error: "Module 'selenium' not found"

**Solution:**

```bash
cd python
pip install selenium webdriver-manager
```

### Error: "ChromeDriver not found"

**Solution:**

- Install Chrome browser
- `webdriver-manager` will auto-download ChromeDriver on first run

### Error: "No URLs found to scrape"

**Solution:**

- Verify CSV has `google_maps_url` column
- Check CSV formatting is correct
- Try uploading a different CSV

### Browser Opens but No Data Scraped

**Solution:**

- Google Maps may have updated their HTML structure
- Check Python console output for errors
- Try reducing `maxResults` to 5
- Increase delay to 3-5 seconds

## Test with Sample Data

If you don't want to generate queries, create a test CSV:

**test_maps_input.csv:**

```csv
query,google_maps_url
plumbing Boise,https://www.google.com/maps/search/plumbing,%2083701,%20Boise,%20ID,%20US/?hl=en&gl=US
```

Upload this CSV to test the scraper.

## Expected Output Example

**Successful scraping output:**

```json
{
  "success": true,
  "jobId": "scrape_1736089234_xyz789",
  "count": 10,
  "businesses": [
    {
      "name": "ABC Plumbing",
      "phone": "208-555-0100",
      "website": "https://abcplumbing.com",
      "rating": "4.5",
      "reviews": "120",
      "address": "123 Main St, Boise, ID 83702",
      "category": "Plumber"
    },
    ...
  ],
  "downloadUrl": "/downloads/scrape_1736089234_xyz789_results.csv"
}
```

## Performance Benchmarks

| Queries | Max Results | Delay | Expected Time |
| ------- | ----------- | ----- | ------------- |
| 5       | 10          | 2s    | ~2 minutes    |
| 10      | 20          | 2s    | ~5 minutes    |
| 20      | 20          | 3s    | ~12 minutes   |

## Next Steps After Successful Test

1. ✅ Test with larger dataset (20+ queries)
2. ✅ Test headless mode
3. ✅ Verify CSV download works
4. ✅ Test Data Cleaner with scraped results
5. ✅ Implement error handling improvements
6. ✅ Add pause/resume functionality (future)

## Common Issues & Solutions

### Issue: Scraping is slow

- **Solution:** Enable headless mode
- Reduce max results per search
- Acceptable: 10-15 minutes for 100 businesses

### Issue: Some businesses have "N/A" data

- **Expected:** Not all businesses have websites/phones
- Google Maps doesn't require complete data
- Use Data Cleaner to filter incomplete records

### Issue: Rate limited by Google

- **Solution:** Increase delay to 5 seconds
- Reduce batch size
- Use residential proxy (future enhancement)

## Success Checklist

- [ ] Python dependencies installed
- [ ] Chrome browser installed
- [ ] Query Generator works
- [ ] CSV upload works
- [ ] Maps Scraper starts without errors
- [ ] Browser opens (non-headless mode)
- [ ] Businesses are scraped
- [ ] Progress updates in real-time
- [ ] CSV downloads successfully
- [ ] Data looks correct in CSV

## Report Issues

If you encounter errors not covered here:

1. Check browser console (F12)
2. Check terminal/PowerShell output
3. Enable non-headless mode to see what's happening
4. Review `MAPS_SCRAPER_README.md` for details

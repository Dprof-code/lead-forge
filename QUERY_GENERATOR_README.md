# Query Generator Feature

## ✅ Implementation Complete

The Query Generator feature is fully implemented with **cascading location dropdowns** and **real-time ZIP code fetching**!

### 🎯 What It Does

Generates Google Maps search queries for any business type across all ZIP codes in a specified city. Features:

- ✅ **Country → State → City** cascading dropdowns
- ✅ **Real-time location data** from Geonames API
- ✅ **Automatic ZIP code fetching** for selected city
- ✅ **Database caching** for faster subsequent loads
- ✅ **Global coverage** - all countries supported

### 📁 Files Created

**Frontend:**

- `src/app/(dashboard)/query-generator/page.tsx` - User interface with cascading dropdowns

**Backend:**

- `src/app/api/query-generator/route.ts` - Query generation API
- `src/app/api/locations/countries/route.ts` - Countries endpoint
- `src/app/api/locations/states/route.ts` - States endpoint
- `src/app/api/locations/cities/route.ts` - Cities endpoint

**Python Script:**

- `python/query_generator.py` - Query generation + ZIP code lookup
- `python/requirements.txt` - Python dependencies (requests)

**Database:**

- Country, State, City models for caching location data

### 🔧 Setup Requirements

#### 1. Register for Free Geonames API

**See [GEONAMES_SETUP.md](./GEONAMES_SETUP.md) for detailed instructions.**

Quick steps:

1. Register at [geonames.org/login](https://www.geonames.org/login)
2. Enable free web services in account settings
3. Add username to `.env`:
   ```bash
   GEONAMES_USERNAME="your_username"
   ```

#### 2. Install Python Dependencies

```bash
# Activate virtual environment (recommended)
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r python/requirements.txt
```

#### 3. Update Database Schema

```bash
npx prisma generate
npx prisma db push
```

### 🚀 How to Use

#### 1. Start the Development Server

```bash
npm run dev
```

#### 2. Use the Feature

1. Navigate to [http://localhost:3000/dashboard/query-generator](http://localhost:3000/dashboard/query-generator)
2. **Select Country** from dropdown (auto-selects US)
3. **Select State/Province** (loads after country selected)
4. **Select City** (loads after state selected)
5. **Enter Business Type**: e.g., "plumbing", "construction", "HVAC"
6. Click "Generate Queries"
7. Download the CSV file with all generated queries

### 📊 How It Works

1. **Frontend loads countries** from `/api/locations/countries`

   - Fetches from Geonames API
   - Caches in database
   - Subsequent loads are instant

2. **User selects country** → Fetches states for that country

3. **User selects state** → Fetches cities for that state

4. **User selects city** → Stores city's geonameId

5. **On submit** → Passes geonameId to Python script

6. **Python script** → Fetches ZIP codes from Geonames using geonameId

7. **Generates queries** → One per ZIP code with Google Maps URL

### 📊 Output Format

The generated CSV file includes:

| Column            | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `query`           | Complete search query (e.g., "plumbing, 83701, Boise, ID, US") |
| `google_maps_url` | Direct Google Maps search URL                                  |
| `business_type`   | Type of business searched                                      |
| `zip_code`        | ZIP code for the search                                        |
| `city`            | City name                                                      |
| `state`           | State abbreviation                                             |
| `country`         | Country code                                                   |

### 💾 Database Tracking

Every query generation creates a Job record:

```typescript
{
  id: string,
  userId: string,
  type: 'query_generator',
  status: 'completed',
  config: {
    businessType: string,
    city: string,
    state: string,
    country: string
  },
  result: {
    count: number,
    preview: Array<Query>
  },
  outputFile: string,  // Path to CSV
  createdAt: Date,
  completedAt: Date
}
```

### 🔧 Technical Details

**Architecture:**

1. User submits form on frontend
2. Next.js API route receives request
3. Creates Job record in database
4. Spawns Python process with parameters
5. Python script generates queries and saves CSV
6. Updates Job with results
7. Returns download URL to frontend

**Python Integration:**

- Uses Node.js `child_process.spawn()` to run Python
- Passes arguments as JSON string
- Python outputs results as JSON to stdout
- Node.js parses and processes the output

### 📝 Predefined Cities

The Python script includes ZIP codes for these cities:

- Boise, ID
- New York, NY
- Los Angeles, CA
- Chicago, IL

For other cities, it will use the city name directly (you can expand the `city_zips` dictionary in `query_generator.py`).

### 🎨 Features

✅ Real-time generation feedback
✅ Preview of first 5 queries
✅ Download full CSV
✅ Job tracking in database
✅ Error handling
✅ Loading states
✅ Responsive design
✅ Direct links to Google Maps Scraper

### 🔄 Workflow Integration

After generating queries, users can:

1. Download the CSV file
2. Navigate directly to the Maps Scraper
3. Upload the CSV to scrape businesses

### 🐛 Troubleshooting

**"Python script failed" error:**

- Make sure Python is installed and in your PATH
- Run `python --version` to verify
- Install dependencies: `pip install -r python/requirements.txt`

**No queries generated:**

- Check if the city is in the predefined list
- Verify ZIP codes are available for that city
- Check Python script logs in the API response

**File download not working:**

- Check that `public/downloads` directory exists
- Verify file permissions
- Check browser console for errors

### 🚀 Next Steps

1. **Expand ZIP Code Database**: Add more cities to `city_zips` dictionary
2. **Add Real ZIP Code API**: Integrate with ZipCodeAPI or GeoNames
3. **Custom ZIP Codes**: Allow users to input custom ZIP codes
4. **Batch Generation**: Generate for multiple cities at once
5. **Save Templates**: Save frequently used query configurations

### 📚 Example Usage

**Generate queries for plumbing businesses in Boise:**

```
Business Type: plumbing
City: Boise
State: ID
Country: US
```

**Result:** 15 queries like:

```
plumbing, 83701, Boise, ID, US
plumbing, 83702, Boise, ID, US
...
```

Each with a corresponding Google Maps URL:

```
https://www.google.com/maps/search/plumbing%2C%2083701%2C%20Boise%2C%20ID%2C%20US/?hl=en&gl=US
```

### 🔐 Security

- ✅ Requires authentication
- ✅ User-specific jobs (can only see own queries)
- ✅ Input validation on both frontend and backend
- ✅ Safe file handling with unique filenames
- ✅ Python script runs in isolated process

---

**Ready to generate queries!** Navigate to `/dashboard/query-generator` and start building your prospect lists! 🚀

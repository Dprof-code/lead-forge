# Geonames API Setup Guide

## Overview

LeadForge uses the **Geonames API** to provide location data (countries, states, cities, and ZIP codes) for the Query Generator feature.

## Why Geonames?

- ✅ **Free** for up to 20,000 credits/day
- ✅ **Comprehensive** data for 11+ million place names
- ✅ **Global** coverage - all countries
- ✅ **No credit card** required
- ✅ **Commercial use** allowed

---

## Getting Your Free API Key

### Step 1: Register for Free Account

1. Visit [https://www.geonames.org/login](https://www.geonames.org/login)
2. Click **"create a new user account"**
3. Fill in the registration form:
   - Username (this becomes your API key)
   - Email address
   - Accept terms of service
4. Check your email and click the confirmation link

### Step 2: Enable Free Web Services

1. Log in to your Geonames account
2. Go to [https://www.geonames.org/manageaccount](https://www.geonames.org/manageaccount)
3. Scroll down to **"Free Web Services"**
4. Click **"Click here to enable"**

### Step 3: Add Username to Environment Variables

Add your Geonames username to your `.env` file:

```bash
# .env

DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."

# Geonames API (required for location dropdowns)
GEONAMES_USERNAME="your_geonames_username"
```

Replace `your_geonames_username` with the username you registered.

---

## API Limits

**Free Tier:**

- 20,000 credits per day
- 1,000 credits per hour
- Each API call uses 1-10 credits depending on the endpoint

**Our Usage:**

- Countries list: ~1 credit (cached in database)
- States list: ~5 credits per country (cached)
- Cities list: ~10 credits per state (cached)
- ZIP codes: ~5-10 credits per city

**Caching Strategy:**  
LeadForge caches all location data in PostgreSQL, so API calls only happen once per location. Subsequent requests are served from the database.

---

## Features Enabled by Geonames

### 1. **Country Dropdown**

- Lists all 252 countries worldwide
- Auto-selects United States by default
- Cached in database after first fetch

### 2. **State/Province Dropdown**

- Dynamically loads based on selected country
- Shows administrative divisions (states, provinces, regions)
- Includes state codes (e.g., "ID", "NY", "CA")

### 3. **City Dropdown**

- Lists all cities in the selected state
- Shows population for each city
- Sorted alphabetically

### 4. **ZIP Code Lookup**

- Automatically fetches ZIP codes for the selected city
- Used in Python script to generate Google Maps queries
- Supports postal codes globally (not just US)

---

## Testing Without API Key

If you don't have a Geonames API key yet, the system will:

1. Use the default `demo` account (limited to 20,000 calls/day across ALL users)
2. Show an error message prompting you to configure your own key
3. Fall back to hardcoded cities for testing:
   - Boise, ID
   - New York, NY
   - Los Angeles, CA
   - Chicago, IL

**Demo Mode Limitations:**

- ⚠️ Shared rate limit with all demo users
- ⚠️ May fail during high traffic
- ⚠️ Not recommended for production

---

## Troubleshooting

### Error: "The hourly limit of 2000 credits for demo has been exceeded"

**Solution:**  
Register for your own free Geonames account and add `GEONAMES_USERNAME` to `.env`.

### Error: "Please configure GEONAMES_USERNAME in environment variables"

**Solution:**

1. Create `.env` file in project root
2. Add `GEONAMES_USERNAME="your_username"`
3. Restart the dev server: `npm run dev`

### No Countries Showing in Dropdown

**Check:**

1. Is `GEONAMES_USERNAME` in `.env`?
2. Is the username correct?
3. Did you enable "Free Web Services" in your Geonames account?
4. Check browser console for API errors

### "Invalid username" Error

**Solution:**

1. Go to [geonames.org/manageaccount](https://www.geonames.org/manageaccount)
2. Verify account is confirmed (check email)
3. Make sure "Free Web Services" is enabled

---

## Database Schema

Location data is cached in these tables:

```prisma
model Country {
  geonameId   Int    @unique
  countryCode String @unique  // "US", "CA", "GB"
  countryName String          // "United States"
  states      State[]
}

model State {
  geonameId  Int    @unique
  stateCode  String          // "ID", "NY"
  stateName  String          // "Idaho"
  countryId  String
  cities     City[]
}

model City {
  geonameId  Int    @unique
  cityName   String          // "Boise"
  stateId    String
  latitude   Float?
  longitude  Float?
  population Int?
}
```

---

## API Endpoints Used

### 1. Get All Countries

```
http://api.geonames.org/countryInfoJSON?username=YOUR_USERNAME
```

### 2. Get States for Country

```
http://api.geonames.org/childrenJSON?geonameId=COUNTRY_ID&username=YOUR_USERNAME
```

### 3. Get Cities for State

```
http://api.geonames.org/searchJSON?country=US&adminCode1=ID&featureClass=P&maxRows=1000&username=YOUR_USERNAME
```

### 4. Get ZIP Codes for City

```
http://api.geonames.org/findNearbyPostalCodesJSON?geonameId=CITY_ID&radius=30&maxRows=1000&username=YOUR_USERNAME
```

---

## Performance Optimization

**First Load:**

- Countries: ~2 seconds (252 countries)
- States: ~1-2 seconds (50+ states for US)
- Cities: ~3-5 seconds (1000+ cities)

**Subsequent Loads:**

- Countries: < 100ms (from database)
- States: < 100ms (from database)
- Cities: < 200ms (from database)

**Database Cache:**

- Reduces API calls by 99%
- Improves response time significantly
- Updates automatically when new locations are requested

---

## Production Deployment

### Environment Variables

Add to Vercel/Render/Railway:

```bash
GEONAMES_USERNAME=your_production_username
```

### Rate Limiting

If you exceed 20,000 calls/day:

1. **Option 1:** Upgrade to Geonames Premium ($5/mo for 200,000 credits)
2. **Option 2:** Implement stricter caching (already done)
3. **Option 3:** Pre-populate database with all US locations

### Pre-Population Script (Future)

Create a script to populate all US data:

```bash
npm run populate:locations
```

This would:

- Fetch all countries
- Fetch all US states
- Fetch all cities (10,000+)
- Store in database
- Never hit API during user requests

---

## Alternative APIs

If Geonames doesn't work for you:

1. **GeoDataSource** - Free tier with 250 calls/day
2. **OpenCage Geocoding** - 2,500 calls/day free
3. **REST Countries** - Free, no registration (countries only)
4. **US Census Bureau** - Free, US-only
5. **Google Places API** - $17 per 1,000 requests

**Why We Chose Geonames:**

- Best free tier limits
- Global coverage
- Includes ZIP codes
- Commercial use allowed

---

## Support

If you encounter issues:

1. Check [Geonames Forum](https://forum.geonames.org/)
2. Read [Geonames Documentation](https://www.geonames.org/export/web-services.html)
3. Open GitHub issue in LeadForge repository

---

**Last Updated:** January 5, 2026  
**Geonames Version:** v3.1

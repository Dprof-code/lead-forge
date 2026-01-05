# Product Requirements Document (PRD)
# Business Intelligence & Lead Generation Platform

**Version:** 1.0  
**Date:** January 5, 2026  
**Author:** Development Team  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Tech Stack Recommendation](#tech-stack-recommendation)
4. [User Personas](#user-personas)
5. [Core Features](#core-features)
6. [System Architecture](#system-architecture)
7. [Data Flow](#data-flow)
8. [User Interface Design](#user-interface-design)
9. [Technical Requirements](#technical-requirements)
10. [API Integrations](#api-integrations)
11. [Database Schema](#database-schema)
12. [Security & Privacy](#security--privacy)
13. [Performance Requirements](#performance-requirements)
14. [Deployment Strategy](#deployment-strategy)
15. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### Problem Statement
Sales and marketing professionals waste hours manually:
- Researching business leads across multiple tools
- Cleaning and organizing prospect data
- Analyzing competitor websites
- Finding contact information
- Creating personalized outreach campaigns

### Solution
A unified, AI-powered platform that automates the entire lead generation and qualification workflow - from initial search query generation to personalized outreach recommendations.

### Value Proposition
- **Save 20+ hours per week** on manual research
- **3x increase** in qualified leads
- **Automated data enrichment** with AI-powered insights
- **Seamless workflow** - output from one step feeds directly into the next
- **No technical skills required** - user-friendly web interface

---

## Product Overview

### Product Name
**LeadForge** (or **ProspectFlow**, **BizScout**)

### Vision
Become the all-in-one platform for B2B lead generation, combining web scraping, data enrichment, AI analysis, and personalized outreach tools.

### Target Market
- Web development agencies
- SEO consultants
- Marketing agencies
- Sales teams prospecting local businesses
- Freelance developers/marketers

### Key Differentiators
1. **Pipeline Architecture** - Each feature feeds into the next seamlessly
2. **AI-Powered Insights** - Gemini integration for intelligent website analysis
3. **No-Code Interface** - Non-technical users can run complex data operations
4. **Real-Time Progress** - Live updates during long-running operations
5. **Exportable Results** - Download at any stage of the pipeline

---

## Tech Stack Recommendation

### ✅ **RECOMMENDED: Next.js Full-Stack**

#### Frontend
- **Next.js 14+** (App Router)
- **TypeScript** - Type safety for data operations
- **Tailwind CSS** - Rapid UI development
- **shadcn/ui** - Professional component library
- **Zustand** or **Redux Toolkit** - State management
- **TanStack Query** - Data fetching & caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

#### Backend (Next.js API Routes)
- **Next.js API Routes** - RESTful endpoints
- **Next.js Server Actions** - Direct server-side operations
- **Prisma ORM** - Database management
- **Bull Queue** - Background job processing
- **Socket.io** - Real-time progress updates

#### Python Integration
- **Child Process** - Execute Python scripts from Node.js
- **Python Microservices** - Optional: Deploy scripts as separate services
- **Docker** - Containerize Python dependencies

#### Database
- **PostgreSQL** - Primary database
- **Redis** - Job queue & caching
- **S3/Cloud Storage** - CSV file storage

#### Infrastructure
- **Vercel** - Frontend & API deployment
- **Railway/Render** - Python microservices (if needed)
- **Supabase** or **PlanetScale** - Managed PostgreSQL
- **Upstash** - Managed Redis

### Why Not React + Node/Express?

| Aspect | Next.js | React + Express |
|--------|---------|-----------------|
| Setup Complexity | ⭐⭐ (Simple) | ⭐⭐⭐⭐ (Complex) |
| Development Speed | 🚀 Fast | 🐢 Slower |
| Deployment | 1 app | 2 apps (frontend + backend) |
| API Routes | Built-in | Manual setup |
| TypeScript | Seamless | Requires config |
| File Upload | Easy | Manual implementation |
| SSR/SSG | Built-in | Custom setup |
| Cost | $0 (Vercel free tier) | Higher (2 hosting services) |

---

## User Personas

### Persona 1: Agency Owner (Sarah)
- **Age:** 35-45
- **Role:** Owner of web development agency
- **Goals:** Find construction/HVAC businesses with outdated websites
- **Pain Points:** Manually browsing Google Maps, copying data to spreadsheets
- **Tech Savviness:** Medium - Comfortable with SaaS tools
- **Needs:** Automated lead generation with AI insights for sales pitches

### Persona 2: SEO Consultant (Mike)
- **Age:** 28-35
- **Role:** Freelance SEO specialist
- **Goals:** Identify businesses with poor SEO
- **Pain Points:** Time-consuming website audits
- **Tech Savviness:** High - Familiar with Chrome DevTools
- **Needs:** Batch website analysis with detailed SEO recommendations

### Persona 3: Sales Rep (Jessica)
- **Age:** 25-30
- **Role:** B2B SaaS sales representative
- **Goals:** Build targeted prospect lists
- **Pain Points:** Manually finding contact info
- **Tech Savviness:** Low - Prefers simple UIs
- **Needs:** Easy-to-use tool that just works

---

## Core Features

### 1. **Query Generator**

#### Description
Generate Google Maps search queries for any business type across all ZIP codes in a city/state.

#### User Story
> "As a marketing professional, I want to generate search queries for 'plumbing' businesses in Boise, ID, so I can scrape all relevant businesses in that area."

#### Functionality
- **Input Fields:**
  - Business type (e.g., "plumbing", "construction", "HVAC")
  - Location selection (City, State, or custom ZIP codes)
  - Country (default: US)
  
- **Output:**
  - CSV with columns: `query`, `google_maps_url`
  - Preview table showing first 10 queries
  - Download or pass to next step

#### Technical Requirements
- Pre-loaded ZIP code database for major US cities
- API to fetch ZIP codes for any city/state
- Validation to prevent empty queries

#### UI Components
```
┌─────────────────────────────────────┐
│  🔍 Generate Search Queries         │
├─────────────────────────────────────┤
│  Business Type: [____________]      │
│  City:          [____________]      │
│  State:         [▼ Idaho      ]     │
│  Country:       [▼ US         ]     │
│                                     │
│  📊 Preview: 34 queries generated   │
│                                     │
│  [⬇️ Download CSV] [▶️ Next Step]   │
└─────────────────────────────────────┘
```

---

### 2. **Google Maps Scraper**

#### Description
Scrape business data from Google Maps using Selenium automation.

#### User Story
> "As a sales professional, I want to scrape all plumbing businesses from Google Maps, so I can build a prospect database."

#### Functionality
- **Input:**
  - Upload CSV from Query Generator OR
  - Manually enter Google Maps URLs OR
  - Use output from previous step
  
- **Configuration:**
  - Max results per search (default: 20)
  - Headless mode (visible browser or background)
  - Delay between requests
  
- **Output:**
  - CSV with columns: `name`, `phone`, `website`, `rating`, `reviews`, `address`, `category`
  - Real-time progress bar
  - Pause/Resume functionality

#### Technical Requirements
- Selenium WebDriver integration
- ChromeDriver auto-download
- Error handling for rate limits
- Checkpoint/resume system
- Proxy support (future)

#### UI Components
```
┌─────────────────────────────────────────┐
│  🗺️ Google Maps Scraper                │
├─────────────────────────────────────────┤
│  📤 Upload Queries CSV                  │
│  [Drag & Drop or Click]                 │
│                                         │
│  ⚙️ Settings:                           │
│  Max Results: [20  ▼]                   │
│  Delay: [2s ▼]  Headless: [✓]         │
│                                         │
│  Progress: [████████░░] 45/100          │
│  ⏱️ Estimated: 12 min remaining         │
│                                         │
│  📊 Results: 45 businesses found        │
│                                         │
│  [⏸️ Pause] [⬇️ Download] [▶️ Next]     │
└─────────────────────────────────────────┘
```

---

### 3. **Data Cleaner**

#### Description
Remove duplicates, empty rows, and invalid data from CSV files.

#### User Story
> "As a data analyst, I want to clean my scraped data automatically, so I don't have duplicate leads in my CRM."

#### Functionality
- **Input:**
  - Upload CSV OR use output from previous step
  
- **Cleaning Operations:**
  - ✅ Remove exact duplicates
  - ✅ Remove rows where all fields are N/A
  - ✅ Remove business duplicates (same name + phone + address)
  - ✅ Trim whitespace
  - ✅ Standardize phone formats
  - ✅ Validate email addresses
  - ✅ Remove test/example emails
  
- **Output:**
  - Cleaned CSV
  - Detailed report showing what was removed
  - Before/after statistics

#### Technical Requirements
- Pandas-like data manipulation in Node.js or Python
- Configurable cleaning rules
- Preview before/after

#### UI Components
```
┌────────────────────────────────────────┐
│  🧹 Data Cleaner                       │
├────────────────────────────────────────┤
│  📤 Upload CSV                         │
│  [scraped_data.csv] ✓ Loaded          │
│                                        │
│  🎛️ Cleaning Options:                 │
│  ☑️ Remove exact duplicates            │
│  ☑️ Remove empty rows                  │
│  ☑️ Remove business duplicates         │
│  ☑️ Standardize phone numbers          │
│  ☑️ Validate emails                    │
│                                        │
│  📊 Summary:                           │
│  Initial rows:        500              │
│  Duplicates removed:   45              │
│  Empty rows removed:   12              │
│  Final rows:          443              │
│  Retention rate:      88.6%            │
│                                        │
│  [🔄 Clean Data] [⬇️ Download]        │
└────────────────────────────────────────┘
```

---

### 4. **Website Separator**

#### Description
Separate businesses into two lists: those with websites and those without.

#### User Story
> "As a web developer, I want to identify businesses WITHOUT websites, so I can offer web development services."

#### Functionality
- **Input:**
  - Upload CSV with `website` column
  
- **Output:**
  - Two CSV files:
    - `businesses_with_website.csv`
    - `businesses_no_website.csv`
  - Statistics dashboard
  - Visual charts showing distribution

#### UI Components
```
┌────────────────────────────────────────┐
│  🔀 Website Separator                  │
├────────────────────────────────────────┤
│  📤 Upload CSV                         │
│  [cleaned_data.csv] ✓ Loaded          │
│                                        │
│  📊 Analysis:                          │
│                                        │
│  ┌────────────────────────────────┐   │
│  │  With Website    │ 65% (325)   │   │
│  │  ████████████░░░ │             │   │
│  │  No Website      │ 35% (175)   │   │
│  │  ██████░░░░░░░░░ │             │   │
│  └────────────────────────────────┘   │
│                                        │
│  [⬇️ Download Both] [⬇️ With Website] │
│  [⬇️ No Website] [▶️ Next Step]       │
└────────────────────────────────────────┘
```

---

### 5. **Email Scraper**

#### Description
Visit each website and extract email addresses automatically.

#### User Story
> "As a sales rep, I want to automatically extract email addresses from business websites, so I can reach out to prospects."

#### Functionality
- **Input:**
  - Upload CSV with `website` column
  
- **Scraping Modes:**
  - Fast Mode (requests library) - 1-2s per site
  - Thorough Mode (Selenium) - 3-5s per site
  
- **Features:**
  - Check homepage
  - Check contact/about pages
  - Extract all valid emails
  - Filter fake/test emails
  - Validate email format
  
- **Output:**
  - Original CSV + new `email` column
  - Comma-separated if multiple emails found
  - Real-time progress tracking

#### Technical Requirements
- Regex for email extraction
- Blacklist for fake emails (example.com, test.com, etc.)
- Error handling for blocked sites
- Retry logic

#### UI Components
```
┌────────────────────────────────────────┐
│  📧 Email Scraper                      │
├────────────────────────────────────────┤
│  📤 Upload CSV with websites           │
│  [businesses_with_website.csv] ✓       │
│                                        │
│  ⚙️ Mode:                              │
│  ◉ Thorough (Selenium - Recommended)   │
│  ○ Fast (Requests - Basic)             │
│                                        │
│  Delay: [2s ▼]                         │
│                                        │
│  Progress: [██████░░░░] 60/100         │
│  ✅ Emails found: 42 (70%)             │
│  ⏱️ Time remaining: ~5 min             │
│                                        │
│  Recent:                               │
│  • ABC Plumbing → info@abcplumb.com   │
│  • XYZ HVAC → N/A (no email found)    │
│                                        │
│  [⏸️ Pause] [⬇️ Download] [▶️ Next]    │
└────────────────────────────────────────┘
```

---

### 6. **AI Website Analyzer**

#### Description
Use Google Gemini AI to analyze websites and generate personalized improvement recommendations.

#### User Story
> "As a web development agency, I want AI to analyze my prospects' websites and generate specific issues and solutions I can offer."

#### Functionality
- **Input:**
  - Upload CSV with `website` and `name` columns
  - API Key configuration (saved securely)
  
- **AI Analysis:**
  - Takes screenshot of website
  - Analyzes with Gemini Vision
  - Generates detailed issues list
  - Creates personalized solutions
  
- **Output:**
  - Original CSV + two new columns:
    - `website_issues` - Bullet-point list of problems
    - `your_solutions` - Specific recommendations
  
- **Features:**
  - Configurable delay (rate limiting)
  - Cost estimator
  - API key validation
  - Progress tracking with ETA

#### Technical Requirements
- Google Gemini API integration
- Screenshot capture with Puppeteer/Playwright
- Secure API key storage (encrypted)
- Rate limiting
- Cost tracking

#### UI Components
```
┌────────────────────────────────────────┐
│  🤖 AI Website Analyzer                │
├────────────────────────────────────────┤
│  🔑 API Configuration:                 │
│  Gemini API Key: [•••••••••••] ✓      │
│  [Get Free Key →]                      │
│                                        │
│  📤 Upload CSV with websites           │
│  [businesses_with_email.csv] ✓        │
│                                        │
│  ⚙️ Settings:                          │
│  Delay: [3s ▼]  (Recommended: 3-5s)   │
│                                        │
│  💰 Cost Estimate:                     │
│  188 websites × $0.005 ≈ $0.94        │
│  (Likely FREE with Gemini tier)        │
│                                        │
│  Progress: [████░░░░░░] 40/188         │
│  ⏱️ Estimated: 15 min remaining        │
│                                        │
│  Recent Analysis:                      │
│  ✓ ABC Construction                    │
│    Issues: Outdated design, no SSL... │
│                                        │
│  [⏸️ Pause] [⬇️ Download] [🎯 View]    │
└────────────────────────────────────────┘
```

---

### 7. **Pipeline Dashboard**

#### Description
Visual workflow showing all steps with drag-and-drop connections.

#### User Story
> "As a user, I want to see my entire workflow in one place and easily move data between steps."

#### Functionality
- **Visual Pipeline:**
  - Drag-and-drop nodes for each feature
  - Automatic data passing between steps
  - Save/load pipeline templates
  
- **Features:**
  - See data at each stage
  - Jump to any step
  - Download at any point
  - Track total processing time
  - View statistics for each step

#### UI Components
```
┌──────────────────────────────────────────────────────────┐
│  📊 Pipeline Dashboard                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Query Gen] → [Maps Scrape] → [Clean] → [Separate]    │
│    ✓ Done        ✓ Done        ✓ Done     ⏳ Running   │
│    34 queries    500 rows      443 rows    Processing   │
│                                                          │
│         ↓                                                │
│                                                          │
│    [Email Scrape] → [AI Analyze] → [Export]            │
│     ⏸️ Paused        ○ Pending     ○ Pending           │
│     42/325 done                                         │
│                                                          │
│  📈 Overall Progress: 55%                               │
│  ⏱️ Total Time: 1h 23min                                │
│                                                          │
│  [▶️ Resume] [⬇️ Download All] [💾 Save Pipeline]       │
└──────────────────────────────────────────────────────────┘
```

---

### 8. **Data Viewer & Export**

#### Description
Browse, filter, search, and export data at any stage.

#### Functionality
- **Features:**
  - Sortable/filterable table view
  - Search across all columns
  - Column visibility toggles
  - Pagination
  - Export formats: CSV, Excel, JSON
  - Bulk select & download

#### UI Components
```
┌────────────────────────────────────────────────────────┐
│  📋 Data Viewer                                        │
├────────────────────────────────────────────────────────┤
│  🔍 Search: [_________]  🎛️ Filters: [2 active]      │
│  Columns: [☑️ Name] [☑️ Phone] [☑️ Website] [☐ Rating]│
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Name ↑        Phone         Website      Email   │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ ABC Plumbing  555-0100      abc.com      info@...│ │
│  │ XYZ HVAC      555-0200      xyz.com      N/A     │ │
│  │ ...           ...           ...          ...     │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Showing 1-50 of 443  [< 1 2 3 ... 9 >]              │
│                                                        │
│  [⬇️ Export CSV] [⬇️ Export Excel] [⬇️ Export JSON]   │
└────────────────────────────────────────────────────────┘
```

---

### 9. **API Key Management**

#### Description
Securely store and manage API keys for Gemini and other services.

#### Functionality
- Encrypted storage
- Test/validate keys
- Usage tracking
- Cost monitoring
- Multiple key support

---

### 10. **Job Queue & History**

#### Description
Track all jobs (scraping, analysis, etc.) with ability to resume/retry.

#### Functionality
- List all past jobs
- Resume failed jobs
- Retry with different settings
- Download results from history
- Delete old jobs

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                    │
│                                                         │
│  Next.js Frontend (React + TypeScript + Tailwind)      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTP/WebSocket
                  ↓
┌─────────────────────────────────────────────────────────┐
│                  NEXT.JS SERVER                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         API Routes (REST + WebSocket)           │   │
│  └────────────────┬────────────────────────────────┘   │
│                   │                                     │
│  ┌────────────────┴────────────────────────────────┐   │
│  │          Server Actions / Services              │   │
│  │  - Query Generator Service                      │   │
│  │  - CSV Parser/Exporter                          │   │
│  │  - Data Cleaner Service                         │   │
│  └────────────────┬────────────────────────────────┘   │
│                   │                                     │
│  ┌────────────────┴────────────────────────────────┐   │
│  │         Job Queue (Bull/BullMQ)                 │   │
│  │  - Scraping Jobs                                │   │
│  │  - Email Extraction Jobs                        │   │
│  │  - AI Analysis Jobs                             │   │
│  └────────────────┬────────────────────────────────┘   │
└───────────────────┼─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ↓                       ↓
┌───────────────┐     ┌──────────────────┐
│  POSTGRESQL   │     │  PYTHON WORKERS  │
│  (Prisma)     │     │                  │
│               │     │  - Selenium      │
│  - Users      │     │  - BeautifulSoup │
│  - Jobs       │     │  - Requests      │
│  - Files      │     │  - Gemini SDK    │
│  - API Keys   │     │                  │
└───────────────┘     └──────────────────┘
        ↓
┌───────────────┐
│  REDIS        │
│               │
│  - Job Queue  │
│  - Cache      │
│  - Sessions   │
└───────────────┘
```

### Component Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Main app
│   │   ├── dashboard/            # Overview
│   │   ├── query-generator/      # Step 1
│   │   ├── maps-scraper/         # Step 2
│   │   ├── data-cleaner/         # Step 3
│   │   ├── website-separator/    # Step 4
│   │   ├── email-scraper/        # Step 5
│   │   ├── ai-analyzer/          # Step 6
│   │   ├── pipeline/             # Visual pipeline
│   │   ├── data-viewer/          # Data browser
│   │   └── jobs/                 # Job history
│   ├── api/                      # API routes
│   │   ├── jobs/                 # Job management
│   │   ├── files/                # File upload/download
│   │   ├── scrape/               # Scraping endpoints
│   │   ├── analyze/              # AI analysis
│   │   └── export/               # Data export
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn components
│   ├── features/                 # Feature-specific components
│   │   ├── QueryGenerator/
│   │   ├── MapsScraper/
│   │   ├── DataCleaner/
│   │   └── ...
│   └── shared/                   # Shared components
│       ├── FileUpload/
│       ├── ProgressBar/
│       ├── DataTable/
│       └── ...
├── lib/
│   ├── db/                       # Database (Prisma)
│   ├── queue/                    # Bull queue setup
│   ├── python/                   # Python script runners
│   └── utils/                    # Utilities
├── workers/
│   ├── scraper.worker.ts         # Scraping job processor
│   ├── email.worker.ts           # Email extraction processor
│   └── ai.worker.ts              # AI analysis processor
└── python/                       # Python scripts (migrated)
    ├── scrapers/
    │   ├── google_maps.py
    │   └── email_scraper.py
    ├── analyzers/
    │   └── website_analyzer.py
    └── utils/
        └── data_cleaner.py
```

---

## Data Flow

### Complete Pipeline Flow

```
1. QUERY GENERATION
   User Input → Generate Queries → Save to DB → Return CSV

2. GOOGLE MAPS SCRAPING
   Upload CSV → Queue Jobs → Python Worker → Scrape → Save Results → Update DB

3. DATA CLEANING
   Upload CSV → Clean Data → Return Cleaned CSV → Save to DB

4. WEBSITE SEPARATION
   Upload CSV → Filter by Website → Return 2 CSVs → Save to DB

5. EMAIL SCRAPING
   Upload CSV → Queue Jobs → Python Worker → Extract Emails → Update DB

6. AI ANALYSIS
   Upload CSV → Queue Jobs → Python Worker → Gemini API → Analyze → Update DB

7. EXPORT
   Select Data → Format (CSV/Excel/JSON) → Download
```

### Data Storage Strategy

1. **File Storage:**
   - Original uploads → S3/Cloud Storage
   - Generated CSVs → S3/Cloud Storage
   - Screenshots → S3/Cloud Storage (for AI analysis)

2. **Database Storage:**
   - Job metadata (status, progress, errors)
   - User settings & API keys (encrypted)
   - Pipeline configurations
   - Historical job results (last 30 days)

3. **Redis Storage:**
   - Active job queues
   - Real-time progress updates
   - Session data
   - Rate limiting counters

---

## User Interface Design

### Design System

**Color Palette:**
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Background: Gray (#F9FAFB)
- Surface: White (#FFFFFF)

**Typography:**
- Font: Inter (Google Fonts)
- Headings: Bold 600-700
- Body: Regular 400

**Components:**
- Use shadcn/ui for consistency
- Tailwind for custom styling
- Lucide icons

### Page Layouts

#### 1. Dashboard (Landing Page)
```
┌────────────────────────────────────────────────────────┐
│  Header: Logo | Pipeline | Jobs | Settings | User      │
├────────────────────────────────────────────────────────┤
│  📊 Dashboard                                          │
│                                                        │
│  🚀 Quick Actions                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│  │ 🔍 Generate │ │ 🗺️ Scrape   │ │ 🤖 Analyze  │     │
│  │   Queries   │ │   Google    │ │   Websites  │     │
│  └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                        │
│  📈 Recent Activity                                    │
│  • Job #123 - Email Scraping - ✅ Complete            │
│  • Job #122 - AI Analysis - ⏳ Running (65%)          │
│  • Job #121 - Data Cleaning - ✅ Complete             │
│                                                        │
│  📊 Statistics (Last 30 Days)                         │
│  • Total Jobs: 45                                     │
│  • Businesses Scraped: 12,450                         │
│  • Emails Found: 8,230 (66%)                          │
│  • Websites Analyzed: 3,200                           │
└────────────────────────────────────────────────────────┘
```

#### 2. Pipeline Builder
```
Drag-and-drop visual interface
Node-based workflow (like Zapier/n8n)
Connect outputs to inputs automatically
```

---

## Technical Requirements

### Performance
- Page load time: < 2s
- CSV upload: Support up to 100MB
- Real-time updates: < 100ms latency
- Concurrent jobs: Support 10+ simultaneous jobs
- Background processing: Jobs run independently

### Scalability
- Handle 10,000+ rows per CSV
- Support 100+ concurrent users
- Auto-scaling workers for heavy loads

### Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Responsiveness
- Responsive design for tablets
- Mobile view for monitoring jobs
- Touch-friendly UI

---

## API Integrations

### Required APIs

1. **Google Gemini AI**
   - Purpose: Website analysis
   - Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro`
   - Authentication: API Key
   - Cost: ~$0.005 per analysis

2. **ZIP Code API**
   - Purpose: Fetch ZIP codes for cities
   - Options: ZipCodeAPI.com, GeoNames

3. **Proxy Services** (Future)
   - Purpose: Rotate IPs for scraping
   - Options: ScraperAPI, Bright Data

### Internal APIs

All API routes under `/api`:
- `/api/jobs/*` - Job management
- `/api/files/*` - File operations
- `/api/scrape/*` - Scraping operations
- `/api/analyze/*` - AI analysis
- `/api/export/*` - Data export
- `/api/settings/*` - User settings

---

## Database Schema

### Prisma Schema

```prisma
// User Management
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String
  apiKeys       ApiKey[]
  jobs          Job[]
  files         File[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// API Keys (Encrypted)
model ApiKey {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  service       String    // "gemini", "proxy", etc.
  keyHash       String    // Encrypted API key
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// Job Management
model Job {
  id            String     @id @default(cuid())
  userId        String
  user          User       @relation(fields: [userId], references: [id])
  type          JobType    // QUERY_GEN, MAPS_SCRAPE, etc.
  status        JobStatus  // PENDING, RUNNING, COMPLETED, FAILED
  progress      Int        @default(0) // 0-100
  inputFileId   String?
  inputFile     File?      @relation("InputFile", fields: [inputFileId], references: [id])
  outputFileId  String?
  outputFile    File?      @relation("OutputFile", fields: [outputFileId], references: [id])
  config        Json?      // Job-specific config
  errors        Json?      // Error logs
  stats         Json?      // Statistics
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

enum JobType {
  QUERY_GEN
  MAPS_SCRAPE
  DATA_CLEAN
  WEBSITE_SEPARATE
  EMAIL_SCRAPE
  AI_ANALYZE
}

enum JobStatus {
  PENDING
  RUNNING
  PAUSED
  COMPLETED
  FAILED
  CANCELLED
}

// File Storage
model File {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  filename      String
  originalName  String
  mimeType      String
  size          Int       // Bytes
  url           String    // S3/Cloud Storage URL
  rowCount      Int?      // For CSV files
  columns       Json?     // CSV columns
  jobsAsInput   Job[]     @relation("InputFile")
  jobsAsOutput  Job[]     @relation("OutputFile")
  createdAt     DateTime  @default(now())
}

// Pipeline Templates (Future)
model Pipeline {
  id            String    @id @default(cuid())
  userId        String
  name          String
  description   String?
  steps         Json      // Array of step configs
  isPublic      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

---

## Security & Privacy

### Authentication
- **Method:** Email + Password
- **Session:** JWT tokens in httpOnly cookies
- **Future:** OAuth (Google, GitHub)

### Authorization
- Users can only access their own jobs/files
- Role-based access control (Admin, User)

### Data Security
- **API Keys:** Encrypted at rest (AES-256)
- **File Storage:** Private S3 buckets
- **Database:** SSL connections
- **HTTPS:** Enforced in production

### Privacy
- GDPR compliant
- Data retention: 30 days (configurable)
- User can delete all data
- No selling of scraped data

### Rate Limiting
- API endpoints: 100 req/min per user
- File uploads: 10 uploads/hour
- Scraping: Respectful delays built-in

---

## Performance Requirements

### Response Times
- API endpoints: < 200ms (p95)
- File upload: Stream large files
- CSV parsing: < 5s for 10,000 rows
- Real-time updates: < 100ms

### Background Jobs
- Job queuing: Immediate
- Job start: Within 5 seconds
- Progress updates: Every 1-2 seconds

### Caching Strategy
- Static assets: CDN
- API responses: Redis cache (5 min TTL)
- CSV previews: Redis cache (1 hour)

---

## Deployment Strategy

### Recommended Stack

#### Production Deployment

**Frontend + API:**
- **Platform:** Vercel
- **Advantages:**
  - Zero-config deployment
  - Edge functions
  - Built-in CDN
  - Automatic HTTPS
  - Preview deployments
- **Cost:** Free tier (Hobby), $20/mo (Pro)

**Python Workers:**
- **Option 1:** Railway (Recommended)
  - Easy Docker deployment
  - Auto-scaling
  - Persistent storage
  - Cost: ~$5-20/mo
  
- **Option 2:** Render
  - Similar to Railway
  - Free tier available
  - Cost: Free - $25/mo

- **Option 3:** AWS Lambda (Advanced)
  - Serverless Python functions
  - Pay per execution
  - Requires containerization

**Database:**
- **Option 1:** Supabase (Recommended)
  - Managed PostgreSQL
  - Built-in auth (future)
  - Real-time subscriptions
  - Cost: Free tier, $25/mo (Pro)
  
- **Option 2:** PlanetScale
  - Serverless MySQL
  - Auto-scaling
  - Cost: Free tier, $29/mo (Pro)

**Redis:**
- **Upstash** (Recommended)
  - Serverless Redis
  - Pay per request
  - Cost: Free tier, ~$10/mo

**File Storage:**
- **Vercel Blob** (Recommended if using Vercel)
  - Easy integration
  - Cost: $0.15/GB
  
- **AWS S3**
  - Cheaper at scale
  - More configuration
  - Cost: $0.023/GB

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

### Environment Variables

```bash
# .env.production
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
NEXTAUTH_SECRET="..."
GEMINI_API_KEY="..." # Default key
AWS_S3_BUCKET="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
PYTHON_WORKER_URL="https://..."
```

---

## Future Enhancements

### Phase 2 (3-6 months)

1. **Email Campaign Builder**
   - Create email templates
   - Personalize with AI
   - Send bulk emails
   - Track opens/clicks
   - Integrate with SendGrid/Mailgun

2. **CRM Integration**
   - Export to HubSpot
   - Export to Salesforce
   - Export to Pipedrive
   - Two-way sync

3. **Advanced Filters & Segments**
   - Filter by rating
   - Filter by reviews count
   - Filter by website issues
   - Save filter templates

4. **Scheduled Scraping**
   - Run jobs weekly/monthly
   - Auto-update existing data
   - Notify on new businesses

5. **Team Collaboration**
   - Share pipelines with team
   - Role-based permissions
   - Comment on jobs
   - Activity feed

### Phase 3 (6-12 months)

1. **White Label Solution**
   - Custom branding
   - Custom domain
   - Resell to agencies

2. **Mobile App**
   - Monitor jobs on mobile
   - Push notifications
   - Quick exports

3. **Advanced Analytics**
   - Industry benchmarks
   - Trend analysis
   - Lead scoring
   - Predictive analytics

4. **Marketplace**
   - Buy/sell prospect lists
   - Pre-configured pipelines
   - Custom scrapers

5. **API Access**
   - RESTful API for external apps
   - Webhooks
   - Zapier integration

---

## Success Metrics

### KPIs (Key Performance Indicators)

**User Acquisition:**
- Monthly Active Users (MAU)
- Sign-up conversion rate
- Trial-to-paid conversion

**Product Usage:**
- Average jobs per user per week
- Pipeline completion rate
- Feature adoption rates

**Performance:**
- Average job completion time
- Error rate (< 5%)
- Uptime (> 99.5%)

**Business:**
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (CLV)
- Churn rate (< 5%)

---

## Pricing Strategy (Future)

### Free Tier
- 5 jobs per month
- Max 500 rows per job
- Limited AI analysis (10 websites/mo)
- Community support

### Pro ($29/month)
- Unlimited jobs
- Max 10,000 rows per job
- Unlimited AI analysis
- Email support
- Export to Excel/JSON
- Priority processing

### Agency ($99/month)
- Everything in Pro
- Max 100,000 rows per job
- Team collaboration (5 users)
- White label exports
- API access
- Priority support
- Dedicated account manager

### Enterprise (Custom)
- Custom limits
- Unlimited users
- Custom integrations
- SLA guarantee
- Dedicated infrastructure

---

## Timeline & Milestones

### MVP (Minimum Viable Product) - 8 weeks

**Week 1-2: Setup & Foundation**
- ✅ Initialize Next.js project
- ✅ Set up Tailwind + shadcn/ui
- ✅ Database schema (Prisma)
- ✅ Authentication (NextAuth.js)
- ✅ File upload infrastructure

**Week 3-4: Core Features (Part 1)**
- ✅ Query Generator
- ✅ Google Maps Scraper (Python integration)
- ✅ Data Cleaner
- ✅ Basic job queue

**Week 5-6: Core Features (Part 2)**
- ✅ Website Separator
- ✅ Email Scraper
- ✅ AI Website Analyzer
- ✅ Real-time progress tracking

**Week 7-8: Polish & Launch**
- ✅ Data viewer & export
- ✅ Job history
- ✅ Error handling
- ✅ Testing
- ✅ Documentation
- ✅ Deploy to production

### Post-MVP (Ongoing)

**Month 3:**
- Pipeline builder (visual workflow)
- Advanced filters
- Email templates

**Month 4-6:**
- Team collaboration
- CRM integrations
- Scheduled jobs

---

## Development Best Practices

### Code Quality
- **TypeScript** everywhere
- **ESLint** + **Prettier**
- **Husky** pre-commit hooks
- **Jest** + **React Testing Library** for tests

### Git Workflow
- Feature branches
- Pull request reviews
- Semantic versioning
- Changelog

### Documentation
- Code comments
- API documentation (Swagger)
- User guides
- Video tutorials

---

## Risks & Mitigations

### Technical Risks

**Risk:** Google Maps blocking scraping
- **Mitigation:** Implement proxy rotation, respectful delays, user agents

**Risk:** Gemini API rate limits
- **Mitigation:** Queue system, configurable delays, cost monitoring

**Risk:** Large file processing crashes
- **Mitigation:** Stream processing, chunking, background workers

### Business Risks

**Risk:** Legal issues with web scraping
- **Mitigation:** Terms of Service, respect robots.txt, educational use disclaimer

**Risk:** Low user adoption
- **Mitigation:** Free tier, great UX, video tutorials, use cases

**Risk:** High infrastructure costs
- **Mitigation:** Efficient caching, serverless where possible, usage limits

---

## Conclusion

### Why This Will Succeed

1. **Real Problem:** Solves actual pain point for sales/marketing professionals
2. **Unique Value:** All-in-one platform vs. fragmented tools
3. **AI-Powered:** Leverages latest AI for competitive advantage
4. **Great UX:** Simple, intuitive, no technical skills required
5. **Freemium Model:** Low barrier to entry, clear upgrade path

### Next Steps

1. ✅ Review and approve PRD
2. 🔨 Set up development environment
3. 🚀 Start MVP development (Week 1)
4. 📢 Beta launch (Week 8)
5. 📈 Iterate based on feedback

---

**Document Status:** Draft  
**Last Updated:** January 5, 2026  
**Next Review:** After stakeholder feedback

---

## Appendix

### A. Tech Stack Alternatives Considered

| Technology | Chosen | Alternative | Reason |
|------------|--------|-------------|---------|
| Frontend | Next.js | React + Vite | Server-side rendering, API routes |
| Backend | Next.js API | Express.js | Single codebase |
| Database | PostgreSQL | MongoDB | Structured data, relations |
| Queue | Bull | Kafka | Simpler for MVP |
| Python Runtime | Child Process | Microservice | Less infrastructure |
| Auth | NextAuth.js | Clerk | Free, customizable |

### B. Glossary

- **Pipeline:** Series of connected data processing steps
- **Job:** Single execution of a feature (e.g., one scraping run)
- **Worker:** Background process that executes jobs
- **Queue:** System that manages job execution order
- **CSV:** Comma-Separated Values file format
- **Scraping:** Automated data extraction from websites
- **API Key:** Secret token for accessing external services

### C. References

- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- Bull Queue: https://github.com/OptimalBits/bull
- Google Gemini API: https://ai.google.dev/docs
- shadcn/ui: https://ui.shadcn.com

---

**End of PRD**

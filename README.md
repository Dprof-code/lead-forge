# LeadForge - B2B Lead Generation Platform

An AI-powered platform that automates the entire lead generation and qualification workflow - from initial search query generation to personalized outreach recommendations.

## 🚀 Features

- **Query Generator** ✅ - Generate Google Maps search queries with cascading location dropdowns (Country → State → City)
- **Google Maps Scraper** ✅ - Automated business data scraping using Selenium
- **Email Scraper** ✅ - Extract email addresses from business websites (checks multiple pages)
- **Data Cleaner** (Coming soon) - Remove duplicates and clean lead data automatically
- **Website Separator** (Coming soon) - Filter businesses with/without websites
- **AI Website Analyzer** (Coming soon) - Get AI-powered insights using Gemini API
- **Pipeline Dashboard** (Coming soon) - Track jobs and export results at any stage

## 🛠️ Tech Stack

### Frontend

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **TanStack Query** for data fetching
- **Zustand** for state management
- **React Hook Form** + **Zod** for forms

### Backend

- **Next.js API Routes** for RESTful endpoints
- **Prisma ORM** with PostgreSQL
- **Redis** for job queue
- **Socket.io** for real-time updates

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd lead-forge-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your:

   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Random secret for authentication
   - `GEONAMES_USERNAME` - Free API key from [geonames.org](https://www.geonames.org) (see [GEONAMES_SETUP.md](./GEONAMES_SETUP.md))

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Install Python dependencies**

   ```bash
   pip install requests
   # Or use the virtual environment
   .venv/Scripts/python.exe -m pip install requests
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. **Open** [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
lead-forge-app/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── providers.tsx
│   ├── lib/                   # Utility functions
│   │   ├── db/               # Database utilities
│   │   └── utils.ts
│   ├── store/                 # Zustand stores
│   ├── types/                 # TypeScript types
│   └── hooks/                 # Custom React hooks
├── .env.example              # Environment variables
├── components.json           # shadcn/ui config
└── package.json
```

## 🗄️ Database Schema

PostgreSQL database with:

- **User** - User accounts
- **ApiKey** - API keys for external services
- **Job** - Background job tracking
- **Business** - Scraped business data

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 📚 Documentation

For detailed feature information:

- [Product Requirements Document (PRD)](./PRD.md)
- [Authentication System](./AUTH_README.md) ✅
- [Query Generator Feature](./QUERY_GENERATOR_README.md) ✅
- [Google Maps Scraper](./MAPS_SCRAPER_README.md) ✅
- [Email Scraper Feature](./EMAIL_SCRAPER_COMPLETE.md) ✅
- [Email Scraper Quick Start](./EMAIL_SCRAPER_QUICKSTART.md) ✅
- [Geonames API Setup](./GEONAMES_SETUP.md) - **Required for location dropdowns**

## 🎯 Feature Status

| Feature             | Status         | Documentation                                            |
| ------------------- | -------------- | -------------------------------------------------------- |
| Authentication      | ✅ Complete    | [AUTH_README.md](./AUTH_README.md)                       |
| Query Generator     | ✅ Complete    | [QUERY_GENERATOR_README.md](./QUERY_GENERATOR_README.md) |
| Location Dropdowns  | ✅ Complete    | [GEONAMES_SETUP.md](./GEONAMES_SETUP.md)                 |
| Google Maps Scraper | ✅ Complete    | [MAPS_SCRAPER_README.md](./MAPS_SCRAPER_README.md)       |
| Email Scraper       | ✅ Complete    | [EMAIL_SCRAPER_COMPLETE.md](./EMAIL_SCRAPER_COMPLETE.md) |
| Data Cleaner        | 🚧 Coming Soon | -                                                        |
| Website Separator   | 🚧 Coming Soon | -                                                        |
| AI Website Analyzer | 🚧 Coming Soon | -                                                        |
| Pipeline Dashboard  | 🚧 Coming Soon | -                                                        |

## 🤝 Contributing

Contributions welcome! Please submit a Pull Request.

## 📄 License

MIT License

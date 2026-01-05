# LeadForge - B2B Lead Generation Platform

An AI-powered platform that automates the entire lead generation and qualification workflow - from initial search query generation to personalized outreach recommendations.

## 🚀 Features

- **Query Generator** - Generate Google Maps search queries for any business type across all ZIP codes
- **Google Maps Scraper** - Automated business data scraping using Selenium
- **Data Cleaner** - Remove duplicates and clean lead data automatically
- **Website Separator** - Filter businesses with/without websites
- **Email Scraper** - Extract email addresses from business websites
- **AI Website Analyzer** - Get AI-powered insights using Gemini API
- **Pipeline Dashboard** - Track jobs and export results at any stage

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

   - Database URL (PostgreSQL)
   - Redis URL
   - Gemini API key

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

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

For detailed feature information, see [PRD.md](./PRD.md)

## 🤝 Contributing

Contributions welcome! Please submit a Pull Request.

## 📄 License

MIT License

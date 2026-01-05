import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Welcome to <span className="text-blue-600">LeadForge</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered B2B lead generation platform that automates the entire workflow
            from query generation to personalized outreach.
          </p>

          <div className="flex justify-center gap-4 mt-8">
            <Link
              href="/register"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
            <FeatureCard
              title="Query Generator"
              description="Generate Google Maps search queries for any business type across all ZIP codes"
              icon="🔍"
            />
            <FeatureCard
              title="Maps Scraper"
              description="Scrape business data from Google Maps with automated Selenium integration"
              icon="🗺️"
            />
            <FeatureCard
              title="AI Analyzer"
              description="Get AI-powered insights and recommendations for each prospect"
              icon="🤖"
            />
            <FeatureCard
              title="Data Cleaner"
              description="Remove duplicates and clean your lead data automatically"
              icon="🧹"
            />
            <FeatureCard
              title="Email Scraper"
              description="Extract email addresses from business websites efficiently"
              icon="📧"
            />
            <FeatureCard
              title="Pipeline Dashboard"
              description="Track all your jobs and export results at any stage"
              icon="📊"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

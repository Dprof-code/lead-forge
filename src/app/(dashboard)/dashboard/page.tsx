import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">LeadForge</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">
                                {session.user?.email}
                            </span>
                            <form action="/api/auth/signout" method="POST">
                                <button
                                    type="submit"
                                    className="text-sm text-gray-700 hover:text-gray-900"
                                >
                                    Sign out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Welcome back, {session.user?.name || session.user?.email}!
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Start generating leads with your AI-powered platform
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard
                        title="Query Generator"
                        description="Generate Google Maps search queries for any business type"
                        href="/query-generator"
                        icon="🔍"
                    />
                    <FeatureCard
                        title="Maps Scraper"
                        description="Scrape business data from Google Maps automatically"
                        href="/dashboard/maps-scraper"
                        icon="🗺️"
                    />
                    <FeatureCard
                        title="Data Cleaner"
                        description="Remove duplicates and clean your lead data"
                        href="/dashboard/data-cleaner"
                        icon="🧹"
                    />
                    <FeatureCard
                        title="Website Separator"
                        description="Filter businesses with and without websites"
                        href="/dashboard/website-separator"
                        icon="🔀"
                    />
                    <FeatureCard
                        title="Email Scraper"
                        description="Extract email addresses from business websites"
                        href="/dashboard/email-scraper"
                        icon="📧"
                    />
                    <FeatureCard
                        title="AI Analyzer"
                        description="Get AI-powered insights for each prospect"
                        href="/dashboard/ai-analyzer"
                        icon="🤖"
                    />
                </div>

                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
                    <p className="text-gray-500">No jobs yet. Start by creating your first query!</p>
                </div>
            </main>
        </div>
    );
}

function FeatureCard({
    title,
    description,
    href,
    icon,
}: {
    title: string;
    description: string;
    href: string;
    icon: string;
}) {
    return (
        <a
            href={href}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
            <div className="text-4xl mb-3">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </a>
    );
}

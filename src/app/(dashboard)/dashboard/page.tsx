import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Map, Mail, Sparkles, FileText, Users } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">
                    Welcome back, {session.user?.name || session.user?.email}!
                </h2>
                <p className="text-muted-foreground">
                    Start generating leads with your AI-powered platform
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard
                    title="Query Generator"
                    description="Generate Google Maps search queries for any business type"
                    href="/query-generator"
                    icon={Search}
                />
                <FeatureCard
                    title="Maps Scraper"
                    description="Scrape business data from Google Maps automatically"
                    href="/maps-scraper"
                    icon={Map}
                />
                <FeatureCard
                    title="Email Scraper"
                    description="Extract and verify email addresses from business websites"
                    href="/email-scraper"
                    icon={Mail}
                />
                {/* Uncomment as features are built */}
                {/* <FeatureCard
                    title="Data Cleaner"
                    description="Remove duplicates and clean your lead data"
                    href="/data-cleaner"
                    icon={Sparkles}
                /> */}
                {/* <FeatureCard
                    title="AI Analyzer"
                    description="Get AI-powered insights for each prospect"
                    href="/ai-analyzer"
                    icon={Sparkles}
                /> */}
            </div>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your recent jobs and actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No jobs yet. Start by creating your first query!</p>
                </CardContent>
            </Card>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">No leads generated yet</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Emails Found</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Start scraping to find emails</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">No completed jobs yet</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function FeatureCard({
    title,
    description,
    href,
    icon: Icon,
}: {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
}) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
            </Card>
        </Link>
    );
}

import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            {/* Main content */}
            <div className="lg:pl-64">
                {/* Mobile header spacing */}
                <div className="lg:hidden h-16" />
                {/* Content */}
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}

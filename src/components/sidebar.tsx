'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Search,
    Map,
    Mail,
    Sparkles,
    Menu,
    X,
    LogOut,
    Settings,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    className?: string;
}

const navigation = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Query Generator',
        href: '/query-generator',
        icon: Search,
    },
    {
        name: 'Maps Scraper',
        href: '/maps-scraper',
        icon: Map,
    },
    {
        name: 'Email Scraper',
        href: '/email-scraper',
        icon: Mail,
    },
    // Add more navigation items as features are built
    // {
    //     name: 'Data Cleaner',
    //     href: '/data-cleaner',
    //     icon: Sparkles,
    // },
    // {
    //     name: 'AI Analyzer',
    //     href: '/ai-analyzer',
    //     icon: Sparkles,
    // },
];

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">LeadForge</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </Button>
            </div>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-40 h-screen transition-transform',
                    'w-64 bg-background border-r',
                    'lg:translate-x-0',
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
                    className
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center gap-2 border-b px-6">
                        <FileText className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg">LeadForge</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="border-t p-3 space-y-1">
                        <Link
                            href="/settings"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <Settings className="h-5 w-5" />
                            Settings
                        </Link>
                        <form action="/api/auth/signout" method="POST">
                            <button
                                type="submit"
                                className={cn(
                                    'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                <LogOut className="h-5 w-5" />
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </aside>
        </>
    );
}

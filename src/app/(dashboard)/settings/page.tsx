import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Key, Bell, Database } from 'lucide-react';

export default async function SettingsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <CardTitle>Profile</CardTitle>
                        </div>
                        <CardDescription>Manage your profile information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <p className="text-sm text-muted-foreground">{session.user?.name || 'Not set'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            <CardTitle>API Keys</CardTitle>
                        </div>
                        <CardDescription>Manage your API keys for external services</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">API key management coming soon...</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            <CardTitle>Geonames Username</CardTitle>
                        </div>
                        <CardDescription>Configure your Geonames API username</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Geonames configuration coming soon...</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>Manage your notification preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Notification settings coming soon...</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

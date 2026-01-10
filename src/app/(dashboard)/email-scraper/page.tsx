'use client';

import { useState } from 'react';
import { Upload, Mail, AlertCircle, Download, Settings, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ScrapingProgress {
    current: number;
    total: number;
    emailsFound: number;
    recentActivity: Array<{
        name: string;
        email: string;
    }>;
}

export default function EmailScraperPage() {
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<'fast' | 'thorough'>('thorough');
    const [delay, setDelay] = useState('2');
    const [websiteColumn, setWebsiteColumn] = useState('website');
    const [verifyEmails, setVerifyEmails] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState<ScrapingProgress | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv')) {
                setError('Please upload a CSV file');
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.csv')) {
            setFile(droppedFile);
            setError(null);
        } else {
            setError('Please upload a CSV file');
        }
    };

    const handleStartScraping = async () => {
        if (!file) {
            setError('Please upload a CSV file first');
            return;
        }

        setIsUploading(true);
        setError(null);
        setProgress(null);
        setDownloadUrl(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('useSelenium', mode === 'thorough' ? 'true' : 'false');
            formData.append('delay', delay);
            formData.append('websiteColumn', websiteColumn);
            formData.append('verifyEmails', verifyEmails ? 'true' : 'false');

            const response = await fetch('/api/scrape/emails', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start scraping');
            }

            setJobId(data.jobId);

            // Start polling for progress
            pollJobStatus(data.jobId);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsUploading(false);
        }
    };

    const pollJobStatus = async (id: string) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/scrape/emails/${id}`);
                const data = await response.json();

                if (data.status === 'completed') {
                    clearInterval(interval);
                    setDownloadUrl(data.downloadUrl);
                    setProgress({
                        current: data.stats?.websitesScraped || 100,
                        total: data.stats?.totalBusinesses || 100,
                        emailsFound: data.stats?.emailsFound || 0,
                        recentActivity: []
                    });
                } else if (data.status === 'failed') {
                    clearInterval(interval);
                    setError(data.error || 'Scraping job failed');
                } else if (data.status === 'running') {
                    // Update progress
                    setProgress({
                        current: data.progress || 0,
                        total: 100,
                        emailsFound: data.stats?.emailsFound || 0,
                        recentActivity: []
                    });
                }
            } catch (err) {
                console.error('Error polling job status:', err);
            }
        }, 3000); // Poll every 3 seconds
    };

    const estimatedTime = file && delay
        ? Math.ceil((parseInt(delay) * 100) / 60) // Rough estimate
        : 0;

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Mail className="h-8 w-8" />
                    Email Scraper
                </h1>
                <p className="text-muted-foreground">
                    Automatically extract email addresses from business websites
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6">
                {/* File Upload Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upload CSV with Websites</CardTitle>
                        <CardDescription>
                            Upload a CSV file containing a column with website URLs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            {file ? (
                                <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-medium mb-1">Drag & Drop CSV file</p>
                                    <p className="text-sm text-muted-foreground">or click to browse</p>
                                </div>
                            )}
                            <input
                                id="file-upload"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        {file && (
                            <div className="mt-4">
                                <Label htmlFor="website-column">Website Column Name</Label>
                                <Input
                                    id="website-column"
                                    value={websiteColumn}
                                    onChange={(e) => setWebsiteColumn(e.target.value)}
                                    placeholder="website"
                                    className="mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Name of the column containing website URLs (default: &quot;website&quot;)
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Settings Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Scraping Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="mb-3 block">Scraping Mode</Label>
                            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'fast' | 'thorough')}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <RadioGroupItem value="thorough" id="thorough" />
                                    <Label htmlFor="thorough" className="font-normal cursor-pointer">
                                        <div>
                                            <div className="font-medium">Thorough (Selenium - Recommended)</div>
                                            <div className="text-sm text-muted-foreground">
                                                Works with JavaScript-heavy sites, checks contact pages (3-5s per site)
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="fast" id="fast" />
                                    <Label htmlFor="fast" className="font-normal cursor-pointer">
                                        <div>
                                            <div className="font-medium">Fast (Requests - Basic)</div>
                                            <div className="text-sm text-muted-foreground">
                                                Faster but may miss emails on dynamic sites (1-2s per site)
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div>
                            <Label htmlFor="delay">Delay Between Requests</Label>
                            <Select value={delay} onValueChange={setDelay}>
                                <SelectTrigger id="delay" className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 second</SelectItem>
                                    <SelectItem value="2">2 seconds (Recommended)</SelectItem>
                                    <SelectItem value="3">3 seconds</SelectItem>
                                    <SelectItem value="5">5 seconds</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Be respectful to websites - longer delays are better
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="verify-emails"
                                checked={verifyEmails}
                                onCheckedChange={(checked) => setVerifyEmails(checked as boolean)}
                            />
                            <Label
                                htmlFor="verify-emails"
                                className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                <div>
                                    <div className="font-medium">Verify email addresses (Recommended)</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Check if emails actually exist using SMTP validation. Slower but ensures higher quality leads.
                                    </div>
                                </div>
                            </Label>
                        </div>

                        {file && (
                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-medium mb-2">⏱️ Estimated Time</h4>
                                <p className="text-sm text-muted-foreground">
                                    Approximately {estimatedTime} minutes for ~100 websites
                                    {verifyEmails && ' (+ verification time)'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Progress Card (shown when scraping) */}
                {jobId && !downloadUrl && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Scraping Progress</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span>
                                        {progress ?
                                            `Processing ${progress.current}% complete` :
                                            'Initializing...'}
                                    </span>
                                    <span className="text-muted-foreground">Job ID: {jobId}</span>
                                </div>
                                <Progress value={progress?.current || 0} className="h-2" />
                            </div>

                            {progress && progress.emailsFound > 0 && (
                                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-green-800">
                                        ✅ Emails found: {progress.emailsFound}
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                        Progress is being saved automatically
                                    </p>
                                </div>
                            )}

                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm font-medium mb-2">⏱️ Scraping in progress...</p>
                                <p className="text-xs text-muted-foreground">
                                    This may take several minutes depending on the number of websites.
                                    You can safely close this page and return later.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Results Card (shown when complete) */}
                {downloadUrl && (
                    <Card className="border-green-500">
                        <CardHeader>
                            <CardTitle className="text-green-600">✅ Scraping Complete!</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-medium mb-2">📊 Summary</h4>
                                <p className="text-sm text-muted-foreground">
                                    Email scraping completed successfully. Download the results below.
                                </p>
                            </div>

                            <Button className="w-full" onClick={() => window.open(downloadUrl, '_blank')}>
                                <Download className="h-4 w-4 mr-2" />
                                Download Results CSV
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setFile(null);
                                    setJobId(null);
                                    setDownloadUrl(null);
                                    setProgress(null);
                                }}
                            >
                                Start New Scraping Job
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Action Button */}
                {!jobId && !downloadUrl && (
                    <Button
                        size="lg"
                        className="w-full"
                        onClick={handleStartScraping}
                        disabled={!file || isUploading}
                    >
                        {isUploading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Play className="h-5 w-5 mr-2" />
                                Start Email Scraping
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Info Section */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-sm">How It Works</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-muted-foreground">
                    <p>✓ Visits each website from your CSV file</p>
                    <p>✓ Checks homepage and common pages (contact, about, team)</p>
                    <p>✓ Extracts all valid email addresses</p>
                    <p>✓ Filters out fake/test emails (example.com, test.com, etc.)</p>
                    <p>✓ Verifies emails exist using SMTP validation (if enabled)</p>
                    <p>✓ Returns results in a new CSV with an &quot;email&quot; column</p>
                </CardContent>
            </Card>
        </div>
    );
}
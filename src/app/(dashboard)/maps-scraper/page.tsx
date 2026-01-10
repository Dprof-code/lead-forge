'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ScrapedBusiness {
    name: string;
    phone: string;
    website: string;
    rating: string;
    reviews: string;
    address: string;
    category: string;
}

interface ScrapeResult {
    jobId: string;
    count: number;
    businesses?: ScrapedBusiness[];
    downloadUrl: string;
}

export default function MapsScraperPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [maxResults, setMaxResults] = useState(20);
    const [delay, setDelay] = useState(2);
    const [headless, setHeadless] = useState(true);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<ScrapeResult | null>(null);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.csv')) {
                setError('Please upload a CSV file');
                return;
            }
            setUploadedFile(file);
            setError('');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            setUploadedFile(file);
            setError('');
        } else {
            setError('Please upload a CSV file');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResult(null);
        setProgress(0);

        if (!uploadedFile) {
            setError('Please upload a CSV file');
            return;
        }

        setIsLoading(true);

        try {
            // First, upload the file to public/downloads
            const formData = new FormData();
            formData.append('file', uploadedFile);

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const uploadError = await uploadResponse.json();
                setError(uploadError.error || 'Failed to upload file');
                setIsLoading(false);
                return;
            }

            const { filePath } = await uploadResponse.json();

            // Start scraping job
            const scrapeResponse = await fetch('/api/maps-scraper', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    csvFile: filePath,
                    maxResults,
                    delay,
                    headless,
                }),
            });

            const data = await scrapeResponse.json();

            if (!scrapeResponse.ok) {
                setError(data.error || 'Scraping failed');
                setIsLoading(false);
                return;
            }

            setResult(data);
            setProgress(100);
            setIsLoading(false);
        } catch (error) {
            setError('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (result?.downloadUrl) {
            window.open(result.downloadUrl, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                                LeadForge
                            </Link>
                            <span className="ml-4 text-gray-500">→</span>
                            <span className="ml-4 text-gray-700">Google Maps Scraper</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🗺️ Google Maps Scraper
                    </h1>
                    <p className="text-gray-600">
                        Scrape business data from Google Maps using your generated query URLs
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                📤 Upload Queries CSV
                            </label>
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                {uploadedFile ? (
                                    <div className="text-green-600">
                                        <div className="text-4xl mb-2">✓</div>
                                        <div className="font-medium">{uploadedFile.name}</div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {(uploadedFile.size / 1024).toFixed(2)} KB
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        <div className="text-4xl mb-2">📁</div>
                                        <div>Drag & drop your CSV file here</div>
                                        <div className="text-sm mt-1">or click to browse</div>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Upload the CSV file generated from Query Generator
                            </p>
                        </div>

                        {/* Settings */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Scraping Settings</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Results per Search
                                    </label>
                                    <select
                                        value={maxResults}
                                        onChange={(e) => setMaxResults(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isLoading}
                                    >
                                        <option value={10}>10 results</option>
                                        <option value={20}>20 results (recommended)</option>
                                        <option value={30}>30 results</option>
                                        <option value={50}>50 results</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Delay Between Requests
                                    </label>
                                    <select
                                        value={delay}
                                        onChange={(e) => setDelay(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isLoading}
                                    >
                                        <option value={1}>1 second (fast)</option>
                                        <option value={2}>2 seconds (recommended)</option>
                                        <option value={3}>3 seconds (safe)</option>
                                        <option value={5}>5 seconds (very safe)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={headless}
                                        onChange={(e) => setHeadless(e.target.checked)}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        disabled={isLoading}
                                    />
                                    <span className="text-sm text-gray-700">
                                        Run in headless mode (background, no visible browser)
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {isLoading && (
                            <div className="border-t pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Scraping in progress...</span>
                                    <span className="text-sm text-gray-500">{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    ⏱️ This may take several minutes depending on the number of queries...
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={!uploadedFile || isLoading}
                                className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition ${!uploadedFile || isLoading
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg
                                            className="animate-spin h-5 w-5 mr-2"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Scraping...
                                    </span>
                                ) : (
                                    '🚀 Start Scraping'
                                )}
                            </button>

                            <Link
                                href="/dashboard"
                                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Results */}
                {result && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold text-green-600 mb-2">
                                ✅ Scraping Complete!
                            </h2>
                            <p className="text-gray-600">
                                Successfully scraped {result.count} businesses from Google Maps
                            </p>
                        </div>

                        {/* Preview Table */}
                        {result.businesses && result.businesses.length > 0 && (
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold mb-3">Preview (First 10 Results)</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Website</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {result.businesses.slice(0, 10).map((business, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900">{business.name}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{business.phone}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {business.website !== 'N/A' ? (
                                                            <a
                                                                href={business.website}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline"
                                                            >
                                                                Link
                                                            </a>
                                                        ) : (
                                                            'N/A'
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {business.rating} ⭐ ({business.reviews})
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{business.address}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex gap-4">
                            <button
                                onClick={handleDownload}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition"
                            >
                                ⬇️ Download CSV ({result.count} businesses)
                            </button>
                            <button
                                onClick={() => router.push('/data-cleaner')}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition"
                            >
                                ▶️ Next Step: Clean Data
                            </button>
                        </div>
                    </div>
                )}

                {/* Tips */}
                <div className="mt-6 bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Tips</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>• Upload the CSV file from Query Generator</li>
                        <li>• Start with 20 results per search (recommended)</li>
                        <li>• Use 2-3 second delay to avoid getting blocked</li>
                        <li>• Headless mode is faster but you won&apos;t see the browser</li>
                        <li>• Large scraping jobs may take 10-30 minutes</li>
                        <li>• Download results and proceed to Data Cleaner</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}

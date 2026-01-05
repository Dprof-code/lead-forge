'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface QueryResult {
    jobId: string;
    count: number;
    preview: Array<{
        query: string;
        google_maps_url: string;
        business_type: string;
        zip_code: string;
        city: string;
        state: string;
        country: string;
    }>;
    downloadUrl: string;
}

interface Country {
    id: string;
    countryCode: string;
    countryName: string;
    geonameId: number;
}

interface State {
    id: string;
    stateCode: string;
    stateName: string;
    geonameId: number;
}

interface City {
    id: string;
    cityName: string;
    geonameId: number;
    population?: number;
}

export default function QueryGeneratorPage() {
    const router = useRouter();
    const [businessType, setBusinessType] = useState('');

    // Location state
    const [countries, setCountries] = useState<Country[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);

    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedGeonameId, setSelectedGeonameId] = useState<number | null>(null);

    // UI state
    const [isLoadingCountries, setIsLoadingCountries] = useState(false);
    const [isLoadingStates, setIsLoadingStates] = useState(false);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<QueryResult | null>(null);

    // Fetch countries on component mount
    useEffect(() => {
        const fetchCountries = async () => {
            setIsLoadingCountries(true);
            try {
                const response = await fetch('/api/locations/countries');
                const data = await response.json();

                if (response.ok) {
                    setCountries(data.countries);

                    // Auto-select US if available
                    const us = data.countries.find((c: Country) => c.countryCode === 'US');
                    if (us) {
                        setSelectedCountry(us.countryCode);
                    }
                } else {
                    if (data.needsApiKey) {
                        setError('Please configure GEONAMES_USERNAME in environment variables');
                    }
                }
            } catch (err) {
                console.error('Failed to fetch countries:', err);
            } finally {
                setIsLoadingCountries(false);
            }
        };

        fetchCountries();
    }, []);

    // Fetch states when country changes
    useEffect(() => {
        if (!selectedCountry) {
            setStates([]);
            setSelectedState('');
            setCities([]);
            setSelectedCity('');
            return;
        }

        const fetchStates = async () => {
            setIsLoadingStates(true);
            try {
                const response = await fetch(`/api/locations/states?countryCode=${selectedCountry}`);
                const data = await response.json();

                if (response.ok) {
                    setStates(data.states);
                    setSelectedState('');
                    setCities([]);
                    setSelectedCity('');
                }
            } catch (err) {
                console.error('Failed to fetch states:', err);
            } finally {
                setIsLoadingStates(false);
            }
        };

        fetchStates();
    }, [selectedCountry]);

    // Fetch cities when state changes
    useEffect(() => {
        if (!selectedState || !selectedCountry) {
            setCities([]);
            setSelectedCity('');
            return;
        }

        const fetchCities = async () => {
            setIsLoadingCities(true);
            try {
                const response = await fetch(
                    `/api/locations/cities?stateCode=${selectedState}&countryCode=${selectedCountry}`
                );
                const data = await response.json();

                if (response.ok) {
                    setCities(data.cities);
                    setSelectedCity('');
                }
            } catch (err) {
                console.error('Failed to fetch cities:', err);
            } finally {
                setIsLoadingCities(false);
            }
        };

        fetchCities();
    }, [selectedState, selectedCountry]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResult(null);
        setIsLoading(true);

        // Find selected city details
        const cityData = cities.find(c => c.id === selectedCity);
        const stateData = states.find(s => s.stateCode === selectedState);
        const countryData = countries.find(c => c.countryCode === selectedCountry);

        try {
            const response = await fetch('/api/query-generator', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    businessType,
                    city: cityData?.cityName || selectedCity,
                    state: selectedState,
                    country: selectedCountry,
                    geonameId: cityData?.geonameId,
                    latitude: cityData?.latitude,
                    longitude: cityData?.longitude,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to generate queries');
                setIsLoading(false);
                return;
            }

            setResult(data);
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
                            <span className="ml-4 text-gray-700">Query Generator</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🔍 Query Generator
                    </h1>
                    <p className="text-gray-600">
                        Generate Google Maps search queries for any business type across all ZIP codes
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                                Business Type *
                            </label>
                            <input
                                id="businessType"
                                type="text"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., plumbing, construction, HVAC, landscaping"
                                value={businessType}
                                onChange={(e) => setBusinessType(e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Enter the type of business you want to find
                            </p>
                        </div>

                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                                Country *
                            </label>
                            <select
                                id="country"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                                disabled={isLoading || isLoadingCountries}
                            >
                                <option value="">
                                    {isLoadingCountries ? 'Loading countries...' : 'Select a country'}
                                </option>
                                {countries.map((country) => (
                                    <option key={country.id} value={country.countryCode}>
                                        {country.countryName} ({country.countryCode})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                                    State / Province *
                                </label>
                                <select
                                    id="state"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedState}
                                    onChange={(e) => setSelectedState(e.target.value)}
                                    disabled={isLoading || isLoadingStates || !selectedCountry}
                                >
                                    <option value="">
                                        {isLoadingStates
                                            ? 'Loading states...'
                                            : selectedCountry
                                                ? 'Select a state'
                                                : 'Select country first'}
                                    </option>
                                    {states.map((state) => (
                                        <option key={state.id} value={state.stateCode}>
                                            {state.stateName} ({state.stateCode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                    City *
                                </label>
                                <select
                                    id="city"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedCity}
                                    onChange={(e) => {
                                        setSelectedCity(e.target.value);
                                        const city = cities.find(c => c.id === e.target.value);
                                        if (city) {
                                            setSelectedGeonameId(city.geonameId);
                                        }
                                    }}
                                    disabled={isLoading || isLoadingCities || !selectedState}
                                >
                                    <option value="">
                                        {isLoadingCities
                                            ? 'Loading cities...'
                                            : selectedState
                                                ? 'Select a city'
                                                : 'Select state first'}
                                    </option>
                                    {cities.map((city) => (
                                        <option key={city.id} value={city.id}>
                                            {city.cityName}
                                            {city.population && ` (Pop: ${city.population.toLocaleString()})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating...
                                    </span>
                                ) : (
                                    'Generate Queries'
                                )}
                            </button>

                            {result && (
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                >
                                    ⬇️ Download CSV
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {result && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                ✅ Success! Generated {result.count} Queries
                            </h2>
                            <p className="text-gray-600">
                                Your queries have been generated and are ready to download.
                            </p>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Preview (First 5 queries)</h3>
                            <div className="space-y-3">
                                {result.preview.map((query, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-md">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 mb-1">
                                                    {query.query}
                                                </p>
                                                <a
                                                    href={query.google_maps_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:text-blue-800 break-all"
                                                >
                                                    {query.google_maps_url}
                                                </a>
                                            </div>
                                            <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                {query.zip_code}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex gap-4">
                            <button
                                onClick={handleDownload}
                                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                            >
                                ⬇️ Download Full CSV ({result.count} queries)
                            </button>
                            <Link
                                href="/dashboard/maps-scraper"
                                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                            >
                                ▶️ Next: Scrape Google Maps
                            </Link>
                        </div>
                    </div>
                )}

                <div className="mt-6 bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Tips</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>• Be specific with business type (e.g., &quot;plumbing&quot; instead of &quot;home services&quot;)</li>
                        <li>• Select Country → State → City from the dropdowns</li>
                        <li>• ZIP codes are automatically fetched from Geonames API</li>
                        <li>• Download the CSV and use it in the Google Maps Scraper</li>
                        {isLoadingCountries && (
                            <li className="text-yellow-700">• Loading location data (this may take a moment on first use)</li>
                        )}
                    </ul>
                </div>
            </main>
        </div>
    );
}

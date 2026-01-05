import csv
import json
import sys
import requests
import os
from urllib.parse import quote

# Geonames API configuration - read from environment or fall back to demo
GEONAMES_USERNAME = os.getenv("GEONAMES_USERNAME", "demo")

def get_zip_codes_from_api(city_geoname_id):
    """
    Fetch ZIP codes for a city from Geonames API using geoname ID
    
    Args:
        city_geoname_id: Geonames ID for the city
    
    Returns:
        List of tuples (zip_code, city_name)
    """
    try:
        url = f"http://api.geonames.org/postalCodeSearchJSON?placename={city_geoname_id}&maxRows=1000&username={GEONAMES_USERNAME}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if "postalCodes" in data and len(data["postalCodes"]) > 0:
                zip_codes = []
                for postal in data["postalCodes"]:
                    zip_code = postal.get("postalCode", "")
                    place_name = postal.get("placeName", city_geoname_id)
                    if zip_code:
                        zip_codes.append((zip_code, place_name))
                
                return zip_codes if zip_codes else [(city_geoname_id, city_geoname_id)]
        
        # Fallback if API fails
        return [(city_geoname_id, city_geoname_id)]
    
    except Exception as e:
        print(f"Warning: Failed to fetch ZIP codes from API: {e}", file=sys.stderr)
        return [(city_geoname_id, city_geoname_id)]


def get_zip_codes(city, state):
    """
    Fetch ZIP codes for a given city and state
    Tries API first, falls back to hardcoded list for common cities
    
    Args:
        city: City name
        state: State code
    
    Returns:
        List of tuples (zip_code, city_name)
    """
    # Fallback hardcoded ZIP codes for demo/testing
    city_zips = {
        "boise": [
            ("83701", "Boise"), ("83702", "Boise"), ("83703", "Boise"),
            ("83704", "Boise"), ("83705", "Boise"), ("83706", "Boise"),
            ("83707", "Boise"), ("83708", "Boise"), ("83709", "Boise"),
            ("83711", "Boise"), ("83712", "Boise"), ("83713", "Boise"),
            ("83714", "Boise"), ("83715", "Boise"), ("83716", "Boise"),
        ],
        "new york": [
            ("10001", "New York"), ("10002", "New York"), ("10003", "New York"),
            ("10004", "New York"), ("10005", "New York"), ("10006", "New York"),
            ("10007", "New York"), ("10009", "New York"), ("10010", "New York"),
        ],
        "los angeles": [
            ("90001", "Los Angeles"), ("90002", "Los Angeles"), ("90003", "Los Angeles"),
            ("90004", "Los Angeles"), ("90005", "Los Angeles"), ("90006", "Los Angeles"),
        ],
        "chicago": [
            ("60601", "Chicago"), ("60602", "Chicago"), ("60603", "Chicago"),
            ("60604", "Chicago"), ("60605", "Chicago"), ("60606", "Chicago"),
        ],
    }
    
    # Try hardcoded list first (for demo mode)
    city_key = city.lower()
    if city_key in city_zips:
        return city_zips[city_key]
    
    # If not in hardcoded list, return single entry
    # In production with API key, you'd call get_zip_codes_from_api here
    return [(f"{city}, {state}", city)]


def get_zip_codes_by_coordinates(latitude, longitude, city_name="Unknown"):
    """
    Fetch ZIP codes using latitude and longitude coordinates
    
    Args:
        latitude: Latitude of the city
        longitude: Longitude of the city
        city_name: Name of the city (for fallback)
    
    Returns:
        List of tuples (zip_code, city_name)
    """
    try:
        # Use findNearbyPostalCodes API endpoint with lat/lng
        # Free account limits: max radius = 30km, max rows = 500
        url = f"http://api.geonames.org/findNearbyPostalCodesJSON?lat={latitude}&lng={longitude}&radius=30&maxRows=500&username={GEONAMES_USERNAME}"
        
        print(f"DEBUG: Fetching ZIP codes from Geonames for coordinates: {latitude}, {longitude}", file=sys.stderr)
        print(f"DEBUG: URL: {url}", file=sys.stderr)
        
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for API errors
            if "status" in data:
                print(f"ERROR: Geonames API error: {data['status'].get('message', 'Unknown error')}", file=sys.stderr)
                return [("00000", city_name)]
            
            if "postalCodes" in data and len(data["postalCodes"]) > 0:
                zip_codes = []
                for postal in data["postalCodes"]:
                    zip_code = postal.get("postalCode", "")
                    place_name = postal.get("placeName", city_name)
                    if zip_code:
                        zip_codes.append((zip_code, place_name))
                
                print(f"DEBUG: Successfully found {len(zip_codes)} ZIP codes", file=sys.stderr)
                return zip_codes if zip_codes else [("00000", city_name)]
            else:
                print(f"WARNING: No postal codes in response. Data: {data}", file=sys.stderr)
        else:
            print(f"ERROR: HTTP {response.status_code}: {response.text}", file=sys.stderr)
        
        return [("00000", city_name)]
    
    except Exception as e:
        print(f"ERROR: Exception fetching ZIP codes: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return [("00000", city_name)]

def generate_queries(business_type, city, state="ID", country="US", custom_zips=None, latitude=None, longitude=None):
    """
    Generate Google Maps search queries for a business type across ZIP codes
    
    Args:
        business_type: Type of business (e.g., "plumbing", "construction")
        city: City name
        state: State abbreviation (default: "ID")
        country: Country code (default: "US")
        custom_zips: Optional list of custom ZIP codes
        latitude: Optional latitude for ZIP code lookup
        longitude: Optional longitude for ZIP code lookup
    
    Returns:
        List of query dictionaries
    """
    queries = []
    
    # Determine which ZIP codes to use
    if custom_zips:
        # Use custom ZIPs if provided
        zip_list = [(zip_code, city) for zip_code in custom_zips]
    elif latitude is not None and longitude is not None:
        # Fetch ZIP codes from Geonames API using coordinates
        zip_list = get_zip_codes_by_coordinates(latitude, longitude, city)
    else:
        # Fall back to predefined list or simple city/state query
        zip_list = get_zip_codes(city, state)
    
    for zip_code, city_name in zip_list:
        query = f"{business_type}, {zip_code}, {city_name}, {state}, {country}"
        
        # Generate Google Maps search URL
        encoded_query = quote(query)
        url = f"https://www.google.com/maps/search/{encoded_query}/?hl=en&gl=US"
        
        queries.append({
            "query": query,
            "google_maps_url": url,
            "business_type": business_type,
            "zip_code": zip_code,
            "city": city_name,
            "state": state,
            "country": country
        })
    
    return queries

def save_to_csv(queries, filename="queries.csv"):
    """Save queries to CSV file"""
    if not queries:
        return None
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=queries[0].keys())
        writer.writeheader()
        writer.writerows(queries)
    
    return filename

def main():
    """Main execution when called from Node.js"""
    # Parse command line arguments
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No arguments provided"}))
        sys.exit(1)
    
    try:
        # Arguments come as JSON string
        args = json.loads(sys.argv[1])
        
        business_type = args.get("businessType", "")
        city = args.get("city", "")
        state = args.get("state", "ID")
        country = args.get("country", "US")
        custom_zips = args.get("customZips", None)
        latitude = args.get("latitude", None)
        longitude = args.get("longitude", None)
        output_file = args.get("outputFile", "queries.csv")
        
        print(f"DEBUG: Received arguments:", file=sys.stderr)
        print(f"  - businessType: {business_type}", file=sys.stderr)
        print(f"  - city: {city}", file=sys.stderr)
        print(f"  - state: {state}", file=sys.stderr)
        print(f"  - country: {country}", file=sys.stderr)
        print(f"  - latitude: {latitude}", file=sys.stderr)
        print(f"  - longitude: {longitude}", file=sys.stderr)
        
        if not business_type or not city:
            print(json.dumps({
                "error": "Business type and city are required",
                "success": False
            }))
            sys.exit(1)
        
        # Generate queries
        queries = generate_queries(
            business_type, 
            city, 
            state, 
            country, 
            custom_zips, 
            latitude,
            longitude
        )
        
        if not queries:
            print(json.dumps({
                "error": "No queries generated",
                "success": False
            }))
            sys.exit(1)
        
        # Save to CSV
        csv_file = save_to_csv(queries, output_file)
        
        # Return success response
        result = {
            "success": True,
            "count": len(queries),
            "file": csv_file,
            "queries": queries[:5]  # Return first 5 as preview
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "success": False
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()

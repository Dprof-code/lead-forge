# -*- coding: utf-8 -*-
import sys
import io

# Set UTF-8 encoding for stdout/stderr to handle Unicode characters on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import csv
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import re

class GoogleMapsScraper:
    def __init__(self, headless=False):
        """Initialize the scraper with Chrome driver"""
        chrome_options = Options()
        if headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Use webdriver-manager to automatically handle ChromeDriver
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.wait = WebDriverWait(self.driver, 10)
        
    def scrape_search_results(self, url, max_results=20):
        """Scrape business information from a Google Maps search URL"""
        print(f"\nScraping: {url}", file=sys.stderr)
        self.driver.get(url)
        
        # Wait for results to load
        time.sleep(3)
        
        businesses = []
        
        try:
            # Scroll through results to load more
            results_panel = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div[role='feed']"))
            )
            
            # Scroll to load more results
            self._scroll_results_panel(results_panel, max_results)
            
            # Get all business cards
            business_cards = self.driver.find_elements(By.CSS_SELECTOR, "div[role='feed'] > div > div[jsaction]")
            
            print(f"Found {len(business_cards)} businesses")
            
            for idx, card in enumerate(business_cards[:max_results], 1):
                try:
                    # Click on the business card to open details
                    card.click()
                    time.sleep(2)  # Wait for details to load
                    
                    business_data = self._extract_business_details()
                    
                    if business_data:
                        businesses.append(business_data)
                    print(f"Scraped: {business_data['name']}", file=sys.stderr)
                    
                except Exception as e:
                    print(f"Error extracting business {idx}: {str(e)}", file=sys.stderr)
                    continue
                    
        except TimeoutException:
            print("WARNING: Timeout waiting for results to load", file=sys.stderr)
        except Exception as e:
            print(f"ERROR: Error during scraping: {str(e)}", file=sys.stderr)
            
        return businesses
    
    def _scroll_results_panel(self, panel, max_results):
        """Scroll through the results panel to load more businesses"""
        last_height = self.driver.execute_script("return arguments[0].scrollHeight", panel)
        scroll_attempts = 0
        max_scrolls = 10
        
        while scroll_attempts < max_scrolls:
            # Scroll down
            self.driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", panel)
            time.sleep(2)
            
            # Calculate new scroll height
            new_height = self.driver.execute_script("return arguments[0].scrollHeight", panel)
            
            # Check if we've reached the bottom
            if new_height == last_height:
                break
                
            last_height = new_height
            scroll_attempts += 1
    
    def _extract_business_details(self):
        """Extract business details from the opened business panel"""
        business = {
            'name': '',
            'phone': '',
            'website': '',
            'rating': '',
            'reviews': '',
            'address': '',
            'category': ''
        }
        
        try:
            # Business name
            try:
                name_element = self.driver.find_element(By.CSS_SELECTOR, "h1.DUwDvf")
                business['name'] = name_element.text
            except NoSuchElementException:
                business['name'] = "N/A"
            
            # Rating and reviews
            try:
                rating_element = self.driver.find_element(By.CSS_SELECTOR, "div.F7nice span[aria-label*='star']")
                rating_text = rating_element.get_attribute("aria-label")
                
                # Extract rating (e.g., "4.5 stars")
                rating_match = re.search(r'(\d+\.?\d*)\s*star', rating_text)
                if rating_match:
                    business['rating'] = rating_match.group(1)
                
                # Extract review count
                review_element = self.driver.find_element(By.CSS_SELECTOR, "div.F7nice span[aria-label*='star']")
                parent_text = review_element.find_element(By.XPATH, "./parent::*").text
                review_match = re.search(r'\(?([\d,]+)\)?', parent_text)
                if review_match:
                    business['reviews'] = review_match.group(1).replace(',', '')
                    
            except NoSuchElementException:
                business['rating'] = "N/A"
                business['reviews'] = "0"
            
            # Phone number
            try:
                phone_button = self.driver.find_element(By.CSS_SELECTOR, "button[data-item-id*='phone']")
                phone_text = phone_button.get_attribute("data-item-id")
                phone_match = re.search(r'phone:tel:(.+)', phone_text)
                if phone_match:
                    business['phone'] = phone_match.group(1)
                else:
                    business['phone'] = phone_button.text
            except NoSuchElementException:
                business['phone'] = "N/A"
            
            # Website
            try:
                website_link = self.driver.find_element(By.CSS_SELECTOR, "a[data-item-id*='authority']")
                business['website'] = website_link.get_attribute("href")
            except NoSuchElementException:
                business['website'] = "N/A"
            
            # Address
            try:
                address_button = self.driver.find_element(By.CSS_SELECTOR, "button[data-item-id*='address']")
                business['address'] = address_button.get_attribute("aria-label").replace("Address: ", "")
            except NoSuchElementException:
                business['address'] = "N/A"
            
            # Category
            try:
                category_button = self.driver.find_element(By.CSS_SELECTOR, "button.DkEaL")
                business['category'] = category_button.text
            except NoSuchElementException:
                business['category'] = "N/A"
                
        except Exception as e:
            print(f"ERROR: Error extracting details: {str(e)}", file=sys.stderr)
            
        return business
    
    def close(self):
        """Close the browser"""
        self.driver.quit()

def save_to_csv(businesses, filename="boise_google_maps_results.csv"):
    """Save scraped business data to CSV file"""
    if not businesses:
        print("WARNING: No businesses to save", file=sys.stderr)
        return
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['name', 'phone', 'website', 'rating', 'reviews', 'address', 'category']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        writer.writerows(businesses)
    
    print(f"\nSaved {len(businesses)} businesses to {filename}", file=sys.stderr)

def scrape_from_file(csv_file="boise_queries.csv", output_file="boise_scraped_results.csv", max_per_search=20):
    """Scrape businesses from URLs in a CSV file"""
    scraper = GoogleMapsScraper(headless=False)  # Set to True for headless mode
    all_businesses = []
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            urls = []
            for row in reader:
                # Handle potential whitespace in column names
                # Create a dictionary with stripped keys
                clean_row = {k.strip(): v for k, v in row.items() if k}
                
                if 'Google Maps URL' in clean_row:
                    urls.append(clean_row['Google Maps URL'])
                else:
                    # Fallback: try to find a key that looks like the URL column
                    for key in row.keys():
                        if key and 'Google Maps URL' in key:
                            urls.append(row[key])
                            break
        
        print(f"Found {len(urls)} URLs to scrape", file=sys.stderr)
        
        for idx, url in enumerate(urls, 1):
            print(f"\n--- Processing URL {idx}/{len(urls)} ---")
            businesses = scraper.scrape_search_results(url, max_results=max_per_search)
            all_businesses.extend(businesses)
            
            # Save progress periodically
            if idx % 5 == 0:
                save_to_csv(all_businesses, output_file)
                print(f"Progress saved: {len(all_businesses)} total businesses", file=sys.stderr)
            
            # Be respectful - add delay between searches
            if idx < len(urls):
                time.sleep(3)
        
        # Final save
        save_to_csv(all_businesses, output_file)
        
    except FileNotFoundError:
        print(f"ERROR: Could not find file '{csv_file}'", file=sys.stderr)
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
    finally:
        scraper.close()
    
    return all_businesses

# Main execution
if __name__ == "__main__":
    import sys
    import json
    
    # Check if arguments were passed (Node.js integration)
    if len(sys.argv) > 1:
        try:
            # Check if argument is a file path (new method) or JSON string (old method)
            arg = sys.argv[1]
            
            if arg.endswith('.json'):
                # Read arguments from JSON file
                with open(arg, 'r') as f:
                    args = json.load(f)
            else:
                # Parse JSON arguments directly (fallback for compatibility)
                args = json.loads(arg)
            
            urls = args.get('urls', [])
            max_results = args.get('maxResults', 20)
            delay_time = args.get('delay', 2)
            headless = args.get('headless', False)
            output_file = args.get('outputFile', 'scraped_results.csv')
            
            scraper = GoogleMapsScraper(headless=headless)
            all_businesses = []
            
            print(json.dumps({"status": "starting", "total": len(urls)}), file=sys.stderr)
            
            for idx, url in enumerate(urls, 1):
                try:
                    print(json.dumps({"status": "scraping", "current": idx, "total": len(urls)}), file=sys.stderr)
                    businesses = scraper.scrape_search_results(url, max_results=max_results)
                    all_businesses.extend(businesses)
                    
                    # Send progress update
                    print(json.dumps({"progress": int((idx / len(urls)) * 100)}), file=sys.stderr)
                    
                    # Delay between requests
                    if idx < len(urls):
                        time.sleep(delay_time)
                        
                except Exception as e:
                    print(json.dumps({"error": str(e), "url": url}), file=sys.stderr)
                    continue
            
            scraper.close()
            
            # Save results
            save_to_csv(all_businesses, output_file)
            
            # Return success response as JSON
            result = {
                "success": True,
                "count": len(all_businesses),
                "file": output_file,
                "businesses": all_businesses[:10]  # Preview first 10
            }
            
            print(json.dumps(result))
            sys.exit(0)
            
        except Exception as e:
            error_result = {
                "success": False,
                "error": str(e)
            }
            print(json.dumps(error_result))
            sys.exit(1)
    else:
        # Standalone mode - Example scraping
        print("\n" + "=" * 60)
        print("SCRAPING FROM CSV FILE")
        print("=" * 60)
        all_results = scrape_from_file(
            csv_file="boise_queries.csv",
            output_file="all_boise_plumbing.csv",
            max_per_search=20
        )
        print(f"\nComplete! Scraped {len(all_results)} total businesses", file=sys.stderr)

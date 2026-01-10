#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Email Scraper for Lead Generation
Extracts email addresses from business websites by checking multiple pages.
"""

import sys
import io

# Fix Unicode encoding issues on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import sys
import csv
import pandas as pd
import re
import time
import json
import argparse
from urllib.parse import urljoin, urlparse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import smtplib
import dns.resolver
import socket

class EmailScraper:
    def __init__(self, headless=True, use_selenium=True):
        """
        Initialize email scraper
        
        Args:
            headless: Run browser in headless mode (no visible window)
            use_selenium: Use Selenium for JavaScript-heavy sites (slower but more thorough)
        """
        self.use_selenium = use_selenium
        self.driver = None
        
        if use_selenium:
            chrome_options = Options()
            if headless:
                chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            try:
                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=chrome_options)
                self.driver.set_page_load_timeout(20)
            except Exception as e:
                print(f"⚠ Warning: Could not initialize Selenium driver: {e}", file=sys.stderr)
                print("   Falling back to requests-only mode", file=sys.stderr)
                self.use_selenium = False
        
        # Setup requests session with retry logic
        self.session = requests.Session()
        retry = Retry(total=3, backoff_factor=0.3, status_forcelist=[500, 502, 503, 504])
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def verify_email_smtp(self, email):
        """Verify if email exists using SMTP validation"""
        try:
            # Get domain from email
            domain = email.split('@')[1]
            
            # Get MX records
            try:
                mx_records = dns.resolver.resolve(domain, 'MX')
                mx_host = str(mx_records[0].exchange)
            except:
                return False
            
            # Connect to SMTP server
            try:
                server = smtplib.SMTP(timeout=10)
                server.set_debuglevel(0)
                server.connect(mx_host)
                server.helo(server.local_hostname)
                server.mail('verify@example.com')
                code, message = server.rcpt(email)
                server.quit()
                
                # If code is 250, email exists
                return code == 250
            except smtplib.SMTPServerDisconnected:
                return True  # Server disconnected, assume email exists
            except smtplib.SMTPConnectError:
                return True  # Can't connect, assume email exists
            except:
                return True  # Other errors, assume email exists to be safe
                
        except Exception as e:
            # If verification fails, assume email exists (better to include than exclude)
            return True
    
    def extract_emails_from_text(self, text):
        """Extract email addresses from text using regex"""
        if not text:
            return set()
        
        # Comprehensive email regex pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = set(re.findall(email_pattern, text, re.IGNORECASE))
        
        # Filter out common false positives
        excluded_patterns = [
            'example.com', 'yourdomain.com', 'email.com', 'yoursite.com',
            'sentry.io', 'wixpress.com', 'cloudflare.com', 'schema.org',
            'w3.org', 'example.org', 'test.com', 'domain.com'
        ]
        
        # File extensions to exclude
        excluded_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.pdf', '.css', '.js']
        
        filtered_emails = set()
        for email in emails:
            email_lower = email.lower()
            
            # Skip if matches excluded patterns
            if any(pattern in email_lower for pattern in excluded_patterns):
                continue
            
            # Skip if it looks like a file
            if any(email_lower.endswith(ext) for ext in excluded_extensions):
                continue
            
            # Skip if local part contains file-like patterns
            local_part = email_lower.split('@')[0]
            if any(ext.replace('.', '') in local_part for ext in excluded_extensions):
                continue
            
            # Additional validation
            if '@' in email and '.' in email.split('@')[1]:
                if len(email) < 100 and ' ' not in email:
                    filtered_emails.add(email_lower)
        
        return filtered_emails
    
    def scrape_with_requests(self, url, check_pages=True):
        """Scrape website using requests library (faster)"""
        emails = set()
        
        try:
            # Try main page first
            response = self.session.get(url, timeout=10, allow_redirects=True)
            response.raise_for_status()
            
            emails.update(self.extract_emails_from_text(response.text))
            
            # If no emails found and check_pages is True, try common pages
            if not emails and check_pages:
                contact_paths = ['/contact', '/contact-us', '/about', '/about-us', '/team']
                
                for path in contact_paths:
                    try:
                        contact_url = urljoin(url, path)
                        contact_response = self.session.get(contact_url, timeout=5, allow_redirects=True)
                        contact_response.raise_for_status()
                        found_emails = self.extract_emails_from_text(contact_response.text)
                        if found_emails:
                            emails.update(found_emails)
                            break  # Stop after finding emails
                    except:
                        continue
            
        except requests.exceptions.RequestException:
            pass
        
        return emails
    
    def scrape_with_selenium(self, url, check_pages=True, verify_emails=True):
        """Scrape website using Selenium (slower, but works with JavaScript)"""
        emails = set()
        
        if not self.driver:
            return emails
        
        try:
            # Load main page
            self.driver.get(url)
            time.sleep(3)
            
            # Scroll down to trigger lazy loading
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
            time.sleep(1)
            
            # Get page source after scrolling
            page_source = self.driver.page_source
            emails.update(self.extract_emails_from_text(page_source))
            
            # If no emails found, try to find and navigate to contact pages
            if not emails and check_pages:
                try:
                    contact_paths = ['/contact', '/contact-us', '/about', '/about-us', '/team', '/contact.html']
                    
                    for path in contact_paths:
                        try:
                            contact_url = urljoin(url, path)
                            self.driver.get(contact_url)
                            time.sleep(2)
                            
                            # Scroll on contact page too
                            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
                            time.sleep(1)
                            
                            contact_source = self.driver.page_source
                            found_emails = self.extract_emails_from_text(contact_source)
                            if found_emails:
                                emails.update(found_emails)
                                break  # Stop after finding emails
                        except:
                            continue
                except:
                    pass
                    
        except (TimeoutException, WebDriverException):
            pass
        
        return emails
    
    def scrape_website(self, url, verify_emails=True):
        """
        Scrape email addresses from a website with verification
        
        Args:
            url: Website URL to scrape
            verify_emails: Whether to verify emails exist (slower but more accurate)
            
        Returns:
            String of comma-separated verified email addresses or 'N/A'
        """
        if not url or url == 'N/A' or url.strip() == '':
            return 'N/A'
        
        # Ensure URL has protocol
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        # Use Selenium if available, otherwise fallback to requests
        if self.use_selenium:
            emails = self.scrape_with_selenium(url, check_pages=True, verify_emails=verify_emails)
        else:
            emails = self.scrape_with_requests(url, check_pages=True)
        
        # Filter and verify emails
        verified_emails = []
        for email in emails:
            if verify_emails:
                print(f"              Verifying: {email}...", end=" ")
                if self.verify_email_smtp(email):
                    verified_emails.append(email)
                    print("✓")
                else:
                    print("✗ (invalid)")
            else:
                verified_emails.append(email)
        
        if verified_emails:
            return ', '.join(sorted(verified_emails))
        else:
            return 'N/A'
    
    def close(self):
        """Close the browser"""
        if self.driver:
            self.driver.quit()


def scrape_emails_from_csv(input_file, output_file=None, website_column='website', delay=2.0, use_selenium=True, verify_emails=True):
    """
    Scrape email addresses from websites in CSV file with verification
    
    Args:
        input_file: Path to input CSV file
        output_file: Path to output CSV file
        website_column: Name of the column containing website URLs
        delay: Delay in seconds between requests (be respectful!)
        use_selenium: Use Selenium for JavaScript-heavy sites
        verify_emails: Verify emails exist using SMTP (slower but more accurate)
    """
    
    if output_file is None:
        output_file = input_file.replace('.csv', '_with_emails.csv')
    
    print("=" * 60)
    print("EMAIL SCRAPER FOR WEBSITES")
    print("=" * 60)
    print(f"\n📄 Reading file: {input_file}")
    
    # Read CSV
    try:
        df = pd.read_csv(input_file, skipinitialspace=True, quotechar='"', on_bad_lines='skip')
        df.columns = df.columns.str.strip()
    except Exception as e:
        print(f"❌ Error reading file: {e}", file=sys.stderr)
        return None
    
    total_rows = len(df)
    print(f"📊 Total businesses: {total_rows}")
    
    # Check if website column exists
    if website_column not in df.columns:
        print(f"❌ Error: '{website_column}' column not found", file=sys.stderr)
        print(f"Available columns: {', '.join(df.columns)}", file=sys.stderr)
        return None
    
    # Initialize scraper
    print(f"\n🔧 Initializing scraper (Selenium: {use_selenium})...")
    scraper = EmailScraper(headless=True, use_selenium=use_selenium)
    
    # Add email column if it doesn't exist
    if 'email' not in df.columns:
        df['email'] = 'N/A'
    
    # Count websites to scrape
    websites_to_scrape = df[
        (df[website_column].notna()) & 
        (df[website_column] != 'N/A') & 
        (df[website_column].str.strip() != '')
    ]
    total_to_scrape = len(websites_to_scrape)
    
    print(f"🌐 Websites to scrape: {total_to_scrape}")
    print(f"⏱️  Estimated time: ~{(total_to_scrape * delay / 60):.1f} minutes")
    print(f"\n{'='*60}")
    print("Starting scraping...\n")
    
    # Scrape emails
    emails_found = 0
    errors = 0
    
    for idx, row in df.iterrows():
        website = row.get(website_column, 'N/A')
        
        # Skip if no website
        if pd.isna(website) or website == 'N/A' or str(website).strip() == '':
            continue
        
        business_name = row.get('name', f'Business {idx+1}')
        
        try:
            print(f"[{idx+1}/{total_rows}] Scraping: {business_name[:50]}")
            print(f"            URL: {website}")
            
            # Scrape emails with verification
            emails = scraper.scrape_website(website, verify_emails=verify_emails)
            df.at[idx, 'email'] = emails
            
            if emails != 'N/A':
                emails_found += 1
                print(f"            ✅ Found: {emails}")
            else:
                print(f"            ❌ No valid emails found")
            
            # Be respectful - add delay
            time.sleep(delay)
            
        except Exception as e:
            print(f"            ⚠️  Error: {str(e)}")
            errors += 1
            df.at[idx, 'email'] = 'N/A'
        
        # Save progress every 10 rows
        if (idx + 1) % 10 == 0:
            df.to_csv(output_file, index=False)
            print(f"\n💾 Progress saved ({idx+1}/{total_rows} processed)\n")
    
    # Close scraper
    scraper.close()
    
    # Final save
    print(f"\n💾 Saving final results to: {output_file}")
    df.to_csv(output_file, index=False)
    
    # Print summary
    print("\n" + "=" * 60)
    print("SCRAPING SUMMARY")
    print("=" * 60)
    print(f"Total businesses:        {total_rows}")
    print(f"Websites scraped:        {total_to_scrape}")
    print(f"✅ Emails found:         {emails_found} ({emails_found/total_to_scrape*100 if total_to_scrape > 0 else 0:.1f}%)")
    print(f"❌ No email:             {total_to_scrape - emails_found}")
    print(f"⚠️  Errors:               {errors}")
    print("=" * 60)
    
    # Output JSON stats for API consumption
    stats = {
        "totalBusinesses": total_rows,
        "websitesScraped": total_to_scrape,
        "emailsFound": emails_found,
        "noEmail": total_to_scrape - emails_found,
        "errors": errors,
        "successRate": round(emails_found/total_to_scrape*100, 1) if total_to_scrape > 0 else 0
    }
    print(f"\nJSON_STATS:{json.dumps(stats)}")
    
    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Scrape email addresses from websites in CSV file')
    parser.add_argument('input_file', help='Path to input CSV file')
    parser.add_argument('--output', '-o', help='Path to output CSV file', default=None)
    parser.add_argument('--website-column', '-w', help='Name of website column', default='website')
    parser.add_argument('--delay', '-d', type=float, help='Delay between requests (seconds)', default=2.0)
    parser.add_argument('--selenium', '-s', action='store_true', help='Use Selenium (slower but more thorough)')
    parser.add_argument('--fast', action='store_true', help='Use requests only (faster but may miss emails)')
    parser.add_argument('--no-verify', action='store_true', help='Skip email verification (faster but less accurate)')
    
    args = parser.parse_args()
    
    # Determine which mode to use
    use_selenium = args.selenium or not args.fast
    
    print(f"⚙️  Configuration:")
    print(f"   Input file: {args.input_file}")
    print(f"   Output file: {args.output or 'auto-generated'}")
    print(f"   Website column: {args.website_column}")
    print(f"   Use Selenium: {use_selenium}")
    print(f"   Delay: {args.delay}s between requests")
    print()
    
    # Scrape emails
    result_df = scrape_emails_from_csv(
        args.input_file,
        args.output,
        website_column=args.website_column,
        delay=args.delay,
        use_selenium=use_selenium,
        verify_emails=not args.no_verify
    )
    
    if result_df is not None:
        output_file = args.output or args.input_file.replace('.csv', '_with_emails.csv')
        print(f"\n✅ Success! Results saved to: {output_file}")
        print(f"\n💡 Tips:")
        print(f"   • Use --selenium for JavaScript-heavy sites (slower but more thorough)")
        print(f"   • Use --fast for quicker scraping (may miss some emails)")
        print(f"   • Use --delay 3 to increase delay between requests")
        sys.exit(0)
    else:
        print("\n❌ Scraping failed")
        sys.exit(1)

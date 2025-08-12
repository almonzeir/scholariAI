import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import crypto from 'crypto';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * System prompt for scholarship normalization
 */
const SCHOLARSHIP_NORMALIZATION_SYSTEM_PROMPT = `You convert raw scholarship page text into a normalized JSON object. If something is missing, set null. Never invent URLs or amounts.

Schema:
{ "id": string, "name": string, "country": string|null, "degree": "Bachelor"|"Master"|"PhD"|"Any", "eligibility": string, "deadline": "YYYY-MM-DD"|"varies"|null, "link": string, "source": string, "isFullyFunded": boolean }

Constraints:
- eligibility ≤ 220 chars (concise bullets compressed to a sentence).
- link must be the official apply/info URL found in the text.`;

/**
 * Scrape a scholarship page and extract text content
 * @param {string} url - The URL to scrape
 * @returns {Promise<Object>} - Scraped content with metadata
 */
async function scrapePage(url) {
  try {
    // Validate URL
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    
    // Set up headers to mimic a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // Fetch the page
    const response = await axios.get(url, {
      headers,
      timeout: 30000, // 30 second timeout
      maxRedirects: 5
    });
    
    // Parse HTML with Cheerio
    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style, nav, footer, header, .navigation, .menu, .sidebar').remove();
    
    // Extract text content
    const title = $('title').text().trim() || $('h1').first().text().trim();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Extract meta information
    const description = $('meta[name="description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    
    // Combine all text content
    const fullText = [title, description, keywords, bodyText]
      .filter(text => text && text.length > 0)
      .join('\n\n')
      .substring(0, 10000); // Limit to 10k characters to avoid token limits
    
    return {
      url,
      domain,
      title,
      text: fullText,
      timestamp: new Date().toISOString(),
      success: true
    };
    
  } catch (error) {
    console.error('Error scraping page:', error.message);
    return {
      url,
      domain: null,
      title: null,
      text: null,
      error: error.message,
      timestamp: new Date().toISOString(),
      success: false
    };
  }
}

/**
 * Normalize scraped scholarship data using AI
 * @param {Object} scrapedData - The scraped page data
 * @returns {Promise<Object>} - Normalized scholarship object
 */
async function normalizeScholarship(scrapedData) {
  try {
    if (!scrapedData.success || !scrapedData.text) {
      throw new Error('Invalid scraped data provided');
    }
    
    // Create the user prompt
    const userPrompt = `SOURCE_DOMAIN: ${scrapedData.domain}\nPAGE_TEXT:\n\n${scrapedData.text}\n\nReturn JSON only per schema.`;
    
    // Generate normalized scholarship using Gemini
    const result = await model.generateContent([
      { role: 'user', parts: [{ text: SCHOLARSHIP_NORMALIZATION_SYSTEM_PROMPT }] },
      { role: 'user', parts: [{ text: userPrompt }] }
    ]);
    
    const response = result.response;
    let normalizedText = response.text();
    
    // Clean up the response (remove markdown formatting if present)
    normalizedText = normalizedText.replace(/```json\s*|```\s*/g, '').trim();
    
    // Parse the JSON response
    const scholarship = JSON.parse(normalizedText);
    
    // Validate and clean the scholarship object
    const cleanedScholarship = validateAndCleanScholarship(scholarship, scrapedData);
    
    return {
      success: true,
      scholarship: cleanedScholarship,
      originalUrl: scrapedData.url,
      scrapedAt: scrapedData.timestamp,
      normalizedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error normalizing scholarship:', error.message);
    
    // Fallback to manual extraction if AI fails
    const fallbackScholarship = createFallbackScholarship(scrapedData);
    
    return {
      success: false,
      scholarship: fallbackScholarship,
      originalUrl: scrapedData.url,
      error: error.message,
      scrapedAt: scrapedData.timestamp,
      normalizedAt: new Date().toISOString()
    };
  }
}

/**
 * Validate and clean scholarship object
 * @param {Object} scholarship - Raw scholarship object from AI
 * @param {Object} scrapedData - Original scraped data
 * @returns {Object} - Cleaned scholarship object
 */
function validateAndCleanScholarship(scholarship, scrapedData) {
  const cleaned = {
    id: scholarship.id || generateScholarshipId(scrapedData.url),
    name: scholarship.name || scrapedData.title || 'Unknown Scholarship',
    country: scholarship.country || null,
    degree: validateDegree(scholarship.degree),
    eligibility: truncateEligibility(scholarship.eligibility),
    deadline: validateDeadline(scholarship.deadline),
    link: validateLink(scholarship.link, scrapedData.url),
    source: scholarship.source || scrapedData.domain,
    isFullyFunded: Boolean(scholarship.isFullyFunded)
  };
  
  return cleaned;
}

/**
 * Validate degree field
 * @param {string} degree - Degree value to validate
 * @returns {string} - Valid degree or "Any"
 */
function validateDegree(degree) {
  const validDegrees = ['Bachelor', 'Master', 'PhD', 'Any'];
  return validDegrees.includes(degree) ? degree : 'Any';
}

/**
 * Truncate eligibility text to 220 characters
 * @param {string} eligibility - Eligibility text
 * @returns {string} - Truncated eligibility text
 */
function truncateEligibility(eligibility) {
  if (!eligibility || typeof eligibility !== 'string') {
    return 'Eligibility requirements not specified';
  }
  
  if (eligibility.length <= 220) {
    return eligibility;
  }
  
  // Truncate at word boundary
  const truncated = eligibility.substring(0, 217);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Validate deadline format
 * @param {string} deadline - Deadline value
 * @returns {string|null} - Valid deadline or null
 */
function validateDeadline(deadline) {
  if (!deadline) return null;
  
  // Check for "varies" keyword
  if (deadline.toLowerCase().includes('varies') || deadline.toLowerCase().includes('rolling')) {
    return 'varies';
  }
  
  // Check for YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(deadline)) {
    // Validate it's a real date
    const date = new Date(deadline);
    if (!isNaN(date.getTime())) {
      return deadline;
    }
  }
  
  // Try to parse common date formats
  const commonFormats = [
    /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/, // MM/DD/YYYY
    /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,   // YYYY-MM-DD
    /\b(\d{1,2})-(\d{1,2})-(\d{4})\b/    // DD-MM-YYYY
  ];
  
  for (const format of commonFormats) {
    const match = deadline.match(format);
    if (match) {
      try {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        }
      } catch (e) {
        // Continue to next format
      }
    }
  }
  
  return null;
}

/**
 * Validate and clean link URL
 * @param {string} link - Link to validate
 * @param {string} originalUrl - Original page URL for relative links
 * @returns {string} - Valid link URL
 */
function validateLink(link, originalUrl) {
  if (!link) return originalUrl;
  
  try {
    // If it's already a valid absolute URL
    new URL(link);
    return link;
  } catch (e) {
    // Try to resolve as relative URL
    try {
      const baseUrl = new URL(originalUrl);
      const resolvedUrl = new URL(link, baseUrl);
      return resolvedUrl.href;
    } catch (e2) {
      // Return original URL as fallback
      return originalUrl;
    }
  }
}

/**
 * Generate a unique scholarship ID
 * @param {string} url - Source URL
 * @returns {string} - Generated ID
 */
function generateScholarshipId(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  return `scholarship_${hash.substring(0, 8)}`;
}

/**
 * Create fallback scholarship object when AI fails
 * @param {Object} scrapedData - Scraped page data
 * @returns {Object} - Fallback scholarship object
 */
function createFallbackScholarship(scrapedData) {
  return {
    id: generateScholarshipId(scrapedData.url),
    name: scrapedData.title || 'Scholarship Opportunity',
    country: null,
    degree: 'Any',
    eligibility: 'Please visit the official page for eligibility requirements',
    deadline: null,
    link: scrapedData.url,
    source: scrapedData.domain,
    isFullyFunded: false
  };
}

/**
 * Scrape and normalize a scholarship from URL
 * @param {string} url - URL to scrape
 * @returns {Promise<Object>} - Complete scraping and normalization result
 */
async function scrapeAndNormalizeScholarship(url) {
  try {
    // Step 1: Scrape the page
    const scrapedData = await scrapePage(url);
    
    if (!scrapedData.success) {
      return {
        success: false,
        error: `Failed to scrape page: ${scrapedData.error}`,
        url,
        timestamp: new Date().toISOString()
      };
    }
    
    // Step 2: Normalize the scholarship
    const normalizedResult = await normalizeScholarship(scrapedData);
    
    return {
      success: normalizedResult.success,
      scholarship: normalizedResult.scholarship,
      scrapingDetails: {
        url: scrapedData.url,
        domain: scrapedData.domain,
        title: scrapedData.title,
        scrapedAt: scrapedData.timestamp,
        normalizedAt: normalizedResult.normalizedAt
      },
      error: normalizedResult.error || null,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error in scrapeAndNormalizeScholarship:', error.message);
    return {
      success: false,
      error: error.message,
      url,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Batch scrape multiple scholarship URLs
 * @param {Array<string>} urls - Array of URLs to scrape
 * @param {number} concurrency - Number of concurrent requests (default: 3)
 * @returns {Promise<Object>} - Batch scraping results
 */
async function batchScrapeScholarships(urls, concurrency = 3) {
  const results = [];
  const errors = [];
  
  // Process URLs in batches to avoid overwhelming servers
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (url) => {
      try {
        const result = await scrapeAndNormalizeScholarship(url);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error.message,
          url,
          timestamp: new Date().toISOString()
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(result => {
      if (result.success) {
        results.push(result);
      } else {
        errors.push(result);
      }
    });
    
    // Add delay between batches to be respectful to servers
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  }
  
  return {
    success: true,
    results,
    errors,
    summary: {
      total: urls.length,
      successful: results.length,
      failed: errors.length,
      successRate: ((results.length / urls.length) * 100).toFixed(2) + '%'
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Test the scholarship scraping functionality
 * @returns {Promise<Object>} - Test results
 */
async function testScholarshipScraping() {
  const testUrls = [
    'https://www.scholarships.com/financial-aid/college-scholarships/scholarships-by-type/merit-scholarships/',
    'https://www.fastweb.com/college-scholarships',
    'https://www.cappex.com/scholarships'
  ];
  
  try {
    const results = await batchScrapeScholarships(testUrls.slice(0, 1)); // Test with just one URL
    
    return {
      success: true,
      testResults: results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

export {
  scrapePage,
  normalizeScholarship,
  scrapeAndNormalizeScholarship,
  batchScrapeScholarships,
  testScholarshipScraping,
  validateAndCleanScholarship,
  generateScholarshipId
};
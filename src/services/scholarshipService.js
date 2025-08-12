const API_BASE_URL = 'http://localhost:5002/api/scholarship';

/**
 * Scrape and normalize a single scholarship from URL
 * @param {string} url - The URL to scrape
 * @returns {Promise<Object>} - API response with scholarship data
 */
export const scrapeScholarship = async (url) => {
  try {
    const response = await fetch(`${API_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to scrape scholarship');
    }

    return data;
  } catch (error) {
    console.error('Error scraping scholarship:', error);
    throw error;
  }
};

/**
 * Scrape and normalize multiple scholarships from URLs
 * @param {Array<string>} urls - Array of URLs to scrape
 * @param {number} concurrency - Number of concurrent requests (default: 3)
 * @returns {Promise<Object>} - API response with batch results
 */
export const batchScrapeScholarships = async (urls, concurrency = 3) => {
  try {
    const response = await fetch(`${API_BASE_URL}/batch-scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls, concurrency }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to batch scrape scholarships');
    }

    return data;
  } catch (error) {
    console.error('Error batch scraping scholarships:', error);
    throw error;
  }
};

/**
 * Test the scholarship scraping functionality
 * @returns {Promise<Object>} - API response with test results
 */
export const testScholarshipScraping = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to test scholarship scraping');
    }

    return data;
  } catch (error) {
    console.error('Error testing scholarship scraping:', error);
    throw error;
  }
};

/**
 * Validate a scholarship object against the schema
 * @param {Object} scholarship - The scholarship object to validate
 * @returns {Promise<Object>} - API response with validation results
 */
export const validateScholarship = async (scholarship) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scholarship }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to validate scholarship');
    }

    return data;
  } catch (error) {
    console.error('Error validating scholarship:', error);
    throw error;
  }
};

/**
 * Get the scholarship schema definition
 * @returns {Promise<Object>} - API response with schema definition
 */
export const getScholarshipSchema = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/schema`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get scholarship schema');
    }

    return data;
  } catch (error) {
    console.error('Error getting scholarship schema:', error);
    throw error;
  }
};

/**
 * Format scholarship data for display
 * @param {Object} scholarship - Raw scholarship object
 * @returns {Object} - Formatted scholarship object
 */
export const formatScholarshipForDisplay = (scholarship) => {
  if (!scholarship) return null;

  return {
    ...scholarship,
    formattedDeadline: formatDeadline(scholarship.deadline),
    formattedFunding: scholarship.isFullyFunded ? 'Fully Funded' : 'Partial Funding',
    formattedDegree: formatDegree(scholarship.degree),
    truncatedEligibility: truncateText(scholarship.eligibility, 150)
  };
};

/**
 * Format deadline for display
 * @param {string|null} deadline - Raw deadline value
 * @returns {string} - Formatted deadline
 */
const formatDeadline = (deadline) => {
  if (!deadline) return 'Not specified';
  if (deadline === 'varies') return 'Varies';
  
  try {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return deadline;
  }
};

/**
 * Format degree for display
 * @param {string} degree - Raw degree value
 * @returns {string} - Formatted degree
 */
const formatDegree = (degree) => {
  const degreeMap = {
    'Bachelor': "Bachelor's",
    'Master': "Master's",
    'PhD': 'PhD',
    'Any': 'Any Level'
  };
  
  return degreeMap[degree] || degree;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
};

/**
 * Extract domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} - Domain name
 */
export const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Get scholarship card color based on degree level
 * @param {string} degree - Degree level
 * @returns {string} - CSS color class
 */
export const getScholarshipCardColor = (degree) => {
  const colorMap = {
    'Bachelor': 'bg-blue-900',
    'Master': 'bg-purple-900',
    'PhD': 'bg-red-900',
    'Any': 'bg-gray-800'
  };
  
  return colorMap[degree] || 'bg-gray-800';
};

/**
 * Get funding badge color
 * @param {boolean} isFullyFunded - Whether scholarship is fully funded
 * @returns {string} - CSS color class
 */
export const getFundingBadgeColor = (isFullyFunded) => {
  return isFullyFunded ? 'bg-green-600' : 'bg-yellow-600';
};

export default {
  scrapeScholarship,
  batchScrapeScholarships,
  testScholarshipScraping,
  validateScholarship,
  getScholarshipSchema,
  formatScholarshipForDisplay,
  extractDomain,
  isValidUrl,
  getScholarshipCardColor,
  getFundingBadgeColor
};
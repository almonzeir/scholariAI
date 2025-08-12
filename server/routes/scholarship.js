import express from 'express';
import {
  scrapeAndNormalizeScholarship,
  batchScrapeScholarships,
  testScholarshipScraping
} from '../lib/scholarshipScraper.js';

const router = express.Router();

/**
 * @route POST /api/scholarship/scrape
 * @desc Scrape and normalize a single scholarship from URL
 * @access Public
 */
router.post('/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    
    // Validate input
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    // Scrape and normalize the scholarship
    const result = await scrapeAndNormalizeScholarship(url);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.scholarship,
        metadata: result.scrapingDetails,
        timestamp: result.timestamp
      });
    } else {
      res.status(422).json({
        success: false,
        error: result.error,
        url: result.url,
        timestamp: result.timestamp
      });
    }
    
  } catch (error) {
    console.error('Error in /scrape endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during scraping'
    });
  }
});

/**
 * @route POST /api/scholarship/batch-scrape
 * @desc Scrape and normalize multiple scholarships from URLs
 * @access Public
 */
router.post('/batch-scrape', async (req, res) => {
  try {
    const { urls, concurrency = 3 } = req.body;
    
    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'URLs array is required and must not be empty'
      });
    }
    
    // Limit batch size to prevent abuse
    if (urls.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 URLs allowed per batch'
      });
    }
    
    // Validate concurrency
    if (concurrency < 1 || concurrency > 10) {
      return res.status(400).json({
        success: false,
        error: 'Concurrency must be between 1 and 10'
      });
    }
    
    // Validate URL formats
    const invalidUrls = [];
    urls.forEach((url, index) => {
      try {
        new URL(url);
      } catch (e) {
        invalidUrls.push({ index, url, error: 'Invalid URL format' });
      }
    });
    
    if (invalidUrls.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL formats found',
        invalidUrls
      });
    }
    
    // Perform batch scraping
    const result = await batchScrapeScholarships(urls, concurrency);
    
    res.json({
      success: true,
      scholarships: result.results.map(r => r.scholarship),
      summary: result.summary,
      errors: result.errors,
      timestamp: result.timestamp
    });
    
  } catch (error) {
    console.error('Error in /batch-scrape endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during batch scraping'
    });
  }
});

/**
 * @route GET /api/scholarship/test
 * @desc Test the scholarship scraping functionality
 * @access Public
 */
router.get('/test', async (req, res) => {
  try {
    const result = await testScholarshipScraping();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Scholarship scraping test completed',
        testResults: result.testResults,
        timestamp: result.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        timestamp: result.timestamp
      });
    }
    
  } catch (error) {
    console.error('Error in /test endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during testing'
    });
  }
});

/**
 * @route POST /api/scholarship/validate
 * @desc Validate a scholarship object against the schema
 * @access Public
 */
router.post('/validate', async (req, res) => {
  try {
    const { scholarship } = req.body;
    
    if (!scholarship) {
      return res.status(400).json({
        success: false,
        error: 'Scholarship object is required'
      });
    }
    
    // Define required fields and their types
    const requiredFields = {
      id: 'string',
      name: 'string',
      country: ['string', 'null'],
      degree: 'string',
      eligibility: 'string',
      deadline: ['string', 'null'],
      link: 'string',
      source: 'string',
      isFullyFunded: 'boolean'
    };
    
    const validDegrees = ['Bachelor', 'Master', 'PhD', 'Any'];
    const errors = [];
    
    // Validate each field
    Object.entries(requiredFields).forEach(([field, expectedType]) => {
      const value = scholarship[field];
      const actualType = value === null ? 'null' : typeof value;
      
      if (Array.isArray(expectedType)) {
        if (!expectedType.includes(actualType)) {
          errors.push(`Field '${field}' must be one of: ${expectedType.join(', ')}`);
        }
      } else {
        if (actualType !== expectedType) {
          errors.push(`Field '${field}' must be of type ${expectedType}`);
        }
      }
    });
    
    // Validate degree values
    if (scholarship.degree && !validDegrees.includes(scholarship.degree)) {
      errors.push(`Field 'degree' must be one of: ${validDegrees.join(', ')}`);
    }
    
    // Validate eligibility length
    if (scholarship.eligibility && scholarship.eligibility.length > 220) {
      errors.push('Field \'eligibility\' must be 220 characters or less');
    }
    
    // Validate deadline format
    if (scholarship.deadline && scholarship.deadline !== 'varies') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(scholarship.deadline)) {
        errors.push('Field \'deadline\' must be in YYYY-MM-DD format or "varies"');
      }
    }
    
    // Validate URL format
    if (scholarship.link) {
      try {
        new URL(scholarship.link);
      } catch (e) {
        errors.push('Field \'link\' must be a valid URL');
      }
    }
    
    const isValid = errors.length === 0;
    
    res.json({
      success: true,
      valid: isValid,
      errors: isValid ? [] : errors,
      scholarship: isValid ? scholarship : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in /validate endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during validation'
    });
  }
});

/**
 * @route GET /api/scholarship/schema
 * @desc Get the scholarship schema definition
 * @access Public
 */
router.get('/schema', (req, res) => {
  try {
    const schema = {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier for the scholarship'
        },
        name: {
          type: 'string',
          description: 'Name of the scholarship'
        },
        country: {
          type: ['string', 'null'],
          description: 'Country where the scholarship is available'
        },
        degree: {
          type: 'string',
          enum: ['Bachelor', 'Master', 'PhD', 'Any'],
          description: 'Degree level for the scholarship'
        },
        eligibility: {
          type: 'string',
          maxLength: 220,
          description: 'Eligibility requirements (max 220 characters)'
        },
        deadline: {
          type: ['string', 'null'],
          pattern: '^(\\d{4}-\\d{2}-\\d{2}|varies)$',
          description: 'Application deadline in YYYY-MM-DD format or "varies"'
        },
        link: {
          type: 'string',
          format: 'uri',
          description: 'Official application or information URL'
        },
        source: {
          type: 'string',
          description: 'Source domain of the scholarship information'
        },
        isFullyFunded: {
          type: 'boolean',
          description: 'Whether the scholarship is fully funded'
        }
      },
      required: ['id', 'name', 'degree', 'eligibility', 'link', 'source', 'isFullyFunded'],
      additionalProperties: false
    };
    
    res.json({
      success: true,
      schema,
      constraints: {
        eligibility: 'Maximum 220 characters',
        degree: 'Must be one of: Bachelor, Master, PhD, Any',
        deadline: 'Must be YYYY-MM-DD format or "varies"',
        link: 'Must be a valid URL'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in /schema endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
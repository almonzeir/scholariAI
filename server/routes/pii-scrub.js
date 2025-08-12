import express from 'express';
import { scrubPII, testPIIScrubbing, detectPII } from '../lib/piiScrub.js';
const router = express.Router();

/**
 * POST /api/pii-scrub/scrub
 * Scrub PII from a profile object
 */
router.post('/scrub', async (req, res) => {
  try {
    const { profile } = req.body;
    
    if (!profile || typeof profile !== 'object') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Profile object is required'
      });
    }
    
    // Detect PII before scrubbing
    const piiDetection = detectPII(profile);
    
    // Scrub the profile
    const scrubbedProfile = await scrubPII(profile);
    
    res.json({
      original: profile,
      scrubbed: scrubbedProfile,
      piiDetection,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error scrubbing PII:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to scrub PII from profile'
    });
  }
});

/**
 * POST /api/pii-scrub/detect
 * Detect PII in a profile object without scrubbing
 */
router.post('/detect', (req, res) => {
  try {
    const { profile } = req.body;
    
    if (!profile || typeof profile !== 'object') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Profile object is required'
      });
    }
    
    const piiDetection = detectPII(profile);
    
    res.json({
      profile,
      piiDetection,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error detecting PII:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to detect PII in profile'
    });
  }
});

/**
 * GET /api/pii-scrub/test
 * Test the PII scrubbing functionality
 */
router.get('/test', async (req, res) => {
  try {
    const testResults = await testPIIScrubbing();
    res.json(testResults);
  } catch (error) {
    console.error('Error testing PII scrubbing:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to run PII scrubbing test'
    });
  }
});

/**
 * POST /api/pii-scrub/batch
 * Scrub PII from multiple profiles
 */
router.post('/batch', async (req, res) => {
  try {
    const { profiles } = req.body;
    
    if (!Array.isArray(profiles)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Profiles array is required'
      });
    }
    
    if (profiles.length > 50) {
      return res.status(400).json({
        error: 'Batch size too large',
        message: 'Maximum 50 profiles allowed per batch'
      });
    }
    
    const results = [];
    
    for (const profile of profiles) {
      try {
        const piiDetection = detectPII(profile);
        const scrubbedProfile = await scrubPII(profile);
        
        results.push({
          original: profile,
          scrubbed: scrubbedProfile,
          piiDetection,
          success: true
        });
      } catch (error) {
        results.push({
          original: profile,
          error: error.message,
          success: false
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    res.json({
      results,
      summary: {
        total: profiles.length,
        successful: successCount,
        failed: failureCount
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error batch scrubbing PII:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to batch scrub PII from profiles'
    });
  }
});

export default router;
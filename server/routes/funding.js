import express from 'express';
import { classifyFunding, batchClassifyFunding, testFundingClassification } from '../lib/fundingClassifier.js';

const router = express.Router();

/**
 * POST /api/funding/classify
 * Classify if a single scholarship is fully funded
 */
router.post('/classify', async (req, res) => {
  try {
    const { scholarship } = req.body;
    
    if (!scholarship || typeof scholarship !== 'object') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Scholarship object is required'
      });
    }
    
    const result = await classifyFunding(scholarship);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error classifying funding:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to classify scholarship funding'
    });
  }
});

/**
 * POST /api/funding/batch-classify
 * Classify funding for multiple scholarships
 */
router.post('/batch-classify', async (req, res) => {
  try {
    const { scholarships, concurrency = 3 } = req.body;
    
    // Validate input
    if (!Array.isArray(scholarships)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Scholarships must be an array'
      });
    }
    
    if (scholarships.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'At least one scholarship is required'
      });
    }
    
    if (scholarships.length > 100) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Maximum 100 scholarships allowed per batch'
      });
    }
    
    if (typeof concurrency !== 'number' || concurrency < 1 || concurrency > 10) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Concurrency must be a number between 1 and 10'
      });
    }
    
    // Validate each scholarship object
    for (let i = 0; i < scholarships.length; i++) {
      if (!scholarships[i] || typeof scholarships[i] !== 'object') {
        return res.status(400).json({
          error: 'Invalid input',
          message: `Scholarship at index ${i} is not a valid object`
        });
      }
    }
    
    const result = await batchClassifyFunding(scholarships, concurrency);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in batch funding classification:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to classify scholarship funding in batch'
    });
  }
});

/**
 * GET /api/funding/test
 * Test the funding classification system
 */
router.get('/test', async (req, res) => {
  try {
    const result = await testFundingClassification();
    res.json(result);
  } catch (error) {
    console.error('Error testing funding classification:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to test funding classification system'
    });
  }
});

/**
 * POST /api/funding/validate-classification
 * Validate a funding classification result
 */
router.post('/validate-classification', (req, res) => {
  try {
    const { classification } = req.body;
    
    if (!classification || typeof classification !== 'object') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Classification object is required'
      });
    }
    
    const errors = [];
    
    // Validate required fields
    if (typeof classification.isFullyFunded !== 'boolean') {
      errors.push('isFullyFunded must be a boolean');
    }
    
    if (typeof classification.reason !== 'string') {
      errors.push('reason must be a string');
    } else if (classification.reason.length > 160) {
      errors.push('reason must be 160 characters or less');
    } else if (classification.reason.length === 0) {
      errors.push('reason cannot be empty');
    }
    
    const isValid = errors.length === 0;
    
    res.json({
      valid: isValid,
      errors: errors.length > 0 ? errors : undefined,
      classification,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error validating classification:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to validate classification'
    });
  }
});

/**
 * GET /api/funding/schema
 * Get the funding classification schema
 */
router.get('/schema', (req, res) => {
  const schema = {
    classification: {
      type: 'object',
      required: ['isFullyFunded', 'reason'],
      properties: {
        isFullyFunded: {
          type: 'boolean',
          description: 'Whether the scholarship is fully funded'
        },
        reason: {
          type: 'string',
          maxLength: 160,
          description: 'Explanation for the funding classification (max 160 characters)'
        }
      }
    },
    response: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the classification was successful'
        },
        classification: {
          $ref: '#/classification'
        },
        metadata: {
          type: 'object',
          properties: {
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            model: {
              type: 'string',
              description: 'AI model used for classification'
            },
            scholarshipId: {
              type: 'string',
              description: 'ID of the classified scholarship'
            }
          }
        },
        error: {
          type: 'string',
          description: 'Error message if classification failed'
        }
      }
    },
    rules: {
      fullyFunded: [
        'Must include tuition coverage',
        'Must include stipend or living allowance',
        'Often includes travel and insurance',
        'If ambiguous or partial, classify as false'
      ],
      reasonConstraints: {
        maxLength: 160,
        required: true,
        description: 'Brief explanation for the classification decision'
      }
    }
  };
  
  res.json({
    schema,
    timestamp: new Date().toISOString()
  });
});

export default router;
import express from 'express';
import { canonicalizeDegreeField, batchCanonicalizeDegreeField } from '../lib/canonicalization.js';

const router = express.Router();

/**
 * POST /api/canonicalize/degree-field
 * Canonicalize a single degree and field pair
 */
router.post('/degree-field', async (req, res) => {
  try {
    const { degreeTarget, field } = req.body;
    
    // Validate input
    if (typeof degreeTarget !== 'string' || typeof field !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Both degreeTarget and field must be strings'
      });
    }
    
    // Canonicalize the input
    const result = await canonicalizeDegreeField(degreeTarget, field);
    
    res.json({
      input: { degreeTarget, field },
      output: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Canonicalization API error:', error);
    res.status(500).json({
      error: 'Canonicalization failed',
      message: error.message
    });
  }
});

/**
 * POST /api/canonicalize/batch
 * Canonicalize multiple degree and field pairs
 */
router.post('/batch', async (req, res) => {
  try {
    const { inputs } = req.body;
    
    // Validate input
    if (!Array.isArray(inputs)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'inputs must be an array'
      });
    }
    
    // Validate each input item
    for (const input of inputs) {
      if (typeof input.degreeTarget !== 'string' || typeof input.field !== 'string') {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Each input must have degreeTarget and field as strings'
        });
      }
    }
    
    // Limit batch size to prevent abuse
    if (inputs.length > 50) {
      return res.status(400).json({
        error: 'Batch too large',
        message: 'Maximum 50 items per batch'
      });
    }
    
    // Canonicalize the inputs
    const results = await batchCanonicalizeDegreeField(inputs);
    
    res.json({
      inputs,
      outputs: results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Batch canonicalization API error:', error);
    res.status(500).json({
      error: 'Batch canonicalization failed',
      message: error.message
    });
  }
});

/**
 * GET /api/canonicalize/test
 * Test the canonicalization with sample data
 */
router.get('/test', async (req, res) => {
  try {
    const testCases = [
      { degreeTarget: 'bachelor of science', field: 'computer science' },
      { degreeTarget: 'masters', field: 'electrical eng' },
      { degreeTarget: 'doctorate', field: 'public health' },
      { degreeTarget: 'BS', field: 'CS' },
      { degreeTarget: 'phd', field: 'development studies' },
      { degreeTarget: 'undergraduate', field: 'software engineering' },
      { degreeTarget: 'graduate', field: 'data science' }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const result = await canonicalizeDegreeField(testCase.degreeTarget, testCase.field);
        results.push({
          input: testCase,
          output: result,
          status: 'success'
        });
      } catch (error) {
        results.push({
          input: testCase,
          output: null,
          status: 'error',
          error: error.message
        });
      }
    }
    
    res.json({
      message: 'Canonicalization test completed',
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test canonicalization API error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
});

export default router;
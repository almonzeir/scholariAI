import express from 'express';
import {
  parseDeadline,
  parseDeadlineWithAI,
  parseDeadlineRuleBased,
  testDeadlineParsing,
  getDeadlineParsingSchema
} from '../lib/deadlineParser.js';

const router = express.Router();

/**
 * @route POST /api/deadline/parse
 * @desc Parse a single deadline text
 * @access Public
 */
router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text field is required and must be a string'
      });
    }
    
    const startTime = Date.now();
    const result = await parseDeadline(text);
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      result,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        inputLength: text.length,
        method: 'hybrid' // AI with rule-based fallback
      }
    });
  } catch (error) {
    console.error('Error parsing deadline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse deadline',
      details: error.message
    });
  }
});

/**
 * @route POST /api/deadline/parse-ai
 * @desc Parse deadline using AI only
 * @access Public
 */
router.post('/parse-ai', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text field is required and must be a string'
      });
    }
    
    const startTime = Date.now();
    const result = await parseDeadlineWithAI(text);
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      result,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        inputLength: text.length,
        method: 'ai-only'
      }
    });
  } catch (error) {
    console.error('Error parsing deadline with AI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse deadline with AI',
      details: error.message
    });
  }
});

/**
 * @route POST /api/deadline/parse-rules
 * @desc Parse deadline using rule-based approach only
 * @access Public
 */
router.post('/parse-rules', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text field is required and must be a string'
      });
    }
    
    const startTime = Date.now();
    const result = await parseDeadlineRuleBased(text);
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      result,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        inputLength: text.length,
        method: 'rule-based'
      }
    });
  } catch (error) {
    console.error('Error parsing deadline with rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse deadline with rules',
      details: error.message
    });
  }
});

/**
 * @route POST /api/deadline/batch-parse
 * @desc Parse multiple deadline texts
 * @access Public
 */
router.post('/batch-parse', async (req, res) => {
  try {
    const { texts } = req.body;
    
    if (!Array.isArray(texts)) {
      return res.status(400).json({
        success: false,
        error: 'Texts field is required and must be an array'
      });
    }
    
    if (texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one text is required'
      });
    }
    
    if (texts.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 texts allowed per batch'
      });
    }
    
    const startTime = Date.now();
    const results = [];
    const errors = [];
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      
      try {
        if (typeof text !== 'string') {
          throw new Error('Text must be a string');
        }
        
        const result = await parseDeadline(text);
        results.push({
          index: i,
          text,
          success: true,
          result
        });
      } catch (error) {
        const errorResult = {
          index: i,
          text,
          success: false,
          error: error.message
        };
        
        results.push(errorResult);
        errors.push(errorResult);
      }
    }
    
    const processingTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      results,
      summary: {
        total: texts.length,
        successful,
        failed,
        processingTimeMs: processingTime,
        averageTimePerText: Math.round(processingTime / texts.length)
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in batch deadline parsing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch deadline parsing',
      details: error.message
    });
  }
});

/**
 * @route GET /api/deadline/test
 * @desc Test deadline parsing with sample data
 * @access Public
 */
router.get('/test', async (req, res) => {
  try {
    const startTime = Date.now();
    const testResults = await testDeadlineParsing();
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      testResults,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime
      }
    });
  } catch (error) {
    console.error('Error testing deadline parsing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run deadline parsing tests',
      details: error.message
    });
  }
});

/**
 * @route POST /api/deadline/validate
 * @desc Validate a parsed deadline result
 * @access Public
 */
router.post('/validate', async (req, res) => {
  try {
    const { deadline, originalText } = req.body;
    
    if (!deadline || typeof deadline !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Deadline field is required and must be a string'
      });
    }
    
    const validation = {
      isValid: false,
      format: null,
      issues: []
    };
    
    // Check if it's "varies"
    if (deadline === 'varies') {
      validation.isValid = true;
      validation.format = 'varies';
    } else {
      // Check ISO format
      const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
      if (isoPattern.test(deadline)) {
        const date = new Date(deadline);
        if (date instanceof Date && !isNaN(date) && date.toISOString().slice(0, 10) === deadline) {
          validation.isValid = true;
          validation.format = 'iso-date';
          
          // Check if date is in the past
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (date < today) {
            validation.issues.push('Deadline is in the past');
          }
          
          // Check if date is too far in the future (more than 5 years)
          const fiveYearsFromNow = new Date();
          fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
          
          if (date > fiveYearsFromNow) {
            validation.issues.push('Deadline is more than 5 years in the future');
          }
        } else {
          validation.issues.push('Invalid date format or non-existent date');
        }
      } else {
        validation.issues.push('Invalid format - must be YYYY-MM-DD or "varies"');
      }
    }
    
    res.json({
      success: true,
      validation,
      metadata: {
        timestamp: new Date().toISOString(),
        originalText: originalText || null
      }
    });
  } catch (error) {
    console.error('Error validating deadline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate deadline',
      details: error.message
    });
  }
});

/**
 * @route GET /api/deadline/schema
 * @desc Get deadline parsing schema
 * @access Public
 */
router.get('/schema', (req, res) => {
  try {
    const schema = getDeadlineParsingSchema();
    
    res.json({
      success: true,
      schema,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Error getting deadline parsing schema:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get schema',
      details: error.message
    });
  }
});

export default router;
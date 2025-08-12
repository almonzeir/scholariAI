import express from 'express';
import { 
  deduplicateScholarships, 
  deduplicateWithAI, 
  deduplicateWithRules, 
  validateDeduplication 
} from '../lib/deduplicator.js';

const router = express.Router();

/**
 * @route POST /api/deduplication/deduplicate
 * @desc Deduplicate scholarship items using hybrid approach
 * @access Public
 */
router.post('/deduplicate', async (req, res) => {
  try {
    const { items, method = 'hybrid' } = req.body;

    if (!items) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items must be an array'
      });
    }

    const validMethods = ['ai', 'rules', 'hybrid'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        error: `Invalid method. Must be one of: ${validMethods.join(', ')}`
      });
    }

    const result = await deduplicateScholarships(items, method);
    
    res.json(result);
  } catch (error) {
    console.error('Deduplication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during deduplication',
      details: error.message
    });
  }
});

/**
 * @route POST /api/deduplication/deduplicate-ai
 * @desc Deduplicate scholarship items using AI only
 * @access Public
 */
router.post('/deduplicate-ai', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    const startTime = Date.now();
    const deduplicatedItems = await deduplicateWithAI(items);
    const processingTime = Date.now() - startTime;

    const originalCount = items.length;
    const deduplicatedCount = deduplicatedItems.length;
    const duplicatesRemoved = originalCount - deduplicatedCount;

    res.json({
      success: true,
      deduplicated: deduplicatedItems,
      originalCount,
      deduplicatedCount,
      duplicatesRemoved,
      method: 'ai',
      metadata: {
        processingTime,
        confidence: 0.9,
        deduplicationRate: originalCount > 0 ? (duplicatesRemoved / originalCount) : 0
      }
    });
  } catch (error) {
    console.error('AI deduplication error:', error);
    res.status(500).json({
      success: false,
      error: 'AI deduplication failed',
      details: error.message
    });
  }
});

/**
 * @route POST /api/deduplication/deduplicate-rules
 * @desc Deduplicate scholarship items using rule-based approach only
 * @access Public
 */
router.post('/deduplicate-rules', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    const startTime = Date.now();
    const deduplicatedItems = deduplicateWithRules(items);
    const processingTime = Date.now() - startTime;

    const originalCount = items.length;
    const deduplicatedCount = deduplicatedItems.length;
    const duplicatesRemoved = originalCount - deduplicatedCount;

    res.json({
      success: true,
      deduplicated: deduplicatedItems,
      originalCount,
      deduplicatedCount,
      duplicatesRemoved,
      method: 'rules',
      metadata: {
        processingTime,
        confidence: 0.7,
        deduplicationRate: originalCount > 0 ? (duplicatesRemoved / originalCount) : 0
      }
    });
  } catch (error) {
    console.error('Rule-based deduplication error:', error);
    res.status(500).json({
      success: false,
      error: 'Rule-based deduplication failed',
      details: error.message
    });
  }
});

/**
 * @route POST /api/deduplication/batch-deduplicate
 * @desc Deduplicate multiple arrays of scholarship items
 * @access Public
 */
router.post('/batch-deduplicate', async (req, res) => {
  try {
    const { batches, method = 'hybrid' } = req.body;

    if (!batches || !Array.isArray(batches)) {
      return res.status(400).json({
        success: false,
        error: 'Batches array is required'
      });
    }

    const validMethods = ['ai', 'rules', 'hybrid'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        error: `Invalid method. Must be one of: ${validMethods.join(', ')}`
      });
    }

    const results = [];
    let totalOriginal = 0;
    let totalDeduplicated = 0;
    let totalProcessingTime = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!Array.isArray(batch)) {
        results.push({
          batchIndex: i,
          success: false,
          error: 'Each batch must be an array',
          deduplicated: [],
          originalCount: 0,
          deduplicatedCount: 0,
          duplicatesRemoved: 0
        });
        continue;
      }

      try {
        const result = await deduplicateScholarships(batch, method);
        results.push({
          batchIndex: i,
          ...result
        });
        
        totalOriginal += result.originalCount;
        totalDeduplicated += result.deduplicatedCount;
        totalProcessingTime += result.metadata.processingTime;
      } catch (error) {
        results.push({
          batchIndex: i,
          success: false,
          error: error.message,
          deduplicated: [],
          originalCount: Array.isArray(batch) ? batch.length : 0,
          deduplicatedCount: 0,
          duplicatesRemoved: 0
        });
      }
    }

    const successfulBatches = results.filter(r => r.success).length;
    const totalDuplicatesRemoved = totalOriginal - totalDeduplicated;

    res.json({
      success: true,
      results,
      summary: {
        totalBatches: batches.length,
        successfulBatches,
        failedBatches: batches.length - successfulBatches,
        totalOriginalItems: totalOriginal,
        totalDeduplicatedItems: totalDeduplicated,
        totalDuplicatesRemoved,
        overallDeduplicationRate: totalOriginal > 0 ? (totalDuplicatesRemoved / totalOriginal) : 0,
        totalProcessingTime,
        method
      }
    });
  } catch (error) {
    console.error('Batch deduplication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during batch deduplication',
      details: error.message
    });
  }
});

/**
 * @route POST /api/deduplication/validate
 * @desc Validate deduplication results
 * @access Public
 */
router.post('/validate', async (req, res) => {
  try {
    const { original, deduplicated } = req.body;

    if (!original || !deduplicated) {
      return res.status(400).json({
        success: false,
        error: 'Both original and deduplicated arrays are required'
      });
    }

    const validation = validateDeduplication(original, deduplicated);
    
    res.json({
      success: true,
      validation
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during validation',
      details: error.message
    });
  }
});

/**
 * @route GET /api/deduplication/test
 * @desc Test the deduplication system with sample data
 * @access Public
 */
router.get('/test', async (req, res) => {
  try {
    const sampleItems = [
      {
        title: "Gates Millennium Scholarship",
        organization: "Bill & Melinda Gates Foundation",
        amount: "$50,000",
        deadline: "2024-01-15",
        description: "Full scholarship for outstanding minority students",
        eligibility: "Minority students with high academic achievement",
        link: "https://www.gatesfoundation.org/scholarships"
      },
      {
        title: "Gates Millennium Scholars Program",
        organization: "Gates Foundation",
        amount: "$50000",
        deadline: "2024-01-15",
        description: "Comprehensive scholarship program for minority students pursuing higher education",
        eligibility: "Outstanding minority students",
        link: "https://scholarships.com/gates-millennium"
      },
      {
        title: "National Merit Scholarship",
        organization: "National Merit Scholarship Corporation",
        amount: "$2,500",
        deadline: "2024-02-01",
        description: "Merit-based scholarship for high-achieving students",
        eligibility: "High PSAT/NMSQT scores",
        link: "https://www.nationalmerit.org"
      }
    ];

    const method = req.query.method || 'hybrid';
    const result = await deduplicateScholarships(sampleItems, method);
    
    res.json({
      success: true,
      message: 'Deduplication test completed',
      testData: {
        input: sampleItems,
        output: result
      }
    });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
});

/**
 * @route GET /api/deduplication/schema
 * @desc Get the deduplication API schema
 * @access Public
 */
router.get('/schema', (req, res) => {
  try {
    const schema = {
      endpoints: {
        '/deduplicate': {
          method: 'POST',
          description: 'Deduplicate scholarship items using hybrid approach',
          requestBody: {
            items: 'Array of scholarship objects',
            method: 'String (optional): "ai", "rules", or "hybrid" (default)'
          },
          response: {
            success: 'Boolean',
            deduplicated: 'Array of deduplicated scholarship objects',
            originalCount: 'Number',
            deduplicatedCount: 'Number',
            duplicatesRemoved: 'Number',
            method: 'String',
            metadata: 'Object with processing details'
          }
        },
        '/deduplicate-ai': {
          method: 'POST',
          description: 'Deduplicate using AI only',
          requestBody: {
            items: 'Array of scholarship objects'
          }
        },
        '/deduplicate-rules': {
          method: 'POST',
          description: 'Deduplicate using rule-based approach only',
          requestBody: {
            items: 'Array of scholarship objects'
          }
        },
        '/batch-deduplicate': {
          method: 'POST',
          description: 'Deduplicate multiple arrays of scholarship items',
          requestBody: {
            batches: 'Array of arrays of scholarship objects',
            method: 'String (optional): "ai", "rules", or "hybrid" (default)'
          }
        },
        '/validate': {
          method: 'POST',
          description: 'Validate deduplication results',
          requestBody: {
            original: 'Array of original scholarship objects',
            deduplicated: 'Array of deduplicated scholarship objects'
          }
        },
        '/test': {
          method: 'GET',
          description: 'Test the deduplication system',
          queryParams: {
            method: 'String (optional): "ai", "rules", or "hybrid" (default)'
          }
        },
        '/schema': {
          method: 'GET',
          description: 'Get API schema'
        }
      },
      scholarshipObjectSchema: {
        title: 'String - Scholarship title',
        organization: 'String - Sponsoring organization',
        amount: 'String - Award amount',
        deadline: 'String - Application deadline (ISO format preferred)',
        description: 'String - Scholarship description',
        eligibility: 'String - Eligibility requirements',
        requirements: 'String - Application requirements',
        link: 'String - Application or information URL'
      },
      methods: {
        ai: 'Uses Gemini AI for intelligent deduplication',
        rules: 'Uses rule-based similarity matching',
        hybrid: 'Uses AI with rule-based fallback (recommended)'
      }
    };

    res.json({
      success: true,
      schema
    });
  } catch (error) {
    console.error('Schema error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get schema',
      details: error.message
    });
  }
});

export default router;
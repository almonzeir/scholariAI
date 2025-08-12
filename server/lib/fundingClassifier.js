import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * System prompt for funding classification
 */
const FUNDING_CLASSIFIER_SYSTEM_PROMPT = `You label if a scholarship is fully funded. Return JSON only: { "isFullyFunded": true|false, "reason": string }.

Rules:
- Fully funded includes tuition + stipend/living + often travel/insurance.
- If ambiguous or partial, return false. Reason ≤ 160 chars.`;

/**
 * Classify if a scholarship is fully funded using AI
 * @param {Object} scholarship - The normalized scholarship object
 * @returns {Promise<Object>} - Classification result with isFullyFunded and reason
 */
export async function classifyFunding(scholarship) {
  try {
    // Create the user prompt with the scholarship JSON
    const userPrompt = `ITEM:\n\n${JSON.stringify(scholarship, null, 2)}`;
    
    // Generate the classification using Gemini
    const result = await model.generateContent([
      { role: 'user', parts: [{ text: FUNDING_CLASSIFIER_SYSTEM_PROMPT }] },
      { role: 'user', parts: [{ text: userPrompt }] }
    ]);
    
    const response = result.response;
    let classificationText = response.text();
    
    // Clean up the response text
    classificationText = classificationText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse the JSON response
    const classification = JSON.parse(classificationText);
    
    // Validate the response structure
    if (typeof classification.isFullyFunded !== 'boolean' || typeof classification.reason !== 'string') {
      throw new Error('Invalid classification response structure');
    }
    
    // Ensure reason is within character limit
    if (classification.reason.length > 160) {
      classification.reason = classification.reason.substring(0, 157) + '...';
    }
    
    return {
      success: true,
      classification,
      metadata: {
        timestamp: new Date().toISOString(),
        model: 'gemini-1.5-flash',
        scholarshipId: scholarship.id || 'unknown'
      }
    };
    
  } catch (error) {
    console.error('Error classifying funding:', error);
    
    // Fallback classification based on keywords
    const fallbackClassification = fallbackFundingClassification(scholarship);
    
    return {
      success: false,
      classification: fallbackClassification,
      error: error.message,
      metadata: {
        timestamp: new Date().toISOString(),
        model: 'fallback',
        scholarshipId: scholarship.id || 'unknown'
      }
    };
  }
}

/**
 * Fallback funding classification using keyword analysis
 * @param {Object} scholarship - The scholarship object
 * @returns {Object} - Classification result
 */
function fallbackFundingClassification(scholarship) {
  const text = `${scholarship.name || ''} ${scholarship.eligibility || ''} ${scholarship.description || ''}`.toLowerCase();
  
  // Keywords that indicate full funding
  const fullFundingKeywords = [
    'full funding', 'fully funded', 'full scholarship', 'tuition and living',
    'tuition + stipend', 'tuition and stipend', 'living allowance',
    'accommodation provided', 'travel allowance', 'insurance covered',
    'monthly stipend', 'living expenses covered'
  ];
  
  // Keywords that indicate partial funding
  const partialFundingKeywords = [
    'tuition only', 'partial funding', 'tuition waiver', 'fee waiver',
    'tuition reduction', 'partial scholarship'
  ];
  
  const hasFullFundingKeywords = fullFundingKeywords.some(keyword => text.includes(keyword));
  const hasPartialFundingKeywords = partialFundingKeywords.some(keyword => text.includes(keyword));
  
  if (hasPartialFundingKeywords) {
    return {
      isFullyFunded: false,
      reason: 'Contains keywords indicating partial funding only'
    };
  }
  
  if (hasFullFundingKeywords) {
    return {
      isFullyFunded: true,
      reason: 'Contains keywords indicating comprehensive funding coverage'
    };
  }
  
  // Default to false if ambiguous
  return {
    isFullyFunded: false,
    reason: 'Funding details unclear or insufficient information provided'
  };
}

/**
 * Batch classify funding for multiple scholarships
 * @param {Array} scholarships - Array of scholarship objects
 * @param {number} concurrency - Number of concurrent classifications (default: 3)
 * @returns {Promise<Object>} - Batch classification results
 */
export async function batchClassifyFunding(scholarships, concurrency = 3) {
  const startTime = Date.now();
  const results = [];
  const errors = [];
  
  // Process scholarships in batches
  for (let i = 0; i < scholarships.length; i += concurrency) {
    const batch = scholarships.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (scholarship, index) => {
      try {
        const result = await classifyFunding(scholarship);
        return {
          index: i + index,
          scholarshipId: scholarship.id || `scholarship_${i + index}`,
          ...result
        };
      } catch (error) {
        const errorResult = {
          index: i + index,
          scholarshipId: scholarship.id || `scholarship_${i + index}`,
          success: false,
          error: error.message,
          classification: fallbackFundingClassification(scholarship)
        };
        errors.push(errorResult);
        return errorResult;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  const endTime = Date.now();
  const processingTime = endTime - startTime;
  
  return {
    success: true,
    results,
    summary: {
      total: scholarships.length,
      successful: results.filter(r => r.success).length,
      failed: errors.length,
      fullyFunded: results.filter(r => r.classification?.isFullyFunded).length,
      partiallyFunded: results.filter(r => !r.classification?.isFullyFunded).length,
      processingTimeMs: processingTime,
      averageTimePerScholarship: Math.round(processingTime / scholarships.length)
    },
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Test the funding classification system
 * @returns {Promise<Object>} - Test results
 */
export async function testFundingClassification() {
  const testScholarships = [
    {
      id: 'test_1',
      name: 'Full Ride Scholarship',
      eligibility: 'Covers full tuition, monthly stipend of $2000, accommodation, and travel allowance',
      country: 'USA'
    },
    {
      id: 'test_2', 
      name: 'Tuition Waiver Program',
      eligibility: 'Tuition fees waived, students responsible for living expenses',
      country: 'Canada'
    },
    {
      id: 'test_3',
      name: 'Research Fellowship',
      eligibility: 'Comprehensive funding including tuition, living stipend, research allowance, and health insurance',
      country: 'UK'
    }
  ];
  
  try {
    const results = await batchClassifyFunding(testScholarships, 2);
    
    return {
      success: true,
      message: 'Funding classification test completed successfully',
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
  FUNDING_CLASSIFIER_SYSTEM_PROMPT
};
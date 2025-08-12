const API_BASE_URL = 'http://localhost:5002/api/funding';

/**
 * Classify if a single scholarship is fully funded
 * @param {Object} scholarship - The scholarship object to classify
 * @returns {Promise<Object>} - API response with classification result
 */
export const classifyFunding = async (scholarship) => {
  try {
    const response = await fetch(`${API_BASE_URL}/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scholarship }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to classify funding');
    }

    return data;
  } catch (error) {
    console.error('Error classifying funding:', error);
    throw error;
  }
};

/**
 * Classify funding for multiple scholarships
 * @param {Array} scholarships - Array of scholarship objects
 * @param {number} concurrency - Number of concurrent classifications (default: 3)
 * @returns {Promise<Object>} - API response with batch classification results
 */
export const batchClassifyFunding = async (scholarships, concurrency = 3) => {
  try {
    const response = await fetch(`${API_BASE_URL}/batch-classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scholarships, concurrency }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to classify funding in batch');
    }

    return data;
  } catch (error) {
    console.error('Error in batch funding classification:', error);
    throw error;
  }
};

/**
 * Test the funding classification system
 * @returns {Promise<Object>} - API response with test results
 */
export const testFundingClassification = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to test funding classification');
    }

    return data;
  } catch (error) {
    console.error('Error testing funding classification:', error);
    throw error;
  }
};

/**
 * Validate a funding classification result
 * @param {Object} classification - The classification object to validate
 * @returns {Promise<Object>} - API response with validation result
 */
export const validateClassification = async (classification) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-classification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ classification }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to validate classification');
    }

    return data;
  } catch (error) {
    console.error('Error validating classification:', error);
    throw error;
  }
};

/**
 * Get the funding classification schema
 * @returns {Promise<Object>} - API response with schema definition
 */
export const getFundingSchema = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/schema`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get funding schema');
    }

    return data;
  } catch (error) {
    console.error('Error getting funding schema:', error);
    throw error;
  }
};

/**
 * Format classification result for display
 * @param {Object} classificationResult - The classification result from API
 * @returns {Object} - Formatted result for UI display
 */
export const formatClassificationForDisplay = (classificationResult) => {
  if (!classificationResult || !classificationResult.classification) {
    return {
      status: 'Unknown',
      reason: 'No classification data available',
      confidence: 'low',
      color: 'gray'
    };
  }

  const { classification, success, metadata } = classificationResult;
  
  return {
    status: classification.isFullyFunded ? 'Fully Funded' : 'Partially Funded',
    reason: classification.reason,
    confidence: success ? 'high' : 'low',
    color: classification.isFullyFunded ? 'green' : 'orange',
    model: metadata?.model || 'unknown',
    timestamp: metadata?.timestamp
  };
};

/**
 * Get funding badge color based on classification
 * @param {boolean} isFullyFunded - Whether the scholarship is fully funded
 * @returns {string} - CSS color class
 */
export const getFundingBadgeColor = (isFullyFunded) => {
  return isFullyFunded ? 'bg-green-500' : 'bg-orange-500';
};

/**
 * Get funding status text
 * @param {boolean} isFullyFunded - Whether the scholarship is fully funded
 * @returns {string} - Status text
 */
export const getFundingStatusText = (isFullyFunded) => {
  return isFullyFunded ? 'Fully Funded' : 'Partially Funded';
};

/**
 * Validate scholarship object before classification
 * @param {Object} scholarship - The scholarship object to validate
 * @returns {Object} - Validation result
 */
export const validateScholarshipForClassification = (scholarship) => {
  const errors = [];
  
  if (!scholarship || typeof scholarship !== 'object') {
    errors.push('Scholarship must be a valid object');
    return { valid: false, errors };
  }
  
  if (!scholarship.name && !scholarship.eligibility && !scholarship.description) {
    errors.push('Scholarship must have at least name, eligibility, or description');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Extract funding keywords from scholarship text
 * @param {Object} scholarship - The scholarship object
 * @returns {Object} - Extracted keywords and indicators
 */
export const extractFundingKeywords = (scholarship) => {
  const text = `${scholarship.name || ''} ${scholarship.eligibility || ''} ${scholarship.description || ''}`.toLowerCase();
  
  const fullFundingKeywords = [
    'full funding', 'fully funded', 'full scholarship', 'tuition and living',
    'tuition + stipend', 'tuition and stipend', 'living allowance',
    'accommodation provided', 'travel allowance', 'insurance covered',
    'monthly stipend', 'living expenses covered'
  ];
  
  const partialFundingKeywords = [
    'tuition only', 'partial funding', 'tuition waiver', 'fee waiver',
    'tuition reduction', 'partial scholarship'
  ];
  
  const foundFullKeywords = fullFundingKeywords.filter(keyword => text.includes(keyword));
  const foundPartialKeywords = partialFundingKeywords.filter(keyword => text.includes(keyword));
  
  return {
    fullFundingKeywords: foundFullKeywords,
    partialFundingKeywords: foundPartialKeywords,
    hasFullFundingIndicators: foundFullKeywords.length > 0,
    hasPartialFundingIndicators: foundPartialKeywords.length > 0,
    keywordBasedPrediction: foundPartialKeywords.length > 0 ? false : foundFullKeywords.length > 0
  };
};

export default {
  classifyFunding,
  batchClassifyFunding,
  testFundingClassification,
  validateClassification,
  getFundingSchema,
  formatClassificationForDisplay,
  getFundingBadgeColor,
  getFundingStatusText,
  validateScholarshipForClassification,
  extractFundingKeywords
};
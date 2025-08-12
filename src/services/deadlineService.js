import apiClient from './apiClient.js';

/**
 * Parse a single deadline text
 * @param {string} text - The deadline text to parse
 * @returns {Promise<Object>} - Parsed deadline result
 */
export const parseDeadline = async (text) => {
  try {
    const response = await apiClient.post('/deadline/parse', { text });
    return response.data;
  } catch (error) {
    console.error('Error parsing deadline:', error);
    throw new Error(error.response?.data?.error || 'Failed to parse deadline');
  }
};

/**
 * Parse deadline using AI only
 * @param {string} text - The deadline text to parse
 * @returns {Promise<Object>} - Parsed deadline result
 */
export const parseDeadlineWithAI = async (text) => {
  try {
    const response = await apiClient.post('/deadline/parse-ai', { text });
    return response.data;
  } catch (error) {
    console.error('Error parsing deadline with AI:', error);
    throw new Error(error.response?.data?.error || 'Failed to parse deadline with AI');
  }
};

/**
 * Parse deadline using rule-based approach only
 * @param {string} text - The deadline text to parse
 * @returns {Promise<Object>} - Parsed deadline result
 */
export const parseDeadlineWithRules = async (text) => {
  try {
    const response = await apiClient.post('/deadline/parse-rules', { text });
    return response.data;
  } catch (error) {
    console.error('Error parsing deadline with rules:', error);
    throw new Error(error.response?.data?.error || 'Failed to parse deadline with rules');
  }
};

/**
 * Parse multiple deadline texts in batch
 * @param {string[]} texts - Array of deadline texts to parse
 * @returns {Promise<Object>} - Batch parsing results
 */
export const batchParseDeadlines = async (texts) => {
  try {
    const response = await apiClient.post('/deadline/batch-parse', { texts });
    return response.data;
  } catch (error) {
    console.error('Error batch parsing deadlines:', error);
    throw new Error(error.response?.data?.error || 'Failed to batch parse deadlines');
  }
};

/**
 * Test deadline parsing with sample data
 * @returns {Promise<Object>} - Test results
 */
export const testDeadlineParsing = async () => {
  try {
    const response = await apiClient.get('/deadline/test');
    return response.data;
  } catch (error) {
    console.error('Error testing deadline parsing:', error);
    throw new Error(error.response?.data?.error || 'Failed to test deadline parsing');
  }
};

/**
 * Validate a parsed deadline result
 * @param {string} deadline - The parsed deadline to validate
 * @param {string} originalText - The original text (optional)
 * @returns {Promise<Object>} - Validation result
 */
export const validateDeadline = async (deadline, originalText = null) => {
  try {
    const response = await apiClient.post('/deadline/validate', {
      deadline,
      originalText
    });
    return response.data;
  } catch (error) {
    console.error('Error validating deadline:', error);
    throw new Error(error.response?.data?.error || 'Failed to validate deadline');
  }
};

/**
 * Get deadline parsing schema
 * @returns {Promise<Object>} - Schema information
 */
export const getDeadlineParsingSchema = async () => {
  try {
    const response = await apiClient.get('/deadline/schema');
    return response.data;
  } catch (error) {
    console.error('Error getting deadline parsing schema:', error);
    throw new Error(error.response?.data?.error || 'Failed to get schema');
  }
};

// Utility functions

/**
 * Format deadline for display
 * @param {string} deadline - The deadline string
 * @returns {string} - Formatted deadline
 */
export const formatDeadlineForDisplay = (deadline) => {
  if (!deadline) return 'Unknown';
  
  if (deadline === 'varies') {
    return 'Varies';
  }
  
  try {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) {
      return deadline;
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return deadline;
  }
};

/**
 * Get deadline status (upcoming, past, varies)
 * @param {string} deadline - The deadline string
 * @returns {string} - Status string
 */
export const getDeadlineStatus = (deadline) => {
  if (!deadline) return 'unknown';
  
  if (deadline === 'varies') {
    return 'varies';
  }
  
  try {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) {
      return 'invalid';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return 'past';
    } else {
      return 'upcoming';
    }
  } catch (error) {
    return 'invalid';
  }
};

/**
 * Get deadline urgency level
 * @param {string} deadline - The deadline string
 * @returns {string} - Urgency level (critical, high, medium, low, varies)
 */
export const getDeadlineUrgency = (deadline) => {
  if (!deadline || deadline === 'varies') {
    return 'varies';
  }
  
  try {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) {
      return 'unknown';
    }
    
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'past';
    } else if (diffDays <= 7) {
      return 'critical';
    } else if (diffDays <= 30) {
      return 'high';
    } else if (diffDays <= 90) {
      return 'medium';
    } else {
      return 'low';
    }
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Get urgency color for UI
 * @param {string} urgency - The urgency level
 * @returns {string} - CSS color class or hex color
 */
export const getUrgencyColor = (urgency) => {
  const colors = {
    critical: '#ef4444', // red-500
    high: '#f97316',     // orange-500
    medium: '#eab308',   // yellow-500
    low: '#22c55e',      // green-500
    varies: '#6b7280',   // gray-500
    past: '#9ca3af',     // gray-400
    unknown: '#6b7280'   // gray-500
  };
  
  return colors[urgency] || colors.unknown;
};

/**
 * Get days until deadline
 * @param {string} deadline - The deadline string
 * @returns {number|null} - Days until deadline (null for varies/invalid)
 */
export const getDaysUntilDeadline = (deadline) => {
  if (!deadline || deadline === 'varies') {
    return null;
  }
  
  try {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    return null;
  }
};

/**
 * Validate deadline format
 * @param {string} deadline - The deadline string to validate
 * @returns {boolean} - Whether the deadline format is valid
 */
export const isValidDeadlineFormat = (deadline) => {
  if (!deadline || typeof deadline !== 'string') {
    return false;
  }
  
  if (deadline === 'varies') {
    return true;
  }
  
  // Check ISO format
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoPattern.test(deadline)) {
    return false;
  }
  
  try {
    const date = new Date(deadline);
    return date instanceof Date && !isNaN(date) && date.toISOString().slice(0, 10) === deadline;
  } catch (error) {
    return false;
  }
};

/**
 * Extract potential deadline keywords from text
 * @param {string} text - The text to analyze
 * @returns {string[]} - Array of found keywords
 */
export const extractDeadlineKeywords = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const keywords = [
    'deadline', 'due', 'apply by', 'application deadline', 'closing date',
    'submission deadline', 'final date', 'last date', 'expires',
    'varies', 'rolling', 'ongoing', 'continuous', 'open',
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  const lowerText = text.toLowerCase();
  const foundKeywords = [];
  
  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }
  
  return foundKeywords;
};

export default {
  parseDeadline,
  parseDeadlineWithAI,
  parseDeadlineWithRules,
  batchParseDeadlines,
  testDeadlineParsing,
  validateDeadline,
  getDeadlineParsingSchema,
  formatDeadlineForDisplay,
  getDeadlineStatus,
  getDeadlineUrgency,
  getUrgencyColor,
  getDaysUntilDeadline,
  isValidDeadlineFormat,
  extractDeadlineKeywords
};
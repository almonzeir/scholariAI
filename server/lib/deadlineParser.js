import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Parse deadline text using Gemini AI
 * @param {string} deadlineText - The deadline section text to parse
 * @returns {Promise<{deadline: string}>} - Parsed deadline in ISO format or "varies"
 */
export async function parseDeadlineWithAI(deadlineText) {
  try {
    const systemPrompt = `Parse the application deadline into ISO YYYY-MM-DD or "varies". If multiple deadlines exist, pick the closest upcoming. Return JSON only: { "deadline": "YYYY-MM-DD"|"varies" }.`;
    
    const userPrompt = `TEXT:\n\n${deadlineText}`;
    
    const prompt = `${systemPrompt}\n\n${userPrompt}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean and parse JSON response
    const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    // Validate response format
    if (!parsed.deadline || typeof parsed.deadline !== 'string') {
      throw new Error('Invalid response format from AI');
    }
    
    // Validate deadline format
    if (parsed.deadline !== 'varies' && !isValidISODate(parsed.deadline)) {
      throw new Error('Invalid deadline format');
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing deadline with AI:', error);
    throw new Error(`Failed to parse deadline: ${error.message}`);
  }
}

/**
 * Parse deadline text using rule-based approach as fallback
 * @param {string} deadlineText - The deadline section text to parse
 * @returns {Promise<{deadline: string}>} - Parsed deadline in ISO format or "varies"
 */
export async function parseDeadlineRuleBased(deadlineText) {
  try {
    const text = deadlineText.toLowerCase().trim();
    
    // Check for "varies" indicators
    const variesKeywords = [
      'varies', 'rolling', 'ongoing', 'continuous', 'open',
      'no deadline', 'flexible', 'year-round', 'anytime'
    ];
    
    if (variesKeywords.some(keyword => text.includes(keyword))) {
      return { deadline: 'varies' };
    }
    
    // Extract dates using regex patterns
    const datePatterns = [
      // ISO format: YYYY-MM-DD
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,
      // US format: MM/DD/YYYY or MM-DD-YYYY
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/g,
      // European format: DD/MM/YYYY or DD-MM-YYYY
      /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/g,
      // Month DD, YYYY
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
      // DD Month YYYY
      /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/gi
    ];
    
    const foundDates = [];
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();
    
    // Extract all potential dates
    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let dateStr = null;
        
        if (pattern.source.includes('january|february')) {
          // Handle month name formats
          const monthNames = {
            january: '01', february: '02', march: '03', april: '04',
            may: '05', june: '06', july: '07', august: '08',
            september: '09', october: '10', november: '11', december: '12'
          };
          
          if (match[1] && isNaN(match[1])) {
            // Month DD, YYYY format
            const month = monthNames[match[1].toLowerCase()];
            const day = match[2].padStart(2, '0');
            const year = match[3];
            dateStr = `${year}-${month}-${day}`;
          } else {
            // DD Month YYYY format
            const day = match[1].padStart(2, '0');
            const month = monthNames[match[2].toLowerCase()];
            const year = match[3];
            dateStr = `${year}-${month}-${day}`;
          }
        } else if (match[0].includes('-') && match[1].length === 4) {
          // ISO format: YYYY-MM-DD
          const year = match[1];
          const month = match[2].padStart(2, '0');
          const day = match[3].padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else {
          // US/European format: MM/DD/YYYY or DD/MM/YYYY
          const part1 = match[1];
          const part2 = match[2];
          const year = match[3];
          
          // Assume US format (MM/DD/YYYY) by default
          const month = part1.padStart(2, '0');
          const day = part2.padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }
        
        if (dateStr && isValidISODate(dateStr)) {
          const date = new Date(dateStr);
          if (date.getFullYear() >= currentYear) {
            foundDates.push({ dateStr, date });
          }
        }
      }
    }
    
    if (foundDates.length === 0) {
      return { deadline: 'varies' };
    }
    
    // Sort dates and find the closest upcoming one
    foundDates.sort((a, b) => a.date - b.date);
    
    // Find the closest upcoming deadline
    const upcomingDeadlines = foundDates.filter(d => d.date >= currentDate);
    
    if (upcomingDeadlines.length > 0) {
      return { deadline: upcomingDeadlines[0].dateStr };
    } else {
      // If no upcoming deadlines, return the latest one (might be for next year)
      return { deadline: foundDates[foundDates.length - 1].dateStr };
    }
    
  } catch (error) {
    console.error('Error parsing deadline with rules:', error);
    return { deadline: 'varies' };
  }
}

/**
 * Main deadline parsing function with AI and fallback
 * @param {string} deadlineText - The deadline section text to parse
 * @returns {Promise<{deadline: string}>} - Parsed deadline in ISO format or "varies"
 */
export async function parseDeadline(deadlineText) {
  if (!deadlineText || typeof deadlineText !== 'string') {
    return { deadline: 'varies' };
  }
  
  try {
    // Try AI parsing first
    return await parseDeadlineWithAI(deadlineText);
  } catch (error) {
    console.warn('AI parsing failed, falling back to rule-based parsing:', error.message);
    
    try {
      // Fallback to rule-based parsing
      return await parseDeadlineRuleBased(deadlineText);
    } catch (fallbackError) {
      console.error('Both AI and rule-based parsing failed:', fallbackError);
      return { deadline: 'varies' };
    }
  }
}

/**
 * Validate ISO date format
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} - Whether the date is valid ISO format
 */
function isValidISODate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date) && date.toISOString().slice(0, 10) === dateStr;
}

/**
 * Test deadline parsing with sample data
 * @returns {Promise<Object>} - Test results
 */
export async function testDeadlineParsing() {
  const testCases = [
    {
      name: 'ISO Format',
      text: 'Application deadline: 2024-12-31',
      expected: '2024-12-31'
    },
    {
      name: 'US Format',
      text: 'Deadline is 12/31/2024',
      expected: '2024-12-31'
    },
    {
      name: 'Month Name Format',
      text: 'Applications due December 31, 2024',
      expected: '2024-12-31'
    },
    {
      name: 'Multiple Dates',
      text: 'Early deadline: January 15, 2024. Final deadline: March 31, 2024',
      expected: '2024-01-15' // Should pick the closest upcoming
    },
    {
      name: 'Rolling Admission',
      text: 'Rolling admissions - applications accepted year-round',
      expected: 'varies'
    },
    {
      name: 'Varies Keyword',
      text: 'Deadline varies by program',
      expected: 'varies'
    }
  ];
  
  const results = {
    total: testCases.length,
    passed: 0,
    failed: 0,
    details: []
  };
  
  for (const testCase of testCases) {
    try {
      const result = await parseDeadline(testCase.text);
      const passed = result.deadline === testCase.expected;
      
      results.details.push({
        name: testCase.name,
        input: testCase.text,
        expected: testCase.expected,
        actual: result.deadline,
        passed
      });
      
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.details.push({
        name: testCase.name,
        input: testCase.text,
        expected: testCase.expected,
        actual: null,
        error: error.message,
        passed: false
      });
      results.failed++;
    }
  }
  
  return results;
}

/**
 * Get deadline parsing schema
 * @returns {Object} - Schema information
 */
export function getDeadlineParsingSchema() {
  return {
    input: {
      type: 'string',
      description: 'Deadline section text to parse',
      example: 'Application deadline: December 31, 2024'
    },
    output: {
      type: 'object',
      properties: {
        deadline: {
          type: 'string',
          pattern: '^(\\d{4}-\\d{2}-\\d{2}|varies)$',
          description: 'Parsed deadline in ISO YYYY-MM-DD format or "varies"',
          examples: ['2024-12-31', 'varies']
        }
      },
      required: ['deadline']
    },
    rules: [
      'Parse application deadline into ISO YYYY-MM-DD or "varies"',
      'If multiple deadlines exist, pick the closest upcoming',
      'Return "varies" for rolling admissions, ongoing applications, or unclear deadlines',
      'Validate date format and ensure it\'s a valid calendar date',
      'Handle various date formats: ISO, US (MM/DD/YYYY), European (DD/MM/YYYY), month names'
    ]
  };
}

export default {
  parseDeadline,
  parseDeadlineWithAI,
  parseDeadlineRuleBased,
  testDeadlineParsing,
  getDeadlineParsingSchema
};
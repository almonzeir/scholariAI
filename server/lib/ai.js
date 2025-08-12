// server/lib/ai.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateGeminiResponse, detectPotentialHallucinations, assessExtractionQuality } from './validation.js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * CV → JSON normalization using Gemini
 * @param {string} cvText - Extracted text from PDF CV
 * @returns {Promise<Object>} - Normalized profile object
 */
async function callGeminiParseCV(cvText) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a JSON-only API. From the provided CV text, return exactly the JSON object matching this schema. If a value is unknown, set it to null. Never invent data. Output JSON only, no prose.

Schema:
{
  "name": string|null,
  "nationality": string|null,
  "degreeTarget": "Bachelor"|"Master"|"PhD"|null,
  "field": string|null,
  "gpa": string|null,
  "certifications": string[],
  "specialStatus": string|null,
  "languages": string[]
}

CV Text:
${cvText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    
    // Validate and clean the response for strict JSON compliance
    const validatedProfile = validateGeminiResponse(rawText);
    
    // Detect potential hallucinations
    const hallucinations = detectPotentialHallucinations(cvText, validatedProfile);
    
    // Assess extraction quality
    const quality = assessExtractionQuality(validatedProfile, hallucinations);
    
    // Log quality assessment for monitoring
    console.log(`CV Extraction Quality: ${quality.grade} (${quality.score}/100)`);
    if (hallucinations.length > 0) {
      console.warn('Potential hallucinations detected:', hallucinations.map(h => `${h.field}: ${h.reason}`));
    }
    
    // Return validated profile with metadata
    return {
      ...validatedProfile,
      _metadata: {
        quality,
        hallucinations,
        extractedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Gemini CV parsing error:', error);
    throw new Error('Failed to parse CV with AI');
  }
}

/**
 * Scholarship ranking using Gemini
 * @param {Object} profile - User profile
 * @param {Array} candidates - Array of scholarship candidates
 * @returns {Promise<Array>} - Ranked scholarships with fit scores
 */
async function callGeminiRank(profile, candidates) {
  try {
    // If no candidates, return empty array
    if (!candidates || candidates.length === 0) {
      return [];
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are a scholarship matching expert. Rank these scholarships for the given profile.

Profile:
${JSON.stringify(profile, null, 2)}

Scholarships:
${JSON.stringify(candidates, null, 2)}

Return a JSON array of scholarships with fitScore (0-1) added to each:
[
  {
    "id": "original_id",
    "name": "scholarship_name",
    "country": "country",
    "degree": "Bachelor"|"Master"|"PhD"|"Any",
    "eligibility": "requirements (≤180 chars)",
    "deadline": "YYYY-MM-DD" or "varies",
    "link": "official_url",
    "source": "domain",
    "fitScore": 0.95
  }
]

Ranking criteria:
- Degree match (exact > Any)
- Field relevance
- Nationality/location eligibility
- GPA requirements
- Special status advantages
- Language requirements
- Deadline proximity

Return ONLY valid JSON array, sorted by fitScore descending.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini ranking error:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Generate scholarship search queries using Gemini
 * @param {Object} profile - User profile
 * @returns {Promise<Array>} - Array of search query strings
 */
async function generateSearchQueries(profile) {
  try {
    const model = genAI.getGenerativeAI({ model: 'gemini-pro' });
    
    const prompt = `Generate 5-7 specific scholarship search queries for this profile:

${JSON.stringify(profile, null, 2)}

Return a JSON array of search strings optimized for scholarship databases:
[
  "computer science scholarships international students",
  "PhD funding artificial intelligence Europe",
  "merit scholarships high GPA engineering"
]

Focus on:
- Degree level + field combination
- Nationality/geographic preferences
- Special statuses or qualifications
- Merit vs need-based opportunities

Return ONLY the JSON array.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Query generation error:', error);
    return [];
  }
}

export {
  callGeminiParseCV,
  callGeminiRank,
  generateSearchQueries
};
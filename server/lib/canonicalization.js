import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Canonicalize degree and field using controlled vocabulary
 * @param {string} freeTextDegree - Free text degree input
 * @param {string} freeTextField - Free text field input
 * @returns {Promise<{degreeTarget: string|null, field: string|null}>}
 */
export async function canonicalizeDegreeField(freeTextDegree, freeTextField) {
  const systemPrompt = `You normalize free text to a controlled vocabulary and output JSON only.

Map degree to: "Bachelor"|"Master"|"PhD"|null.

Map field to a compact canonical label (e.g., "Electrical Engineering", "Computer Science", "Public Health", "Development Studies"). Use best match; else null.
Return: { "degreeTarget": "...", "field": "..." }`;

  const userPrompt = `INPUT: { "degreeTarget": "${freeTextDegree}", "field": "${freeTextField}" }
OUTPUT JSON only with normalized values.`;

  try {
    const result = await model.generateContent([
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'user', parts: [{ text: userPrompt }] }
    ]);

    const response = result.response;
    const text = response.text();
    
    // Clean and parse JSON response
    const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    // Validate the response structure
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid response structure');
    }
    
    // Ensure degreeTarget is valid or null
    const validDegrees = ['Bachelor', 'Master', 'PhD'];
    const degreeTarget = validDegrees.includes(parsed.degreeTarget) ? parsed.degreeTarget : null;
    
    // Ensure field is string or null
    const field = typeof parsed.field === 'string' && parsed.field.trim() ? parsed.field.trim() : null;
    
    return {
      degreeTarget,
      field
    };
    
  } catch (error) {
    console.error('Canonicalization error:', error);
    throw new Error(`Failed to canonicalize degree and field: ${error.message}`);
  }
}

/**
 * Batch canonicalize multiple degree/field pairs
 * @param {Array<{degreeTarget: string, field: string}>} inputs
 * @returns {Promise<Array<{degreeTarget: string|null, field: string|null}>>}
 */
export async function batchCanonicalizeDegreeField(inputs) {
  const results = [];
  
  for (const input of inputs) {
    try {
      const result = await canonicalizeDegreeField(input.degreeTarget, input.field);
      results.push(result);
    } catch (error) {
      console.error(`Failed to canonicalize input:`, input, error);
      results.push({ degreeTarget: null, field: null });
    }
  }
  
  return results;
}

/**
 * Test the canonicalization with sample data
 */
export async function testCanonicalization() {
  const testCases = [
    { degreeTarget: 'bachelor of science', field: 'computer science' },
    { degreeTarget: 'masters', field: 'electrical eng' },
    { degreeTarget: 'doctorate', field: 'public health' },
    { degreeTarget: 'BS', field: 'CS' },
    { degreeTarget: 'phd', field: 'development studies' },
    { degreeTarget: 'undergraduate', field: 'software engineering' },
    { degreeTarget: 'graduate', field: 'data science' }
  ];
  
  console.log('Testing canonicalization...');
  
  for (const testCase of testCases) {
    try {
      const result = await canonicalizeDegreeField(testCase.degreeTarget, testCase.field);
      console.log(`Input: ${JSON.stringify(testCase)} -> Output: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error(`Test failed for ${JSON.stringify(testCase)}:`, error.message);
    }
  }
}
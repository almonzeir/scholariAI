// 🤖 Google Gemini AI Service
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Get the Gemini Pro model
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Scholarship matching service
export class GeminiScholarshipService {
  /**
   * Generate scholarship matches based on user profile
   * @param {Object} profile - User profile data
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} - Array of scholarship matches
   */
  static async findScholarships(profile, filters = {}) {
    try {
      const prompt = this.buildScholarshipPrompt(profile, filters);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the AI response into structured scholarship data
      return this.parseScholarshipResponse(text);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to generate scholarship matches: ${error.message}`);
    }
  }

  /**
   * Build the prompt for scholarship matching
   * @param {Object} profile - User profile
   * @param {Object} filters - Search filters
   * @returns {string} - Formatted prompt
   */
  static buildScholarshipPrompt(profile, filters) {
    const {
      name = 'Student',
      degree = '',
      fieldOfStudy = '',
      gpa = '',
      country = '',
      skills = [],
      experience = [],
      achievements = []
    } = profile;

    const {
      targetCountry = 'any',
      degreeLevel = 'any',
      minAmount = 0,
      maxAmount = 'unlimited'
    } = filters;

    return `
You are an expert scholarship advisor. Based on the following student profile, find and recommend 20-25 relevant scholarships.

**STUDENT PROFILE:**
- Name: ${name}
- Degree: ${degree}
- Field of Study: ${fieldOfStudy}
- GPA: ${gpa}
- Country: ${country}
- Skills: ${skills.join(', ')}
- Experience: ${experience.map(exp => exp.title || exp).join(', ')}
- Achievements: ${achievements.join(', ')}

**SEARCH CRITERIA:**
- Target Country: ${targetCountry}
- Degree Level: ${degreeLevel}
- Amount Range: $${minAmount} - ${maxAmount}

**REQUIREMENTS:**
1. Focus on FULLY FUNDED scholarships when possible
2. Include scholarships from reputable organizations, universities, and governments
3. Ensure scholarships match the student's field of study and academic level
4. Include both merit-based and need-based opportunities
5. Provide realistic deadlines (future dates)

**OUTPUT FORMAT (JSON):**
Return ONLY a valid JSON array with this exact structure:

[
  {
    "id": "unique_id",
    "title": "Scholarship Name",
    "provider": "Organization/University Name",
    "amount": "$X,XXX - $XX,XXX" or "Full Tuition" or "Living Expenses Covered",
    "deadline": "YYYY-MM-DD",
    "country": "Target Country",
    "degreeLevel": "Bachelor's/Master's/PhD",
    "fieldOfStudy": ["Field1", "Field2"],
    "eligibility": ["Requirement 1", "Requirement 2", "Requirement 3"],
    "description": "Brief description of the scholarship and its benefits",
    "applicationUrl": "https://example.com/apply",
    "matchScore": 85
  }
]

**IMPORTANT:** Return ONLY the JSON array, no additional text or formatting.
`;
  }

  /**
   * Parse AI response into structured scholarship data
   * @param {string} response - Raw AI response
   * @returns {Array} - Parsed scholarship array
   */
  static parseScholarshipResponse(response) {
    try {
      // Clean the response to extract JSON
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON array in the response
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }
      
      const scholarships = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance scholarship data
      return scholarships.map((scholarship, index) => ({
        id: scholarship.id || `scholarship_${Date.now()}_${index}`,
        title: scholarship.title || 'Unnamed Scholarship',
        provider: scholarship.provider || 'Unknown Provider',
        amount: scholarship.amount || 'Amount not specified',
        deadline: scholarship.deadline || '2024-12-31',
        country: scholarship.country || 'International',
        degreeLevel: scholarship.degreeLevel || 'All Levels',
        fieldOfStudy: Array.isArray(scholarship.fieldOfStudy) 
          ? scholarship.fieldOfStudy 
          : [scholarship.fieldOfStudy || 'All Fields'],
        eligibility: Array.isArray(scholarship.eligibility) 
          ? scholarship.eligibility 
          : ['General eligibility requirements apply'],
        description: scholarship.description || 'No description available',
        applicationUrl: scholarship.applicationUrl || '#',
        matchScore: scholarship.matchScore || Math.floor(Math.random() * 20) + 70,
        generatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to parse scholarship response:', error);
      
      // Return fallback scholarships if parsing fails
      return this.getFallbackScholarships();
    }
  }

  /**
   * Get fallback scholarships when AI fails
   * @returns {Array} - Fallback scholarship data
   */
  static getFallbackScholarships() {
    return [
      {
        id: 'fallback_1',
        title: 'Global Excellence Scholarship',
        provider: 'International Education Foundation',
        amount: '$10,000 - $25,000',
        deadline: '2024-12-31',
        country: 'Multiple Countries',
        degreeLevel: 'Master\'s',
        fieldOfStudy: ['All Fields'],
        eligibility: ['3.5+ GPA', 'International students', 'Academic excellence'],
        description: 'Merit-based scholarship for outstanding international students pursuing graduate studies.',
        applicationUrl: '#',
        matchScore: 75,
        generatedAt: new Date().toISOString()
      },
      {
        id: 'fallback_2',
        title: 'Future Leaders Scholarship',
        provider: 'Global University Network',
        amount: 'Full Tuition Coverage',
        deadline: '2024-11-30',
        country: 'USA, UK, Canada',
        degreeLevel: 'Bachelor\'s',
        fieldOfStudy: ['STEM', 'Business', 'Social Sciences'],
        eligibility: ['Leadership experience', 'Community involvement', 'Academic merit'],
        description: 'Comprehensive scholarship program for future leaders in various fields.',
        applicationUrl: '#',
        matchScore: 80,
        generatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Test Gemini API connection
   * @returns {Promise<Object>} - Connection test result
   */
  static async testConnection() {
    try {
      const result = await model.generateContent('Hello, please respond with "Gemini API is working!"');
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        message: 'Gemini API connection successful',
        response: text
      };
    } catch (error) {
      return {
        success: false,
        message: `Gemini API connection failed: ${error.message}`
      };
    }
  }
}

export default GeminiScholarshipService;
// src/services/aiService.js
import { ProfileSchema, ScholarshipSchema } from '../lib/schema';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Parse CV file and extract profile information
 * @param {File} cvFile - PDF file to parse
 * @returns {Promise<Object>} - Parsed profile object
 */
export async function parseCVFile(cvFile) {
  try {
    // Validate file type
    if (cvFile.type !== 'application/pdf') {
      throw new Error('Only PDF files are supported');
    }

    // Validate file size (8MB max)
    if (cvFile.size > 8 * 1024 * 1024) {
      throw new Error('File size must be less than 8MB');
    }

    const formData = new FormData();
    formData.append('cvFile', cvFile);

    const response = await fetch(`${API_BASE_URL}/parse-cv`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to parse CV');
    }

    const data = await response.json();
    
    // Extract profile and metadata
    const { profile, quality, extractedAt, warnings } = data;
    
    // Validate profile with Zod schema
    const validatedProfile = ProfileSchema.parse(profile);
    
    // Return profile with quality information
    return {
      ...validatedProfile,
      _metadata: {
        quality,
        extractedAt,
        warnings: warnings || []
      }
    };
  } catch (error) {
    console.error('CV parsing error:', error);
    throw error;
  }
}

/**
 * Match scholarships for a given profile
 * @param {Object} profile - User profile object
 * @param {Object} filters - Optional filters for matching
 * @returns {Promise<Array>} - Array of matched scholarships
 */
export async function matchScholarships(profile, filters = {}) {
  try {
    // Validate profile with Zod schema
    const validProfile = ProfileSchema.parse(profile);

    const response = await fetch(`${API_BASE_URL}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile: validProfile,
        filters,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to match scholarships');
    }

    const scholarships = await response.json();
    
    // Validate each scholarship with Zod schema
    return scholarships.map(scholarship => ScholarshipSchema.parse(scholarship));
  } catch (error) {
    console.error('Scholarship matching error:', error);
    throw error;
  }
}

/**
 * Check API health status
 * @returns {Promise<Object>} - Health status object
 */
export async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error('API health check failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API health check error:', error);
    throw error;
  }
}

/**
 * Utility function to create a mock profile for testing
 * @returns {Object} - Mock profile object
 */
export function createMockProfile() {
  return {
    name: "John Doe",
    nationality: "United States",
    degreeTarget: "Master",
    field: "Computer Science",
    gpa: "3.8",
    certifications: ["AWS Certified", "TOEFL 110"],
    specialStatus: null,
    languages: ["English", "Spanish"]
  };
}

/**
 * Utility function to create mock scholarships for testing
 * @returns {Array} - Array of mock scholarship objects
 */
export function createMockScholarships() {
  return [
    {
      id: "daad-masters-2024",
      name: "DAAD Masters Scholarship",
      country: "Germany",
      degree: "Master",
      eligibility: "International students, Bachelor's degree, German language proficiency",
      deadline: "2024-10-31",
      link: "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
      source: "daad.de",
      fitScore: 0.92
    },
    {
      id: "fulbright-phd-2024",
      name: "Fulbright PhD Fellowship",
      country: "United States",
      degree: "PhD",
      eligibility: "International students, research proposal, English proficiency",
      deadline: "2024-12-15",
      link: "https://www.fulbrightonline.org/",
      source: "fulbrightonline.org",
      fitScore: 0.78
    },
    {
      id: "chevening-masters-2024",
      name: "Chevening Scholarship",
      country: "United Kingdom",
      degree: "Master",
      eligibility: "Leadership potential, work experience, English proficiency",
      deadline: "varies",
      link: "https://www.chevening.org/",
      source: "chevening.org",
      fitScore: 0.85
    }
  ];
}
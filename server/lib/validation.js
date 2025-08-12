// server/lib/validation.js
import { ProfileSchema } from './schema.js';

/**
 * Strict JSON validation utilities for Phase 6.1
 * Ensures zero hallucinations and exact schema compliance
 */

/**
 * Clean and validate Gemini response to ensure strict JSON compliance
 * @param {string} rawResponse - Raw response from Gemini
 * @returns {Object} - Validated profile object
 * @throws {Error} - If response is invalid or contains hallucinations
 */
export function validateGeminiResponse(rawResponse) {
  // Remove any markdown formatting or extra text
  let cleanedResponse = rawResponse.trim();
  
  // Remove markdown code blocks if present
  cleanedResponse = cleanedResponse.replace(/```json\s*|```\s*/g, '');
  
  // Remove any text before the first { or after the last }
  const firstBrace = cleanedResponse.indexOf('{');
  const lastBrace = cleanedResponse.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No valid JSON object found in response');
  }
  
  cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
  
  // Parse JSON
  let parsedResponse;
  try {
    parsedResponse = JSON.parse(cleanedResponse);
  } catch (error) {
    throw new Error(`Invalid JSON format: ${error.message}`);
  }
  
  // Validate structure and types
  const validatedProfile = validateProfileStructure(parsedResponse);
  
  // Final Zod validation
  try {
    return ProfileSchema.parse(validatedProfile);
  } catch (zodError) {
    throw new Error(`Schema validation failed: ${zodError.message}`);
  }
}

/**
 * Validate profile structure and enforce strict typing
 * @param {Object} profile - Raw profile object
 * @returns {Object} - Validated and normalized profile
 */
function validateProfileStructure(profile) {
  const validated = {};
  
  // Required fields with their expected types
  const fieldValidators = {
    name: validateStringOrNull,
    nationality: validateStringOrNull,
    degreeTarget: validateDegreeTarget,
    field: validateStringOrNull,
    gpa: validateStringOrNull,
    certifications: validateStringArray,
    specialStatus: validateStringOrNull,
    languages: validateStringArray
  };
  
  // Validate each field
  for (const [fieldName, validator] of Object.entries(fieldValidators)) {
    if (!(fieldName in profile)) {
      throw new Error(`Missing required field: ${fieldName}`);
    }
    
    try {
      validated[fieldName] = validator(profile[fieldName], fieldName);
    } catch (error) {
      throw new Error(`Field '${fieldName}': ${error.message}`);
    }
  }
  
  // Check for unexpected fields
  const allowedFields = Object.keys(fieldValidators);
  const unexpectedFields = Object.keys(profile).filter(field => !allowedFields.includes(field));
  
  if (unexpectedFields.length > 0) {
    throw new Error(`Unexpected fields found: ${unexpectedFields.join(', ')}`);
  }
  
  return validated;
}

/**
 * Validate string or null field
 */
function validateStringOrNull(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value !== 'string') {
    throw new Error(`must be string or null, got ${typeof value}`);
  }
  
  // Trim whitespace and convert empty strings to null
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Validate degree target enum
 */
function validateDegreeTarget(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }
  
  const validDegrees = ['Bachelor', 'Master', 'PhD'];
  
  if (!validDegrees.includes(value)) {
    throw new Error(`must be one of [${validDegrees.join(', ')}] or null, got "${value}"`);
  }
  
  return value;
}

/**
 * Validate string array field
 */
function validateStringArray(value, fieldName) {
  if (value === null || value === undefined) {
    return [];
  }
  
  if (!Array.isArray(value)) {
    throw new Error(`must be an array, got ${typeof value}`);
  }
  
  // Validate each item is a string and filter out empty strings
  const validatedArray = [];
  
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    
    if (typeof item !== 'string') {
      throw new Error(`array item at index ${i} must be string, got ${typeof item}`);
    }
    
    const trimmed = item.trim();
    if (trimmed !== '') {
      validatedArray.push(trimmed);
    }
  }
  
  return validatedArray;
}

/**
 * Detect potential hallucinations by checking if extracted data appears in source text
 * @param {string} sourceText - Original CV text
 * @param {Object} extractedProfile - Extracted profile data
 * @returns {Array} - Array of potential hallucination warnings
 */
export function detectPotentialHallucinations(sourceText, extractedProfile) {
  const warnings = [];
  const sourceLower = sourceText.toLowerCase();
  
  // Check name
  if (extractedProfile.name) {
    const nameParts = extractedProfile.name.toLowerCase().split(' ');
    const nameFound = nameParts.some(part => 
      part.length > 2 && sourceLower.includes(part)
    );
    
    if (!nameFound) {
      warnings.push({
        field: 'name',
        value: extractedProfile.name,
        reason: 'Name not found in source text'
      });
    }
  }
  
  // Check nationality
  if (extractedProfile.nationality) {
    const nationalityLower = extractedProfile.nationality.toLowerCase();
    const nationalityKeywords = [
      nationalityLower,
      'citizen',
      'citizenship',
      'nationality',
      'passport',
      'born in',
      'from '
    ];
    
    const nationalityFound = nationalityKeywords.some(keyword => 
      sourceLower.includes(keyword)
    );
    
    if (!nationalityFound) {
      warnings.push({
        field: 'nationality',
        value: extractedProfile.nationality,
        reason: 'Nationality not clearly indicated in source text'
      });
    }
  }
  
  // Check GPA
  if (extractedProfile.gpa) {
    const gpaFound = sourceLower.includes(extractedProfile.gpa.toLowerCase()) ||
                   sourceLower.includes('gpa') ||
                   sourceLower.includes('grade');
    
    if (!gpaFound) {
      warnings.push({
        field: 'gpa',
        value: extractedProfile.gpa,
        reason: 'GPA value not found in source text'
      });
    }
  }
  
  // Check certifications
  for (const cert of extractedProfile.certifications || []) {
    const certLower = cert.toLowerCase();
    const certFound = sourceLower.includes(certLower) ||
                     // Check for partial matches for common certifications
                     (certLower.includes('aws') && sourceLower.includes('aws')) ||
                     (certLower.includes('ielts') && sourceLower.includes('ielts')) ||
                     (certLower.includes('toefl') && sourceLower.includes('toefl'));
    
    if (!certFound) {
      warnings.push({
        field: 'certifications',
        value: cert,
        reason: 'Certification not clearly mentioned in source text'
      });
    }
  }
  
  // Check languages
  for (const lang of extractedProfile.languages || []) {
    const langLower = lang.toLowerCase();
    const langFound = sourceLower.includes(langLower) ||
                     sourceLower.includes('language') ||
                     sourceLower.includes('fluent') ||
                     sourceLower.includes('native');
    
    if (!langFound && !isCommonLanguage(langLower)) {
      warnings.push({
        field: 'languages',
        value: lang,
        reason: 'Language not mentioned in source text'
      });
    }
  }
  
  return warnings;
}

/**
 * Check if a language is commonly inferred (like English for English CVs)
 */
function isCommonLanguage(language) {
  const commonLanguages = ['english', 'spanish', 'french', 'german', 'chinese', 'arabic'];
  return commonLanguages.includes(language);
}

/**
 * Generate a quality score for the extraction
 * @param {Object} profile - Extracted profile
 * @param {Array} warnings - Hallucination warnings
 * @returns {Object} - Quality assessment
 */
export function assessExtractionQuality(profile, warnings = []) {
  let score = 100;
  const issues = [];
  
  // Deduct points for missing critical fields
  const criticalFields = ['name', 'nationality', 'degreeTarget', 'field'];
  const missingCritical = criticalFields.filter(field => !profile[field]);
  
  score -= missingCritical.length * 15;
  if (missingCritical.length > 0) {
    issues.push(`Missing critical fields: ${missingCritical.join(', ')}`);
  }
  
  // Deduct points for potential hallucinations
  score -= warnings.length * 10;
  if (warnings.length > 0) {
    issues.push(`${warnings.length} potential hallucination(s) detected`);
  }
  
  // Bonus points for completeness
  const completedFields = Object.values(profile).filter(value => 
    value !== null && (Array.isArray(value) ? value.length > 0 : true)
  ).length;
  
  const completenessBonus = Math.min(completedFields * 2, 10);
  score += completenessBonus;
  
  return {
    score: Math.max(0, Math.min(100, score)),
    completedFields,
    totalFields: 8,
    issues,
    warnings,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
  };
}
// server/test/cv-normalization.test.js
import { callGeminiParseCV } from '../lib/ai.js';
import { ProfileSchema } from '../../src/lib/schema.js';

/**
 * Test suite for CV normalization with strict JSON output and zero hallucinations
 * Phase 6.1 Requirements:
 * - Exact schema compliance
 * - null for unknown values
 * - No data invention
 * - JSON-only output
 */

// Test CV samples with varying completeness
const testCVs = {
  complete: `
    John Smith
    Nationality: Canadian
    Email: john.smith@email.com
    Phone: +1-555-0123
    
    EDUCATION
    Master of Science in Computer Science
    University of Toronto, 2022
    GPA: 3.85/4.0
    
    Bachelor of Engineering in Software Engineering
    University of Waterloo, 2020
    GPA: 3.7/4.0
    
    CERTIFICATIONS
    - AWS Certified Solutions Architect
    - IELTS Academic: 8.5
    - PMP Certification
    
    LANGUAGES
    - English (Native)
    - French (Fluent)
    - Spanish (Intermediate)
    
    EXPERIENCE
    Software Engineer at Google, 2022-Present
    Intern at Microsoft, Summer 2021
  `,
  
  minimal: `
    Maria Garcia
    Computer Science Student
    University of Madrid
    Spanish citizen
  `,
  
  incomplete: `
    Ahmed Hassan
    Engineering background
    Looking for PhD opportunities
    TOEFL: 95
    Arabic, English
  `,
  
  ambiguous: `
    Alex Johnson
    Recent graduate
    Technology field
    Good grades
    Multilingual
  `,
  
  empty: `
    Resume
    
    [No content provided]
  `
};

/**
 * Validate that response matches exact schema requirements
 */
function validateStrictSchema(response) {
  const errors = [];
  
  // Check required structure
  const requiredFields = ['name', 'nationality', 'degreeTarget', 'field', 'gpa', 'certifications', 'specialStatus', 'languages'];
  for (const field of requiredFields) {
    if (!(field in response)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check data types
  const stringOrNullFields = ['name', 'nationality', 'field', 'gpa', 'specialStatus'];
  for (const field of stringOrNullFields) {
    if (response[field] !== null && typeof response[field] !== 'string') {
      errors.push(`Field ${field} must be string or null, got ${typeof response[field]}`);
    }
  }
  
  // Check degreeTarget enum
  const validDegrees = ['Bachelor', 'Master', 'PhD', null];
  if (!validDegrees.includes(response.degreeTarget)) {
    errors.push(`degreeTarget must be one of ${validDegrees.join(', ')}, got ${response.degreeTarget}`);
  }
  
  // Check arrays
  if (!Array.isArray(response.certifications)) {
    errors.push('certifications must be an array');
  } else {
    for (const cert of response.certifications) {
      if (typeof cert !== 'string') {
        errors.push('All certifications must be strings');
        break;
      }
    }
  }
  
  if (!Array.isArray(response.languages)) {
    errors.push('languages must be an array');
  } else {
    for (const lang of response.languages) {
      if (typeof lang !== 'string') {
        errors.push('All languages must be strings');
        break;
      }
    }
  }
  
  return errors;
}

/**
 * Check for potential hallucinations by comparing input and output
 */
function detectHallucinations(cvText, response) {
  const warnings = [];
  const cvLower = cvText.toLowerCase();
  
  // Check if name appears in CV
  if (response.name && !cvLower.includes(response.name.toLowerCase())) {
    warnings.push(`Name "${response.name}" not found in CV text`);
  }
  
  // Check if nationality is mentioned
  if (response.nationality && !cvLower.includes(response.nationality.toLowerCase())) {
    // Check for common nationality indicators
    const nationalityKeywords = ['citizen', 'nationality', 'passport', 'born in'];
    const hasNationalityContext = nationalityKeywords.some(keyword => cvLower.includes(keyword));
    if (!hasNationalityContext) {
      warnings.push(`Nationality "${response.nationality}" may be inferred without clear evidence`);
    }
  }
  
  // Check GPA format
  if (response.gpa && !cvLower.includes(response.gpa)) {
    warnings.push(`GPA "${response.gpa}" not found in original format`);
  }
  
  // Check certifications
  for (const cert of response.certifications || []) {
    if (!cvLower.includes(cert.toLowerCase())) {
      warnings.push(`Certification "${cert}" not clearly mentioned in CV`);
    }
  }
  
  return warnings;
}

/**
 * Run comprehensive test suite
 */
async function runNormalizationTests() {
  console.log('🧪 Starting CV Normalization Test Suite (Phase 6.1)');
  console.log('=' .repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };
  
  for (const [testName, cvText] of Object.entries(testCVs)) {
    console.log(`\n📄 Testing: ${testName.toUpperCase()} CV`);
    console.log('-'.repeat(40));
    
    try {
      // Call Gemini API
      const response = await callGeminiParseCV(cvText);
      console.log('✅ Gemini Response Received');
      
      // Validate JSON structure
      const schemaErrors = validateStrictSchema(response);
      if (schemaErrors.length > 0) {
        console.log('❌ Schema Validation Failed:');
        schemaErrors.forEach(error => console.log(`   - ${error}`));
        results.failed++;
        continue;
      }
      console.log('✅ Schema Validation Passed');
      
      // Validate with Zod
      try {
        ProfileSchema.parse(response);
        console.log('✅ Zod Validation Passed');
      } catch (zodError) {
        console.log('❌ Zod Validation Failed:', zodError.message);
        results.failed++;
        continue;
      }
      
      // Check for hallucinations
      const hallucinations = detectHallucinations(cvText, response);
      if (hallucinations.length > 0) {
        console.log('⚠️  Potential Hallucinations Detected:');
        hallucinations.forEach(warning => console.log(`   - ${warning}`));
        results.warnings += hallucinations.length;
      } else {
        console.log('✅ No Hallucinations Detected');
      }
      
      // Display parsed result
      console.log('📊 Parsed Profile:');
      console.log(JSON.stringify(response, null, 2));
      
      results.passed++;
      
    } catch (error) {
      console.log('❌ Test Failed:', error.message);
      results.failed++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`📊 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! CV normalization system is working correctly.');
  } else {
    console.log('\n🔧 Some tests failed. Please review the Gemini prompt and error handling.');
  }
  
  return results;
}

/**
 * Manual test runner for development
 */
async function testSingleCV(cvText) {
  console.log('🧪 Testing Single CV');
  console.log('Input CV:');
  console.log(cvText);
  console.log('\n' + '-'.repeat(40));
  
  try {
    const response = await callGeminiParseCV(cvText);
    
    console.log('Gemini Response:');
    console.log(JSON.stringify(response, null, 2));
    
    const schemaErrors = validateStrictSchema(response);
    if (schemaErrors.length > 0) {
      console.log('\n❌ Schema Errors:');
      schemaErrors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('\n✅ Schema validation passed');
    }
    
    const hallucinations = detectHallucinations(cvText, response);
    if (hallucinations.length > 0) {
      console.log('\n⚠️  Potential Issues:');
      hallucinations.forEach(warning => console.log(`   - ${warning}`));
    } else {
      console.log('\n✅ No hallucinations detected');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Export for use in other test files
export {
  runNormalizationTests,
  testSingleCV,
  validateStrictSchema,
  detectHallucinations,
  testCVs
};

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runNormalizationTests().catch(console.error);
}
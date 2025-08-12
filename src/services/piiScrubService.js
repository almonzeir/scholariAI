const API_BASE_URL = 'http://localhost:5002/api';

/**
 * Scrub PII from a profile object
 * @param {Object} profile - The profile object to scrub
 * @returns {Promise<Object>} - The scrubbed profile with metadata
 */
export async function scrubProfilePII(profile) {
  try {
    const response = await fetch(`${API_BASE_URL}/pii-scrub/scrub`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error scrubbing profile PII:', error);
    throw error;
  }
}

/**
 * Detect PII in a profile object without scrubbing
 * @param {Object} profile - The profile object to analyze
 * @returns {Promise<Object>} - PII detection results
 */
export async function detectProfilePII(profile) {
  try {
    const response = await fetch(`${API_BASE_URL}/pii-scrub/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error detecting profile PII:', error);
    throw error;
  }
}

/**
 * Batch scrub PII from multiple profiles
 * @param {Array<Object>} profiles - Array of profile objects to scrub
 * @returns {Promise<Object>} - Batch scrubbing results
 */
export async function batchScrubProfilePII(profiles) {
  try {
    if (profiles.length > 50) {
      throw new Error('Maximum 50 profiles allowed per batch');
    }

    const response = await fetch(`${API_BASE_URL}/pii-scrub/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profiles }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error batch scrubbing profile PII:', error);
    throw error;
  }
}

/**
 * Test the PII scrubbing functionality
 * @returns {Promise<Object>} - Test results
 */
export async function testPIIScrubbing() {
  try {
    const response = await fetch(`${API_BASE_URL}/pii-scrub/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error testing PII scrubbing:', error);
    throw error;
  }
}

/**
 * Check if a profile contains PII that should be scrubbed
 * @param {Object} piiDetection - PII detection results
 * @returns {boolean} - True if PII was found
 */
export function hasPII(piiDetection) {
  return piiDetection && piiDetection.hasPII;
}

/**
 * Get a summary of PII found in a profile
 * @param {Object} piiDetection - PII detection results
 * @returns {string} - Human-readable summary
 */
export function getPIISummary(piiDetection) {
  if (!piiDetection || !piiDetection.hasPII) {
    return 'No PII detected';
  }

  const types = [];
  if (piiDetection.hasName) types.push('name');
  if (piiDetection.hasEmail) types.push('email');
  if (piiDetection.hasPhone) types.push('phone');

  return `PII detected: ${types.join(', ')}`;
}

/**
 * Format PII scrubbing results for display
 * @param {Object} original - Original profile
 * @param {Object} scrubbed - Scrubbed profile
 * @param {Object} piiDetection - PII detection results
 * @returns {Object} - Formatted results
 */
export function formatPIIScrubResults(original, scrubbed, piiDetection) {
  return {
    original,
    scrubbed,
    piiDetection,
    summary: getPIISummary(piiDetection),
    hasPII: hasPII(piiDetection),
    fieldsChanged: getChangedFields(original, scrubbed)
  };
}

/**
 * Get list of fields that were changed during scrubbing
 * @param {Object} original - Original profile
 * @param {Object} scrubbed - Scrubbed profile
 * @returns {Array<string>} - List of changed field names
 */
function getChangedFields(original, scrubbed) {
  const changes = [];

  function compareObjects(obj1, obj2, path = '') {
    for (const key in obj1) {
      if (obj1.hasOwnProperty(key)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj2)) {
          changes.push(`${currentPath} (removed)`);
        } else if (typeof obj1[key] === 'object' && obj1[key] !== null) {
          if (Array.isArray(obj1[key])) {
            if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
              changes.push(currentPath);
            }
          } else {
            compareObjects(obj1[key], obj2[key], currentPath);
          }
        } else if (obj1[key] !== obj2[key]) {
          changes.push(currentPath);
        }
      }
    }
  }

  compareObjects(original, scrubbed);
  return changes;
}

/**
 * Create mock profile data for testing
 * @returns {Object} - Mock profile with PII
 */
export function createMockProfileWithPII() {
  return {
    name: "Jane Smith",
    email: "jane.smith@email.com",
    phone: "(555) 123-4567",
    degreeTarget: "Master",
    targetField: "Data Science",
    experience: "Software Engineer at TechCorp. Contact me at jane@techcorp.com or call 555-987-6543 for references.",
    education: "MS in Computer Science from State University. Admissions office: admissions@stateuni.edu",
    skills: ["Python", "Machine Learning", "Contact: jane.personal@gmail.com"],
    projects: [
      {
        title: "ML Pipeline",
        description: "Built machine learning pipeline. Collaboration inquiries: project@email.com or 123-456-7890"
      },
      {
        title: "Web Application",
        description: "Full-stack web app with user authentication"
      }
    ],
    certifications: ["AWS Certified", "Contact AWS at support@aws.com for verification"],
    summary: "Experienced data scientist with 5 years in the field. Reach out at jane.smith.professional@company.com"
  };
}

/**
 * Create multiple mock profiles for batch testing
 * @param {number} count - Number of profiles to create
 * @returns {Array<Object>} - Array of mock profiles
 */
export function createMockProfilesBatch(count = 3) {
  const profiles = [];
  
  for (let i = 0; i < count; i++) {
    profiles.push({
      name: `Test User ${i + 1}`,
      email: `user${i + 1}@test.com`,
      phone: `555-000-${String(i + 1).padStart(4, '0')}`,
      degreeTarget: ['Bachelor', 'Master', 'PhD'][i % 3],
      targetField: ['Computer Science', 'Engineering', 'Business'][i % 3],
      experience: `Work experience for user ${i + 1}. Contact at work${i + 1}@company.com`,
      education: `Education details with contact info: school${i + 1}@university.edu`
    });
  }
  
  return profiles;
}
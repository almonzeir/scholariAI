import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * System prompt for PII scrubbing
 */
const PII_SCRUB_SYSTEM_PROMPT = `Given a profile JSON, return the same object but remove "name" and any emails/phone numbers embedded in other fields. Output JSON only.`;

/**
 * Scrub PII from a profile object using AI
 * @param {Object} profile - The profile object to scrub
 * @returns {Promise<Object>} - The scrubbed profile object
 */
async function scrubPII(profile) {
  try {
    // Create the user prompt with the profile JSON
    const userPrompt = `PROFILE: ${JSON.stringify(profile, null, 2)}`;
    
    // Generate the scrubbed profile using Gemini
    const result = await model.generateContent([
      { role: 'user', parts: [{ text: PII_SCRUB_SYSTEM_PROMPT }] },
      { role: 'user', parts: [{ text: userPrompt }] }
    ]);
    
    const response = result.response;
    let scrubbedText = response.text();
    
    // Clean up the response (remove markdown formatting if present)
    scrubbedText = scrubbedText.replace(/```json\s*|```\s*/g, '').trim();
    
    // Parse the JSON response
    const scrubbedProfile = JSON.parse(scrubbedText);
    
    // Additional manual scrubbing as fallback
    const manuallyScrubbedProfile = manualPIIScrub(scrubbedProfile);
    
    return manuallyScrubbedProfile;
    
  } catch (error) {
    console.error('Error scrubbing PII with AI:', error);
    
    // Fallback to manual scrubbing if AI fails
    return manualPIIScrub(profile);
  }
}

/**
 * Manual PII scrubbing as fallback
 * @param {Object} profile - The profile object to scrub
 * @returns {Object} - The scrubbed profile object
 */
function manualPIIScrub(profile) {
  const scrubbed = JSON.parse(JSON.stringify(profile)); // Deep clone
  
  // Remove name fields
  delete scrubbed.name;
  delete scrubbed.fullName;
  delete scrubbed.firstName;
  delete scrubbed.lastName;
  
  // Email regex pattern
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  // Phone number regex patterns (various formats)
  const phoneRegex = /(?:\+?1[-\s]?)?\(?[0-9]{3}\)?[-\s]?[0-9]{3}[-\s]?[0-9]{4}|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\(\d{3}\)\s?\d{3}[-.]?\d{4}/g;
  
  // Function to scrub text fields
  function scrubText(text) {
    if (typeof text !== 'string') return text;
    
    // Remove emails
    text = text.replace(emailRegex, '[EMAIL_REMOVED]');
    
    // Remove phone numbers
    text = text.replace(phoneRegex, '[PHONE_REMOVED]');
    
    return text;
  }
  
  // Recursively scrub all string fields
  function scrubObject(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = scrubText(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (Array.isArray(obj[key])) {
            obj[key] = obj[key].map(item => 
              typeof item === 'string' ? scrubText(item) : 
              typeof item === 'object' ? scrubObject(item) : item
            );
          } else {
            scrubObject(obj[key]);
          }
        }
      }
    }
    return obj;
  }
  
  return scrubObject(scrubbed);
}

/**
 * Test the PII scrubbing functionality
 * @returns {Promise<Object>} - Test results
 */
async function testPIIScrubbing() {
  const testProfile = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    degreeTarget: "Bachelor",
    targetField: "Computer Science",
    experience: "Worked at Tech Corp (contact: john.doe@techcorp.com, phone: 555-987-6543)",
    education: "Graduated from University XYZ. Contact admissions at admissions@xyz.edu",
    skills: ["JavaScript", "Python", "Contact me at john@personal.com"],
    projects: [
      {
        title: "Web App",
        description: "Built a web application. Reach out at project@email.com or call 123-456-7890"
      }
    ]
  };
  
  try {
    const scrubbedProfile = await scrubPII(testProfile);
    
    return {
      success: true,
      original: testProfile,
      scrubbed: scrubbedProfile,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check if a profile contains potential PII
 * @param {Object} profile - The profile to check
 * @returns {Object} - PII detection results
 */
function detectPII(profile) {
  const piiFound = {
    hasName: false,
    hasEmail: false,
    hasPhone: false,
    details: []
  };
  
  // Check for name fields
  if (profile.name || profile.fullName || profile.firstName || profile.lastName) {
    piiFound.hasName = true;
    piiFound.details.push('Name field detected');
  }
  
  // Email and phone regex patterns
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(?:\+?1[-\s]?)?\(?[0-9]{3}\)?[-\s]?[0-9]{3}[-\s]?[0-9]{4}|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\(\d{3}\)\s?\d{3}[-.]?\d{4}/g;
  
  // Function to check text for PII
  function checkText(text, fieldName) {
    if (typeof text !== 'string') return;
    
    const emails = text.match(emailRegex);
    const phones = text.match(phoneRegex);
    
    if (emails) {
      piiFound.hasEmail = true;
      piiFound.details.push(`Email found in ${fieldName}: ${emails.length} occurrence(s)`);
    }
    
    if (phones) {
      piiFound.hasPhone = true;
      piiFound.details.push(`Phone found in ${fieldName}: ${phones.length} occurrence(s)`);
    }
  }
  
  // Recursively check all fields
  function checkObject(obj, path = '') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof obj[key] === 'string') {
          checkText(obj[key], currentPath);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (Array.isArray(obj[key])) {
            obj[key].forEach((item, index) => {
              if (typeof item === 'string') {
                checkText(item, `${currentPath}[${index}]`);
              } else if (typeof item === 'object') {
                checkObject(item, `${currentPath}[${index}]`);
              }
            });
          } else {
            checkObject(obj[key], currentPath);
          }
        }
      }
    }
  }
  
  checkObject(profile);
  
  piiFound.hasPII = piiFound.hasName || piiFound.hasEmail || piiFound.hasPhone;
  
  return piiFound;
}

export {
  scrubPII,
  manualPIIScrub,
  testPIIScrubbing,
  detectPII
};
/**
 * Test Data Service
 * Provides synthetic profiles and adversarial test cases for QA testing
 */

import { SYNTHETIC_PROFILES } from '../data/syntheticProfiles.js';
import { ADVERSARIAL_SCHOLARSHIPS } from '../data/adversarialScholarships.js';
import { MICROCOPY, TOASTS, getMicrocopy, getToast } from '../lib/microcopy.js';

/**
 * Get all synthetic test profiles
 * @returns {Array} Array of synthetic user profiles
 */
export const getSyntheticProfiles = () => {
  return SYNTHETIC_PROFILES;
};

/**
 * Get a random synthetic profile
 * @returns {Object} Random synthetic profile
 */
export const getRandomProfile = () => {
  const profiles = getSyntheticProfiles();
  return profiles[Math.floor(Math.random() * profiles.length)];
};

/**
 * Get profiles by specific criteria
 * @param {Object} criteria - Filter criteria
 * @param {string} criteria.fieldOfStudy - Field of study filter
 * @param {string} criteria.degreeLevel - Degree level filter
 * @param {string} criteria.nationality - Nationality filter
 * @param {string} criteria.specialStatus - Special status filter
 * @returns {Array} Filtered profiles
 */
export const getProfilesByCriteria = (criteria = {}) => {
  let profiles = getSyntheticProfiles();
  
  if (criteria.fieldOfStudy) {
    profiles = profiles.filter(p => 
      p.fieldOfStudy.toLowerCase().includes(criteria.fieldOfStudy.toLowerCase())
    );
  }
  
  if (criteria.degreeLevel) {
    profiles = profiles.filter(p => p.degreeLevel === criteria.degreeLevel);
  }
  
  if (criteria.nationality) {
    profiles = profiles.filter(p => 
      p.nationality.toLowerCase().includes(criteria.nationality.toLowerCase())
    );
  }
  
  if (criteria.specialStatus) {
    profiles = profiles.filter(p => p.specialStatus === criteria.specialStatus);
  }
  
  return profiles;
};

/**
 * Get all adversarial scholarship test cases
 * @returns {Array} Array of tricky scholarship items
 */
export const getAdversarialScholarships = () => {
  return ADVERSARIAL_SCHOLARSHIPS;
};

/**
 * Get scholarships with specific issues for testing
 * @param {string} issueType - Type of issue to filter by
 * @returns {Array} Scholarships with specific issues
 */
export const getScholarshipsByIssue = (issueType) => {
  const scholarships = getAdversarialScholarships();
  
  switch (issueType) {
    case 'missing-deadline':
      return scholarships.filter(s => 
        s.deadline === 'varies' || s.deadline === 'TBD' || s.deadline === 'Rolling basis'
      );
    
    case 'ambiguous-funding':
      return scholarships.filter(s => 
        s.amount.includes('TBD') || s.amount.includes('-') || s.amount.includes('%')
      );
    
    case 'partial-tuition':
      return scholarships.filter(s => 
        s.coverage.some(c => c.toLowerCase().includes('partial')) ||
        s.coverage.some(c => c.toLowerCase().includes('only'))
      );
    
    case 'wrong-field-combo':
      return scholarships.filter(s => {
        const fields = s.eligibility.fieldOfStudy;
        return fields.includes('Art History') || fields.includes('Literature') || 
               fields.includes('Fine Arts') || fields.includes('Culinary Arts');
      });
    
    case 'duplicates':
      const titles = scholarships.map(s => s.title);
      const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
      return scholarships.filter(s => duplicateTitles.includes(s.title));
    
    default:
      return scholarships;
  }
};

/**
 * Generate test scenarios for comprehensive testing
 * @returns {Object} Test scenarios with profiles and scholarships
 */
export const generateTestScenarios = () => {
  return {
    // High-need refugee student in STEM
    refugeeSTEM: {
      profile: getProfilesByCriteria({ specialStatus: 'refugee', fieldOfStudy: 'engineering' })[0],
      scholarships: getScholarshipsByIssue('missing-deadline')
    },
    
    // Low-income student with ambiguous funding options
    lowIncomeAmbiguous: {
      profile: getProfilesByCriteria({ specialStatus: 'low-income' })[0],
      scholarships: getScholarshipsByIssue('ambiguous-funding')
    },
    
    // First-generation student with partial funding
    firstGenPartial: {
      profile: getProfilesByCriteria({ specialStatus: 'first-generation' })[0],
      scholarships: getScholarshipsByIssue('partial-tuition')
    },
    
    // Women in STEM with duplicate scholarships
    womenSTEMDuplicates: {
      profile: getProfilesByCriteria({ specialStatus: 'women-in-stem' })[0],
      scholarships: getScholarshipsByIssue('duplicates')
    },
    
    // Random comprehensive test
    randomComprehensive: {
      profile: getRandomProfile(),
      scholarships: getAdversarialScholarships().slice(0, 5)
    }
  };
};

/**
 * Get microcopy for testing UI components
 * @param {string} category - Microcopy category
 * @param {string} key - Specific key
 * @returns {string} Microcopy text
 */
export const getTestMicrocopy = (category, key) => {
  return getMicrocopy(category, key);
};

/**
 * Get toast message for testing
 * @param {string} key - Toast key
 * @returns {string} Toast message
 */
export const getTestToast = (key) => {
  return getToast(key);
};

/**
 * Generate sample data for different components
 * @param {string} component - Component name
 * @returns {Object} Sample data for component
 */
export const getSampleDataForComponent = (component) => {
  switch (component) {
    case 'profile-form':
      return getRandomProfile();
    
    case 'scholarship-list':
      return getAdversarialScholarships().slice(0, 3);
    
    case 'matching-results':
      return {
        profile: getRandomProfile(),
        matches: getAdversarialScholarships().slice(0, 5),
        totalFound: 15,
        processingTime: '2.3s'
      };
    
    case 'deduplication-test':
      return getScholarshipsByIssue('duplicates');
    
    case 'deadline-parsing-test':
      return getScholarshipsByIssue('missing-deadline');
    
    default:
      return {
        profiles: getSyntheticProfiles().slice(0, 3),
        scholarships: getAdversarialScholarships().slice(0, 3)
      };
  }
};

/**
 * Validate test data integrity
 * @returns {Object} Validation results
 */
export const validateTestData = () => {
  const profiles = getSyntheticProfiles();
  const scholarships = getAdversarialScholarships();
  
  const validation = {
    profiles: {
      count: profiles.length,
      hasRequiredFields: profiles.every(p => p.id && p.firstName && p.lastName && p.email),
      uniqueIds: new Set(profiles.map(p => p.id)).size === profiles.length,
      fieldsCovered: [...new Set(profiles.map(p => p.fieldOfStudy))],
      nationalitiesCovered: [...new Set(profiles.map(p => p.nationality))],
      statusesCovered: [...new Set(profiles.map(p => p.specialStatus))]
    },
    scholarships: {
      count: scholarships.length,
      hasRequiredFields: scholarships.every(s => s.id && s.title && s.provider),
      uniqueIds: new Set(scholarships.map(s => s.id)).size === scholarships.length,
      issueTypes: {
        missingDeadlines: getScholarshipsByIssue('missing-deadline').length,
        ambiguousFunding: getScholarshipsByIssue('ambiguous-funding').length,
        partialTuition: getScholarshipsByIssue('partial-tuition').length,
        wrongFieldCombos: getScholarshipsByIssue('wrong-field-combo').length,
        duplicates: getScholarshipsByIssue('duplicates').length
      }
    },
    microcopy: {
      buttonsCount: Object.keys(MICROCOPY.buttons).length,
      emptyStatesCount: Object.keys(MICROCOPY.emptyStates).length,
      errorHintsCount: Object.keys(MICROCOPY.errorHints).length,
      toastsCount: Object.keys(TOASTS).length
    }
  };
  
  return validation;
};

export default {
  getSyntheticProfiles,
  getRandomProfile,
  getProfilesByCriteria,
  getAdversarialScholarships,
  getScholarshipsByIssue,
  generateTestScenarios,
  getTestMicrocopy,
  getTestToast,
  getSampleDataForComponent,
  validateTestData
};
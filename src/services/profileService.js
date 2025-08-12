/**
 * User Profile Management Service
 * Handles CV profile data storage, retrieval, and management
 */

export class ProfileService {
  static STORAGE_KEY = 'scholarai_user_profile';
  static TEMP_STORAGE_KEY = 'scholarai_temp_profiles';
  static PROFILE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  /**
   * Initialize the ProfileService
   * @returns {Promise<boolean>} - Success status
   */
  static async initialize() {
    try {
      // Clean up expired temporary profiles on initialization
      this.cleanupExpiredProfiles();
      console.log('ProfileService initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing ProfileService:', error);
      return false;
    }
  }

  /**
   * Clean up expired temporary profiles
   */
  static cleanupExpiredProfiles() {
    try {
      const tempProfiles = this.getTemporaryProfiles();
      const cleanedProfiles = this.cleanExpiredProfiles(tempProfiles);
      localStorage.setItem(this.TEMP_STORAGE_KEY, JSON.stringify(cleanedProfiles));
    } catch (error) {
      console.error('Error cleaning up expired profiles:', error);
    }
  }

  /**
   * Store user profile permanently in localStorage
   * @param {Object} profile - User profile data
   * @returns {string} - Profile ID
   */
  static storeProfile(profile) {
    try {
      const profileData = {
        id: this.generateProfileId(),
        profile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profileData));
      return profileData.id;
    } catch (error) {
      console.error('Error storing profile:', error);
      throw new Error('Failed to store profile data');
    }
  }

  /**
   * Store profile temporarily with expiration
   * @param {Object} profile - User profile data
   * @returns {string} - Temporary profile ID
   */
  static storeTemporaryProfile(profile) {
    try {
      const profileId = this.generateProfileId();
      const expiresAt = Date.now() + this.PROFILE_EXPIRY;
      
      const tempProfile = {
        id: profileId,
        profile,
        expiresAt,
        createdAt: new Date().toISOString()
      };

      // Get existing temp profiles
      const existingProfiles = this.getTemporaryProfiles();
      existingProfiles[profileId] = tempProfile;

      // Clean expired profiles
      this.cleanExpiredProfiles(existingProfiles);

      // Store updated profiles
      localStorage.setItem(this.TEMP_STORAGE_KEY, JSON.stringify(existingProfiles));
      
      return profileId;
    } catch (error) {
      console.error('Error storing temporary profile:', error);
      throw new Error('Failed to store temporary profile data');
    }
  }

  /**
   * Retrieve user profile by ID
   * @param {string} profileId - Profile ID
   * @returns {Object|null} - User profile or null if not found
   */
  static getProfile(profileId = null) {
    try {
      if (profileId) {
        // Try to get temporary profile first
        const tempProfile = this.getTemporaryProfile(profileId);
        if (tempProfile) {
          return tempProfile;
        }
      }

      // Get permanent profile
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (!storedData) {
        return null;
      }

      const profileData = JSON.parse(storedData);
      
      // Check if specific ID requested
      if (profileId && profileData.id !== profileId) {
        return null;
      }

      return profileData.profile;
    } catch (error) {
      console.error('Error retrieving profile:', error);
      return null;
    }
  }

  /**
   * Retrieve temporary profile by ID
   * @param {string} profileId - Temporary profile ID
   * @returns {Object|null} - User profile or null if not found/expired
   */
  static getTemporaryProfile(profileId) {
    try {
      const tempProfiles = this.getTemporaryProfiles();
      const tempProfile = tempProfiles[profileId];

      if (!tempProfile) {
        return null;
      }

      // Check if expired
      if (Date.now() > tempProfile.expiresAt) {
        delete tempProfiles[profileId];
        localStorage.setItem(this.TEMP_STORAGE_KEY, JSON.stringify(tempProfiles));
        return null;
      }

      return tempProfile.profile;
    } catch (error) {
      console.error('Error retrieving temporary profile:', error);
      return null;
    }
  }

  /**
   * Get all temporary profiles
   * @returns {Object} - Temporary profiles object
   */
  static getTemporaryProfiles() {
    try {
      const storedData = localStorage.getItem(this.TEMP_STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
      console.error('Error retrieving temporary profiles:', error);
      return {};
    }
  }

  /**
   * Update user profile
   * @param {Object} profileUpdates - Profile updates
   * @param {string} profileId - Profile ID (optional)
   * @returns {boolean} - Success status
   */
  static updateProfile(profileUpdates, profileId = null) {
    try {
      const currentProfile = this.getProfile(profileId);
      if (!currentProfile) {
        throw new Error('Profile not found');
      }

      const updatedProfile = {
        ...currentProfile,
        ...profileUpdates,
        updatedAt: new Date().toISOString()
      };

      this.storeProfile(updatedProfile);
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  /**
   * Delete user profile
   * @param {string} profileId - Profile ID (optional)
   * @returns {boolean} - Success status
   */
  static deleteProfile(profileId = null) {
    try {
      if (profileId) {
        // Delete temporary profile
        const tempProfiles = this.getTemporaryProfiles();
        if (tempProfiles[profileId]) {
          delete tempProfiles[profileId];
          localStorage.setItem(this.TEMP_STORAGE_KEY, JSON.stringify(tempProfiles));
          return true;
        }
      }

      // Delete permanent profile
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      return false;
    }
  }

  /**
   * Clean expired temporary profiles
   * @param {Object} profiles - Profiles object
   */
  static cleanExpiredProfiles(profiles) {
    const now = Date.now();
    const validProfiles = {};

    for (const [id, profile] of Object.entries(profiles)) {
      if (profile.expiresAt > now) {
        validProfiles[id] = profile;
      }
    }

    return validProfiles;
  }

  /**
   * Generate unique profile ID
   * @returns {string} - Unique profile ID
   */
  static generateProfileId() {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get profile summary for display
   * @param {string} profileId - Profile ID (optional)
   * @returns {Object|null} - Profile summary
   */
  static getProfileSummary(profileId = null) {
    try {
      const profile = this.getProfile(profileId);
      if (!profile) {
        return null;
      }

      return {
        name: profile.personalInfo?.name || 'Unknown',
        email: profile.personalInfo?.email || 'Not provided',
        education: profile.education?.length || 0,
        experience: profile.experience?.length || 0,
        skills: profile.skills?.length || 0,
        lastUpdated: profile.updatedAt || profile.createdAt || 'Unknown'
      };
    } catch (error) {
      console.error('Error getting profile summary:', error);
      return null;
    }
  }

  /**
   * Validate profile data
   * @param {Object} profile - Profile data to validate
   * @returns {Object} - Validation result
   */
  static validateProfile(profile) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!profile.personalInfo?.name || profile.personalInfo.name === 'Not specified') {
      errors.push('Name is required');
    }

    if (!profile.personalInfo?.email || profile.personalInfo.email === 'Not specified') {
      warnings.push('Email is recommended for scholarship applications');
    }

    if (!profile.education || profile.education.length === 0) {
      errors.push('Education information is required');
    }

    if (!profile.skills || profile.skills.length === 0) {
      warnings.push('Skills information helps with better scholarship matching');
    }

    // Check data quality
    if (profile.education) {
      profile.education.forEach((edu, index) => {
        if (!edu.degree || edu.degree === 'Not specified') {
          warnings.push(`Education entry ${index + 1}: Degree information is incomplete`);
        }
        if (!edu.institution || edu.institution === 'Not specified') {
          warnings.push(`Education entry ${index + 1}: Institution information is incomplete`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateProfileCompleteness(profile)
    };
  }

  /**
   * Calculate profile completeness score
   * @param {Object} profile - Profile data
   * @returns {number} - Completeness score (0-100)
   */
  static calculateProfileCompleteness(profile) {
    let score = 0;
    const maxScore = 100;

    // Personal info (30 points)
    if (profile.personalInfo?.name && profile.personalInfo.name !== 'Not specified') score += 10;
    if (profile.personalInfo?.email && profile.personalInfo.email !== 'Not specified') score += 10;
    if (profile.personalInfo?.phone && profile.personalInfo.phone !== 'Not specified') score += 5;
    if (profile.personalInfo?.location && profile.personalInfo.location !== 'Not specified') score += 5;

    // Education (25 points)
    if (profile.education && profile.education.length > 0) {
      score += 15;
      const completeEducation = profile.education.filter(edu => 
        edu.degree !== 'Not specified' && edu.institution !== 'Not specified'
      );
      if (completeEducation.length > 0) score += 10;
    }

    // Experience (20 points)
    if (profile.experience && profile.experience.length > 0) {
      score += 10;
      const completeExperience = profile.experience.filter(exp => 
        exp.title !== 'Not specified' && exp.company !== 'Not specified'
      );
      if (completeExperience.length > 0) score += 10;
    }

    // Skills (15 points)
    if (profile.skills && profile.skills.length > 0) {
      score += 10;
      if (profile.skills.length >= 5) score += 5;
    }

    // Achievements (5 points)
    if (profile.achievements && profile.achievements.length > 0) {
      score += 5;
    }

    // Interests (5 points)
    if (profile.interests && profile.interests.length > 0) {
      score += 5;
    }

    return Math.min(score, maxScore);
  }

  /**
   * Export profile data
   * @param {string} profileId - Profile ID (optional)
   * @param {string} format - Export format ('json' or 'text')
   * @returns {string} - Exported data
   */
  static exportProfile(profileId = null, format = 'json') {
    try {
      const profile = this.getProfile(profileId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      if (format === 'json') {
        return JSON.stringify(profile, null, 2);
      }

      if (format === 'text') {
        return this.formatProfileAsText(profile);
      }

      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Error exporting profile:', error);
      throw error;
    }
  }

  /**
   * Format profile as readable text
   * @param {Object} profile - Profile data
   * @returns {string} - Formatted text
   */
  static formatProfileAsText(profile) {
    let text = '=== USER PROFILE ===\n\n';

    // Personal Information
    text += 'PERSONAL INFORMATION\n';
    text += `Name: ${profile.personalInfo?.name || 'Not specified'}\n`;
    text += `Email: ${profile.personalInfo?.email || 'Not specified'}\n`;
    text += `Phone: ${profile.personalInfo?.phone || 'Not specified'}\n`;
    text += `Location: ${profile.personalInfo?.location || 'Not specified'}\n\n`;

    // Education
    text += 'EDUCATION\n';
    if (profile.education && profile.education.length > 0) {
      profile.education.forEach((edu, index) => {
        text += `${index + 1}. ${edu.degree || 'Not specified'}\n`;
        text += `   Institution: ${edu.institution || 'Not specified'}\n`;
        text += `   Field: ${edu.field || 'Not specified'}\n`;
        text += `   Year: ${edu.year || 'Not specified'}\n\n`;
      });
    } else {
      text += 'No education information available\n\n';
    }

    // Experience
    text += 'WORK EXPERIENCE\n';
    if (profile.experience && profile.experience.length > 0) {
      profile.experience.forEach((exp, index) => {
        text += `${index + 1}. ${exp.title || 'Not specified'}\n`;
        text += `   Company: ${exp.company || 'Not specified'}\n`;
        text += `   Duration: ${exp.duration || 'Not specified'}\n`;
        text += `   Description: ${exp.description || 'Not specified'}\n\n`;
      });
    } else {
      text += 'No work experience information available\n\n';
    }

    // Skills
    text += 'SKILLS\n';
    if (profile.skills && profile.skills.length > 0) {
      text += profile.skills.join(', ') + '\n\n';
    } else {
      text += 'No skills information available\n\n';
    }

    // Achievements
    text += 'ACHIEVEMENTS\n';
    if (profile.achievements && profile.achievements.length > 0) {
      profile.achievements.forEach((achievement, index) => {
        text += `${index + 1}. ${achievement}\n`;
      });
      text += '\n';
    } else {
      text += 'No achievements information available\n\n';
    }

    // Interests
    text += 'INTERESTS\n';
    if (profile.interests && profile.interests.length > 0) {
      text += profile.interests.join(', ') + '\n\n';
    } else {
      text += 'No interests information available\n\n';
    }

    return text;
  }

  /**
   * Clear all profile data
   * @returns {boolean} - Success status
   */
  static clearAllProfiles() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.TEMP_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing profiles:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Object} - Storage statistics
   */
  static getStorageStats() {
    try {
      const permanentProfile = localStorage.getItem(this.STORAGE_KEY);
      const tempProfiles = localStorage.getItem(this.TEMP_STORAGE_KEY);
      
      const permanentSize = permanentProfile ? new Blob([permanentProfile]).size : 0;
      const tempSize = tempProfiles ? new Blob([tempProfiles]).size : 0;
      const tempCount = tempProfiles ? Object.keys(JSON.parse(tempProfiles)).length : 0;

      return {
        hasPermanentProfile: !!permanentProfile,
        permanentProfileSize: permanentSize,
        temporaryProfileCount: tempCount,
        temporaryProfilesSize: tempSize,
        totalSize: permanentSize + tempSize
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        hasPermanentProfile: false,
        permanentProfileSize: 0,
        temporaryProfileCount: 0,
        temporaryProfilesSize: 0,
        totalSize: 0
      };
    }
  }
}

export default ProfileService;
// 🔌 Main API Service - ScholarSeeker AI
import { supabase, supabaseHelpers } from './supabase.js';
import { GeminiScholarshipService } from './geminiService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import PDFParserService from './pdfParser.js';
import SupabaseService from './supabaseService.js';
import ProfileService from './profileService.js';
import ApplicationService from './applicationService.js';
import NotificationService from './notificationService.js';
import AnalyticsService from './analyticsService.js';
import SettingsService from './settingsService.js';
import BackupService from './backupService.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// API Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 30000, // 30 seconds
  retries: 3
};

/**
 * Main API Service Class
 */
export class ScholarSeekerAPI {
  static initialized = false;

  /**
   * Initialize all services
   */
  static async initialize() {
    if (this.initialized) return true;

    try {
      // Initialize all services
      SettingsService.initialize();
      ProfileService.initialize();
      ApplicationService.initialize();
      NotificationService.initialize();
      AnalyticsService.initialize();
      BackupService.initialize();
      
      // Initialize Supabase if configured
      await SupabaseService.initialize();
      
      this.initialized = true;
      console.log('ScholarAI API initialized successfully');
      
      // Track initialization
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.SESSION_START, {
        services: ['settings', 'profile', 'applications', 'notifications', 'analytics', 'backup', 'supabase']
      });
      
      return true;
    } catch (error) {
      console.error('Error initializing ScholarAI API:', error);
      AnalyticsService.trackError(error, { context: 'api_initialization' });
      return false;
    }
  }
  /**
   * Parse uploaded CV file using advanced PDF parser and Gemini AI
   * @param {File} cvFile - PDF file to parse
   * @returns {Promise<Object>} - Parsed profile data
   */
  static async parseCVFile(cvFile) {
    try {
      // Validate file
      if (!cvFile || cvFile.type !== 'application/pdf') {
        throw new Error('Please upload a valid PDF file');
      }

      if (cvFile.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB');
      }

      console.log('Processing CV file:', cvFile.name);

      // Extract text from PDF using advanced parser
      const extractedText = await PDFParserService.extractTextFromPDF(cvFile);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Could not extract text from PDF. Please ensure the PDF contains readable text.');
      }

      console.log('Extracted text length:', extractedText.length);

      // Use advanced CV analysis
      const structuredData = PDFParserService.analyzeCV(extractedText);
      
      // Enhance with Gemini AI if available
      let enhancedData = structuredData;
      if (genAI) {
        try {
          const geminiEnhanced = await this.parseWithGemini(extractedText);
          enhancedData = this.mergeProfileData(structuredData, geminiEnhanced);
        } catch (geminiError) {
          console.warn('Gemini enhancement failed, using structured parser:', geminiError.message);
        }
      }
      
      // Store profile temporarily using ProfileService
      const profileId = ProfileService.storeTemporaryProfile(enhancedData);
      
      // Also store permanently for user convenience
      ProfileService.storeProfile(enhancedData);
      
      return {
        success: true,
        profile: enhancedData,
        profileId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        validation: ProfileService.validateProfile(enhancedData)
      };
    } catch (error) {
      console.error('CV Parsing Error:', error);
      throw new Error(`Failed to parse CV: ${error.message}`);
    }
  }

  /**
   * Find scholarships based on profile using Supabase and Gemini AI
   * @param {string} profileId - Temporary profile ID
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} - Scholarship matches
   */
  static async findScholarships(profileId, filters = {}) {
    try {
      // Get profile from ProfileService
      const profile = ProfileService.getTemporaryProfile(profileId);
      
      if (!profile) {
        throw new Error('Profile not found or expired. Please upload your CV again.');
      }

      console.log('Finding scholarships for profile:', profile);
      console.log('Applied filters:', filters);

      // Initialize Supabase database if needed
      await SupabaseService.initializeDatabase();

      // Search scholarships using Supabase
      const scholarships = await SupabaseService.searchScholarships(profile, filters);
      
      if (scholarships && scholarships.length > 0) {
        // Enhance results with Gemini AI if available
        if (genAI) {
          try {
            const enhancedScholarships = await this.enhanceScholarshipsWithGemini(scholarships, profile);
            return {
              success: true,
              scholarships: enhancedScholarships,
              totalFound: enhancedScholarships.length,
              processingTime: Date.now(),
              filters: filters
            };
          } catch (geminiError) {
            console.warn('Gemini enhancement failed, using Supabase results:', geminiError.message);
          }
        }
        return {
          success: true,
          scholarships,
          totalFound: scholarships.length,
          processingTime: Date.now(),
          filters: filters
        };
      }

      // Final fallback
      const fallbackScholarships = await this.getRealFallbackScholarships(profile);
      
      return {
        success: true,
        scholarships: fallbackScholarships,
        totalFound: fallbackScholarships.length,
        processingTime: Date.now(),
        filters: filters
      };
    } catch (error) {
      console.error('Scholarship Search Error:', error);
      
      // Fallback to curated real scholarships if everything fails
      const profile = ProfileService.getTemporaryProfile(profileId) || {};
      const fallbackScholarships = await this.getRealFallbackScholarships(profile);
      
      return {
        success: false,
        scholarships: fallbackScholarships,
        totalFound: fallbackScholarships.length,
        error: error.message,
        processingTime: Date.now(),
        filters: filters
      };
    }
  }

  /**
   * Process questionnaire responses
   * @param {Object} responses - User questionnaire responses
   * @returns {Promise<Object>} - Processed profile
   */
  static async processQuestionnaire(responses) {
    try {
      // Convert questionnaire responses to profile format
      const profile = this.convertQuestionnairesToProfile(responses);
      
      // Store profile temporarily
      const profileId = await this.storeProfileTemporarily(profile);
      
      return {
        success: true,
        profile,
        profileId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('Questionnaire Processing Error:', error);
      throw new Error(`Failed to process questionnaire: ${error.message}`);
    }
  }

  /**
   * Test all API connections
   * @returns {Promise<Object>} - Connection test results
   */
  static async testConnections() {
    const results = {
      supabase: { success: false, message: '' },
      gemini: { success: false, message: '' },
      overall: { success: false, message: '' }
    };

    try {
      // Test Supabase connection
      const supabaseTest = await supabaseHelpers.testConnection();
      results.supabase = supabaseTest;

      // Test Gemini connection
      const geminiTest = await GeminiScholarshipService.testConnection();
      results.gemini = geminiTest;

      // Overall status
      results.overall.success = results.supabase.success && results.gemini.success;
      results.overall.message = results.overall.success 
        ? 'All services connected successfully' 
        : 'Some services are not available';

    } catch (error) {
      results.overall.message = `Connection test failed: ${error.message}`;
    }

    return results;
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  /**
   * Merge profile data from different sources
   * @param {Object} structuredData - Data from PDF parser
   * @param {Object} geminiData - Data from Gemini AI
   * @returns {Object} - Merged profile data
   */
  static mergeProfileData(structuredData, geminiData) {
    return {
      personalInfo: {
        ...structuredData.personalInfo,
        ...(geminiData.personalInfo || {})
      },
      education: geminiData.education && geminiData.education.length > 0 
        ? geminiData.education 
        : structuredData.education,
      experience: geminiData.experience && geminiData.experience.length > 0 
        ? geminiData.experience 
        : structuredData.experience,
      skills: [...new Set([
        ...(structuredData.skills || []),
        ...(geminiData.skills || [])
      ])].slice(0, 20), // Limit to 20 skills
      achievements: [...new Set([
        ...(structuredData.achievements || []),
        ...(geminiData.achievements || [])
      ])].slice(0, 10), // Limit to 10 achievements
      interests: [...new Set([
        ...(structuredData.interests || []),
        ...(geminiData.interests || [])
      ])].slice(0, 8) // Limit to 8 interests
    };
  }

  /**
   * Enhance scholarships with Gemini AI insights
   * @param {Array} scholarships - Base scholarships from Supabase
   * @param {Object} profile - User profile
   * @returns {Promise<Array>} - Enhanced scholarships
   */
  static async enhanceScholarshipsWithGemini(scholarships, profile) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `
        Analyze these scholarships and provide personalized match insights for the user.
        
        User Profile:
        ${JSON.stringify(profile, null, 2)}
        
        Scholarships:
        ${JSON.stringify(scholarships.slice(0, 10), null, 2)}
        
        For each scholarship, provide:
        1. A personalized match reason (why it fits the user)
        2. Application tips specific to the user's background
        3. An updated match score (0-100)
        
        Return a JSON array with the same scholarships but enhanced with:
        - matchReason: string
        - applicationTips: string
        - enhancedMatchScore: number
        
        Return only valid JSON, no additional text.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
      const enhancedData = JSON.parse(cleanedText);
      
      // Merge enhanced data with original scholarships
      return scholarships.map((scholarship, index) => {
        const enhancement = enhancedData[index] || {};
        return {
          ...scholarship,
          matchReason: enhancement.matchReason || 'Good fit based on your profile',
          applicationTips: enhancement.applicationTips || 'Review requirements carefully and highlight relevant experience',
          matchScore: enhancement.enhancedMatchScore || scholarship.matchScore || 75
        };
      });
      
    } catch (error) {
      console.error('Gemini enhancement error:', error);
      // Return original scholarships if enhancement fails
      return scholarships.map(scholarship => ({
        ...scholarship,
        matchReason: 'Matches your academic and professional background',
        applicationTips: 'Tailor your application to highlight relevant experience and achievements'
      }));
    }
  }

  /**
   * Parse CV text using Gemini AI
   * @param {string} cvText - Extracted CV text
   * @returns {Promise<Object>} - Structured profile data
   */
  static async parseWithGemini(cvText) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
Analyze this CV text and extract structured information in JSON format:

${cvText}

Please return ONLY a valid JSON object with this exact structure:
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "city, country"
  },
  "education": [
    {
      "degree": "degree name",
      "institution": "university name",
      "year": "graduation year or period",
      "gpa": "GPA if mentioned"
    }
  ],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "time period",
      "description": "brief description"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "achievements": ["achievement1", "achievement2"],
  "interests": ["interest1", "interest2"]
}

Extract only information that is clearly present in the CV. Use empty arrays for missing sections.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean and parse the JSON response
      const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
      const profile = JSON.parse(cleanedText);
      
      return profile;
    } catch (error) {
      console.error('Gemini parsing error:', error);
      // Fallback to basic extraction if Gemini fails
      return {
        personalInfo: {
          name: 'Extracted from CV',
          email: 'Not specified',
          phone: 'Not specified',
          location: 'Not specified'
        },
        education: [],
        experience: [],
        skills: [],
        achievements: [],
        interests: []
      };
    }
  }

  /**
   * Get comprehensive dashboard data
   * @returns {Object} - Dashboard data
   */
  static async getDashboardData() {
    try {
      const [profile, applications, notifications, analytics, settings] = await Promise.all([
        this.getProfileInsights(),
        ApplicationService.getStatistics(),
        NotificationService.getStatistics(),
        AnalyticsService.getDashboardData(),
        SettingsService.getSettingsSummary()
      ]);

      return {
        profile,
        applications,
        notifications,
        analytics,
        settings,
        quickActions: this.getQuickActions(),
        recentActivity: this.getRecentActivity(),
        upcomingDeadlines: ApplicationService.getUpcomingDeadlines(7)
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      AnalyticsService.trackError(error, { context: 'dashboard_data' });
      throw new Error('Failed to get dashboard data');
    }
  }

  /**
   * Get user profile statistics and insights
   * @param {string} profileId - Profile ID
   * @returns {Object} - Profile statistics
   */
  static getProfileInsights(profileId = null) {
    try {
      const profile = ProfileService.getProfile(profileId);
      if (!profile) {
        return {
          found: false,
          message: 'Profile not found'
        };
      }

      const validation = ProfileService.validateProfile(profile);
      const summary = ProfileService.getProfileSummary(profileId);
      const completeness = ProfileService.calculateProfileCompleteness(profile);

      return {
        found: true,
        summary,
        validation,
        completeness,
        recommendations: this.getProfileRecommendations(profile, validation)
      };
    } catch (error) {
      console.error('Error getting profile insights:', error);
      AnalyticsService.trackError(error, { context: 'profile_insights' });
      return {
        found: false,
        error: error.message
      };
    }
  }

  /**
   * Get profile improvement recommendations
   * @param {Object} profile - Profile data
   * @param {Object} validation - Validation results
   * @returns {Array} - Recommendations
   */
  static getProfileRecommendations(profile, validation) {
    const recommendations = [];

    if (validation.score < 70) {
      recommendations.push({
        type: 'completeness',
        priority: 'high',
        message: 'Complete your profile to improve scholarship matching accuracy'
      });
    }

    if (!profile.personalInfo?.email || profile.personalInfo.email === 'Not specified') {
      recommendations.push({
        type: 'contact',
        priority: 'high',
        message: 'Add your email address for scholarship application notifications'
      });
    }

    if (!profile.skills || profile.skills.length < 5) {
      recommendations.push({
        type: 'skills',
        priority: 'medium',
        message: 'Add more skills to improve scholarship matching'
      });
    }

    if (!profile.achievements || profile.achievements.length === 0) {
      recommendations.push({
        type: 'achievements',
        priority: 'medium',
        message: 'Add achievements and awards to strengthen your profile'
      });
    }

    if (!profile.interests || profile.interests.length === 0) {
      recommendations.push({
        type: 'interests',
        priority: 'low',
        message: 'Add interests to find more relevant opportunities'
      });
    }

    return recommendations;
  }

  /**
   * Get quick actions for dashboard
   * @returns {Array} - Quick actions
   */
  static getQuickActions() {
    try {
      const profile = ProfileService.getProfile();
      const applications = ApplicationService.getAllApplications();
      const actions = [];

      // Profile-related actions
      if (!profile) {
        actions.push({
          id: 'upload_cv',
          title: 'Upload Your CV',
          description: 'Get started by uploading your CV',
          icon: 'upload',
          url: '/upload',
          priority: 'high'
        });
      } else {
        const completeness = ProfileService.getProfileCompleteness(profile);
        if (completeness.score < 80) {
          actions.push({
            id: 'complete_profile',
            title: 'Complete Your Profile',
            description: `Your profile is ${completeness.score}% complete`,
            icon: 'user',
            url: '/profile',
            priority: 'medium'
          });
        }
      }

      // Application-related actions
      if (applications.length === 0) {
        actions.push({
          id: 'search_scholarships',
          title: 'Find Scholarships',
          description: 'Discover scholarships that match your profile',
          icon: 'search',
          url: '/scholarships',
          priority: 'high'
        });
      }

      // Backup action
      const lastBackup = BackupService.getBackups()[0];
      if (!lastBackup || this.daysSince(lastBackup.createdAt) > 7) {
        actions.push({
          id: 'create_backup',
          title: 'Backup Your Data',
          description: 'Create a backup of your profile and applications',
          icon: 'backup',
          action: 'backup',
          priority: 'low'
        });
      }

      return actions.slice(0, 4); // Limit to 4 actions
    } catch (error) {
      console.error('Error getting quick actions:', error);
      return [];
    }
  }

  /**
   * Get recent activity
   * @returns {Array} - Recent activities
   */
  static getRecentActivity() {
    try {
      const events = AnalyticsService.getEvents({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      });

      return events
        .filter(event => [
          AnalyticsService.EVENTS.CV_UPLOADED,
          AnalyticsService.EVENTS.SCHOLARSHIP_VIEWED,
          AnalyticsService.EVENTS.APPLICATION_STARTED,
          AnalyticsService.EVENTS.APPLICATION_SUBMITTED,
          AnalyticsService.EVENTS.SCHOLARSHIP_FAVORITED
        ].includes(event.type))
        .slice(0, 10)
        .map(event => ({
          id: event.id,
          type: event.type,
          description: this.getActivityDescription(event),
          timestamp: event.timestamp,
          data: event.properties
        }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  /**
   * Perform comprehensive search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} - Search results
   */
  static async performSearch(query, options = {}) {
    try {
      const startTime = Date.now();
      
      // Track search event
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.SEARCH_PERFORMED, {
        query,
        options
      });

      // Get user profile for personalized results
      const profile = ProfileService.getProfile();
      
      // Perform scholarship search
      const scholarships = await this.findScholarships(profile, {
        searchQuery: query,
        ...options
      });

      // Search applications if query matches
      const applications = ApplicationService.searchApplications(query);

      const duration = Date.now() - startTime;
      
      // Track search performance
      AnalyticsService.trackAPICall('search', 'POST', duration, true, {
        resultsCount: scholarships.length + applications.length
      });

      return {
        query,
        scholarships,
        applications,
        totalResults: scholarships.length + applications.length,
        searchTime: duration
      };
    } catch (error) {
      console.error('Error performing search:', error);
      AnalyticsService.trackError(error, { context: 'comprehensive_search', query });
      throw new Error('Search failed');
    }
  }

  /**
   * Get system health status
   * @returns {Object} - System health
   */
  static getSystemHealth() {
    try {
      const health = {
        status: 'healthy',
        services: {},
        performance: {},
        storage: {},
        lastChecked: new Date().toISOString()
      };

      // Check service health
      health.services = {
        profile: ProfileService.getProfile() !== null,
        applications: ApplicationService.getAllApplications().length >= 0,
        notifications: NotificationService.getStatistics().total >= 0,
        analytics: AnalyticsService.getEvents().length >= 0,
        settings: Object.keys(SettingsService.getSettings()).length > 0,
        backup: BackupService.getBackups().length >= 0
      };

      // Check performance metrics
      const performanceMetrics = AnalyticsService.getPerformanceMetrics();
      health.performance = {
        averageApiResponseTime: performanceMetrics.apiPerformance?.averageResponseTime || 0,
        errorRate: performanceMetrics.errorAnalysis?.errorRate || 0,
        averageLoadTime: performanceMetrics.pagePerformance?.averageLoadTime || 0
      };

      // Check storage usage
      health.storage = {
        used: this.getStorageUsage(),
        available: this.getAvailableStorage(),
        backupCount: BackupService.getBackups().length
      };

      // Determine overall status
      const serviceIssues = Object.values(health.services).filter(status => !status).length;
      const highErrorRate = health.performance.errorRate > 5;
      const slowPerformance = health.performance.averageApiResponseTime > 5000;

      if (serviceIssues > 2 || highErrorRate || slowPerformance) {
        health.status = 'degraded';
      } else if (serviceIssues > 0) {
        health.status = 'warning';
      }

      return health;
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Get real fallback scholarships if Gemini service fails
   * @param {Object} profile - User profile for basic matching
   * @returns {Promise<Array>} - Array of real scholarships
   */
  static async getRealFallbackScholarships(profile) {
    // Return curated real scholarships with basic matching
    const allScholarships = [
      {
        id: 1,
        title: 'Gates Millennium Scholarship',
        description: 'Full scholarship for outstanding minority students pursuing undergraduate or graduate degrees in any field.',
        amount: 'Full Tuition + Living Expenses',
        deadline: 'January 15, 2025',
        provider: 'Bill & Melinda Gates Foundation',
        eligibility: ['Minority Students', 'High Academic Achievement', 'Leadership', 'US Citizens/Residents'],
        link: 'https://www.gmsp.org',
        country: 'United States',
        fieldOfStudy: 'Any',
        level: 'Undergraduate/Graduate'
      },
      {
        id: 2,
        title: 'Fulbright Foreign Student Program',
        description: 'Provides funding for graduate students, young professionals and artists from abroad to study and conduct research in the United States.',
        amount: 'Full Funding',
        deadline: 'October 15, 2024',
        provider: 'U.S. Department of State',
        eligibility: ['International Students', 'Graduate Level', 'Research Focus', 'Non-US Citizens'],
        link: 'https://foreign.fulbrightonline.org',
        country: 'United States',
        fieldOfStudy: 'Any',
        level: 'Graduate'
      },
      {
        id: 3,
        title: 'Rhodes Scholarship',
        description: 'The world\'s oldest international scholarship programme, enabling outstanding young people to study at Oxford.',
        amount: 'Full Funding',
        deadline: 'October 1, 2024',
        provider: 'Rhodes Trust',
        eligibility: ['Exceptional Academic Achievement', 'Leadership', 'Service to Others', 'Age 19-25'],
        link: 'https://www.rhodeshouse.ox.ac.uk',
        country: 'United Kingdom',
        fieldOfStudy: 'Any',
        level: 'Graduate'
      },
      {
        id: 4,
        title: 'Google Lime Scholarship',
        description: 'For students with disabilities pursuing computer science, computer engineering, or related technical field.',
        amount: '$10,000',
        deadline: 'December 1, 2024',
        provider: 'Google',
        eligibility: ['Students with Disabilities', 'Computer Science/Engineering', 'Undergraduate/Graduate'],
        link: 'https://www.limeconnect.com/programs/page/google-lime-scholarship',
        country: 'United States',
        fieldOfStudy: 'Computer Science/Engineering',
        level: 'Undergraduate/Graduate'
      },
      {
        id: 5,
        title: 'Microsoft Scholarship Program',
        description: 'For students pursuing degrees in computer science, computer engineering, or related STEM field.',
        amount: '$5,000',
        deadline: 'February 1, 2025',
        provider: 'Microsoft',
        eligibility: ['STEM Fields', 'Underrepresented Groups', 'Undergraduate'],
        link: 'https://careers.microsoft.com/students/us/en/usscholarshipprogram',
        country: 'United States',
        fieldOfStudy: 'STEM',
        level: 'Undergraduate'
      }
    ];
    
    // Basic matching based on profile
    const matchedScholarships = allScholarships.map(scholarship => {
      let matchScore = 50; // Base score
      
      // Increase score based on field match
      if (profile.education && profile.education.length > 0) {
        const degree = profile.education[0].degree?.toLowerCase() || '';
        if (scholarship.fieldOfStudy === 'Any') matchScore += 10;
        else if (degree.includes('computer') && scholarship.fieldOfStudy.includes('Computer')) matchScore += 25;
        else if (degree.includes('engineering') && scholarship.fieldOfStudy.includes('Engineering')) matchScore += 25;
        else if (scholarship.fieldOfStudy.includes('STEM') && (degree.includes('science') || degree.includes('engineering') || degree.includes('math'))) matchScore += 20;
      }
      
      // Increase score based on skills match
      if (profile.skills && profile.skills.length > 0) {
        const hasSTEMSkills = profile.skills.some(skill => 
          ['javascript', 'python', 'java', 'programming', 'coding', 'software'].some(tech => 
            skill.toLowerCase().includes(tech)
          )
        );
        if (hasSTEMSkills && scholarship.fieldOfStudy.includes('Computer')) matchScore += 15;
      }
      
      return {
        ...scholarship,
        matchScore: Math.min(matchScore, 95), // Cap at 95
        searchedAt: new Date().toISOString(),
        aiGenerated: false
      };
    });
    
    // Sort by match score and return top 5
    return matchedScholarships
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  /**
   * Convert questionnaire responses to profile format
   * @param {Object} responses - Questionnaire responses
   * @returns {Object} - Profile data
   */
  static convertQuestionnairesToProfile(responses) {
    return {
      name: responses.fullName || 'Student',
      email: responses.email || '',
      degree: responses.currentDegree || '',
      fieldOfStudy: responses.fieldOfStudy || '',
      university: responses.university || '',
      gpa: responses.gpa || '',
      graduationYear: responses.graduationYear || '',
      country: responses.country || '',
      targetCountry: responses.targetCountry || '',
      skills: responses.skills || [],
      experience: responses.experience || [],
      achievements: responses.achievements || [],
      languages: responses.languages || [],
      createdFrom: 'questionnaire',
      createdAt: new Date().toISOString()
    };
  }

  // Helper methods
  static getActivityDescription(event) {
    const descriptions = {
      [AnalyticsService.EVENTS.CV_UPLOADED]: 'Uploaded CV',
      [AnalyticsService.EVENTS.SCHOLARSHIP_VIEWED]: `Viewed scholarship: ${event.properties.title || 'Unknown'}`,
      [AnalyticsService.EVENTS.APPLICATION_STARTED]: `Started application for: ${event.properties.title || 'Unknown'}`,
      [AnalyticsService.EVENTS.APPLICATION_SUBMITTED]: `Submitted application for: ${event.properties.title || 'Unknown'}`,
      [AnalyticsService.EVENTS.SCHOLARSHIP_FAVORITED]: `Favorited scholarship: ${event.properties.title || 'Unknown'}`
    };

    return descriptions[event.type] || 'Unknown activity';
  }

  static daysSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
  }

  static getStorageUsage() {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  static getAvailableStorage() {
    try {
      // Estimate available storage (browsers typically allow 5-10MB for localStorage)
      const estimate = 5 * 1024 * 1024; // 5MB
      const used = this.getStorageUsage();
      return Math.max(0, estimate - used);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Export all user data
   * @param {Object} options - Export options
   * @returns {Object} - Export result
   */
  static async exportAllData(options = {}) {
    try {
      const {
        format = 'json',
        includeAnalytics = false,
        includeBackups = false
      } = options;

      const exportData = {
        profile: ProfileService.exportProfile(),
        applications: ApplicationService.exportApplications(),
        settings: SettingsService.exportSettings(),
        notifications: NotificationService.exportNotifications(),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      if (includeAnalytics) {
        exportData.analytics = AnalyticsService.exportAnalytics();
      }

      if (includeBackups) {
        exportData.backups = BackupService.getBackups();
      }

      // Track export event
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
        action: 'export_all_data',
        format,
        includeAnalytics,
        includeBackups
      });

      if (format === 'json') {
        return {
          success: true,
          data: JSON.stringify(exportData, null, 2),
          filename: `scholarai_export_${new Date().toISOString().split('T')[0]}.json`,
          size: new Blob([JSON.stringify(exportData)]).size
        };
      }

      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Error exporting all data:', error);
      AnalyticsService.trackError(error, { context: 'export_all_data' });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear all user data
   * @param {Object} options - Clear options
   * @returns {boolean} - Success status
   */
  static clearAllData(options = {}) {
    try {
      const {
        createBackup = true,
        clearAnalytics = false,
        clearSettings = false
      } = options;

      // Create backup before clearing if requested
      if (createBackup) {
        BackupService.createFullBackup({
          description: 'Pre-clear backup',
          includeAnalytics: true
        });
      }

      // Clear data
      ProfileService.clearProfile();
      ApplicationService.clearAllApplications();
      NotificationService.clearAllNotifications();
      
      if (clearAnalytics) {
        AnalyticsService.clearAllData();
      }
      
      if (clearSettings) {
        SettingsService.clearAllSettings();
      }

      // Track clear event (if analytics not cleared)
      if (!clearAnalytics) {
        AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
          action: 'clear_all_data',
          createBackup,
          clearAnalytics,
          clearSettings
        });
      }

      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }
}

// Export individual functions for easier importing
export const {
  parseCVFile,
  findScholarships,
  processQuestionnaire,
  testConnections
} = ScholarSeekerAPI;

export default ScholarSeekerAPI;
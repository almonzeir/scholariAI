/**
 * Analytics Service
 * Tracks user behavior, application performance, and provides insights
 */

import ApplicationService from './applicationService.js';
import ProfileService from './profileService.js';
import NotificationService from './notificationService.js';

export class AnalyticsService {
  static STORAGE_KEY = 'scholarai_analytics';
  static SESSION_KEY = 'scholarai_session';
  static EVENTS_KEY = 'scholarai_events';
  static MAX_EVENTS = 1000;
  static SETTINGS_KEY = 'scholarai_analytics_settings';

  /**
   * Event types for tracking
   */
  static EVENTS = {
    // User actions
    CV_UPLOADED: 'cv_uploaded',
    PROFILE_UPDATED: 'profile_updated',
    SCHOLARSHIP_SEARCHED: 'scholarship_searched',
    SCHOLARSHIP_VIEWED: 'scholarship_viewed',
    APPLICATION_STARTED: 'application_started',
    APPLICATION_SUBMITTED: 'application_submitted',
    SCHOLARSHIP_FAVORITED: 'scholarship_favorited',
    FILTER_APPLIED: 'filter_applied',
    
    // Navigation
    PAGE_VIEW: 'page_view',
    FEATURE_USED: 'feature_used',
    SEARCH_PERFORMED: 'search_performed',
    
    // Performance
    API_CALL: 'api_call',
    ERROR_OCCURRED: 'error_occurred',
    LOAD_TIME: 'load_time',
    
    // Engagement
    SESSION_START: 'session_start',
    SESSION_END: 'session_end',
    TIME_SPENT: 'time_spent',
    NOTIFICATION_CLICKED: 'notification_clicked'
  };

  /**
   * Initialize analytics service
   * @returns {Promise<boolean>} - Success status
   */
  static async initialize() {
    try {
      this.startSession();
      this.setupEventListeners();
      this.trackPageLoad();
      
      // Clean up old events periodically
      this.cleanupOldEvents();
      
      // Initialize session tracking
      this.initializeSession();
      
      // Clean up old analytics data
      this.cleanupOldData();
      
      console.log('Analytics service initialized');
      return true;
    } catch (error) {
      console.error('Error initializing analytics service:', error);
      return false;
    }
  }

  /**
   * Initialize session tracking
   */
  static initializeSession() {
    try {
      const sessionId = this.generateSessionId();
      const session = {
        id: sessionId,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        pageViews: 0,
        actions: 0
      };
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  }

  /**
   * Clean up old analytics data (keep last 30 days)
   */
  static cleanupOldData() {
    try {
      const analytics = this.getAnalytics();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Filter events to keep only recent ones
      const recentEvents = analytics.events ? analytics.events.filter(event => 
        new Date(event.timestamp) > thirtyDaysAgo
      ) : [];
      
      const updatedAnalytics = {
        ...analytics,
        events: recentEvents
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedAnalytics));
    } catch (error) {
      console.error('Error cleaning up old analytics data:', error);
    }
  }

  /**
   * Get analytics data
   * @returns {Object} - Analytics data
   */
  static getAnalytics() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : { events: [], sessions: [], metrics: {} };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      return { events: [], sessions: [], metrics: {} };
    }
  }

  /**
   * Track an event
   * @param {string} eventType - Type of event
   * @param {Object} properties - Event properties
   * @param {Object} context - Additional context
   */
  static trackEvent(eventType, properties = {}, context = {}) {
    try {
      const event = {
        id: this.generateEventId(),
        type: eventType,
        properties,
        context: {
          ...this.getDefaultContext(),
          ...context
        },
        timestamp: new Date().toISOString(),
        sessionId: this.getCurrentSessionId()
      };

      // Store event
      this.storeEvent(event);
      
      // Update session data
      this.updateSessionActivity();
      
      // Log for debugging (remove in production)
      console.log('Analytics event tracked:', eventType, properties);
      
      return event.id;
    } catch (error) {
      console.error('Error tracking event:', error);
      return null;
    }
  }

  /**
   * Track page view
   * @param {string} pageName - Name of the page
   * @param {Object} properties - Additional properties
   */
  static trackPageView(pageName, properties = {}) {
    return this.trackEvent(this.EVENTS.PAGE_VIEW, {
      page: pageName,
      url: window.location.href,
      referrer: document.referrer,
      ...properties
    });
  }

  /**
   * Track user action
   * @param {string} action - Action name
   * @param {Object} properties - Action properties
   */
  static trackUserAction(action, properties = {}) {
    return this.trackEvent(this.EVENTS.FEATURE_USED, {
      action,
      ...properties
    });
  }

  /**
   * Track API call performance
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {number} duration - Call duration in ms
   * @param {boolean} success - Whether call was successful
   * @param {Object} additionalData - Additional data
   */
  static trackAPICall(endpoint, method, duration, success, additionalData = {}) {
    return this.trackEvent(this.EVENTS.API_CALL, {
      endpoint,
      method,
      duration,
      success,
      ...additionalData
    });
  }

  /**
   * Track error occurrence
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  static trackError(error, context = {}) {
    return this.trackEvent(this.EVENTS.ERROR_OCCURRED, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    });
  }

  /**
   * Track scholarship interaction
   * @param {string} scholarshipId - Scholarship ID
   * @param {string} action - Action performed
   * @param {Object} scholarshipData - Scholarship data
   */
  static trackScholarshipInteraction(scholarshipId, action, scholarshipData = {}) {
    const eventType = {
      'view': this.EVENTS.SCHOLARSHIP_VIEWED,
      'favorite': this.EVENTS.SCHOLARSHIP_FAVORITED,
      'apply': this.EVENTS.APPLICATION_STARTED
    }[action] || this.EVENTS.FEATURE_USED;

    return this.trackEvent(eventType, {
      scholarshipId,
      action,
      title: scholarshipData.title,
      amount: scholarshipData.amount,
      deadline: scholarshipData.deadline,
      matchScore: scholarshipData.matchScore
    });
  }

  /**
   * Get analytics dashboard data
   * @param {Object} options - Query options
   * @returns {Object} - Dashboard data
   */
  static getDashboardData(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = new Date(),
        eventTypes = null
      } = options;

      const events = this.getEvents({
        startDate,
        endDate,
        eventTypes
      });

      return {
        overview: this.getOverviewMetrics(events),
        userEngagement: this.getUserEngagementMetrics(events),
        scholarshipMetrics: this.getScholarshipMetrics(events),
        applicationMetrics: this.getApplicationMetrics(events),
        performanceMetrics: this.getPerformanceMetrics(events),
        trends: this.getTrendData(events),
        topPages: this.getTopPages(events),
        userJourney: this.getUserJourney(events)
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return this.getEmptyDashboard();
    }
  }

  /**
   * Get user behavior insights
   * @returns {Object} - User insights
   */
  static getUserInsights() {
    try {
      const events = this.getEvents();
      const sessions = this.getSessions();
      const profile = ProfileService.getProfile();
      const applications = ApplicationService.getAllApplications();

      return {
        profileCompleteness: this.analyzeProfileCompleteness(profile),
        engagementLevel: this.calculateEngagementLevel(events, sessions),
        applicationSuccess: this.analyzeApplicationSuccess(applications),
        searchBehavior: this.analyzeSearchBehavior(events),
        timeSpentAnalysis: this.analyzeTimeSpent(sessions),
        featureUsage: this.analyzeFeatureUsage(events),
        recommendations: this.generateRecommendations(events, profile, applications)
      };
    } catch (error) {
      console.error('Error getting user insights:', error);
      return {};
    }
  }

  /**
   * Get performance metrics
   * @returns {Object} - Performance data
   */
  static getPerformanceMetrics() {
    try {
      const events = this.getEvents({
        eventTypes: [this.EVENTS.API_CALL, this.EVENTS.LOAD_TIME, this.EVENTS.ERROR_OCCURRED]
      });

      const apiCalls = events.filter(e => e.type === this.EVENTS.API_CALL);
      const loadTimes = events.filter(e => e.type === this.EVENTS.LOAD_TIME);
      const errors = events.filter(e => e.type === this.EVENTS.ERROR_OCCURRED);

      return {
        apiPerformance: {
          totalCalls: apiCalls.length,
          averageResponseTime: this.calculateAverage(apiCalls.map(e => e.properties.duration)),
          successRate: apiCalls.length > 0 ? 
            (apiCalls.filter(e => e.properties.success).length / apiCalls.length) * 100 : 0,
          slowestEndpoints: this.getSlowestEndpoints(apiCalls)
        },
        pagePerformance: {
          averageLoadTime: this.calculateAverage(loadTimes.map(e => e.properties.duration)),
          slowestPages: this.getSlowestPages(loadTimes)
        },
        errorAnalysis: {
          totalErrors: errors.length,
          errorRate: events.length > 0 ? (errors.length / events.length) * 100 : 0,
          commonErrors: this.getCommonErrors(errors),
          errorTrends: this.getErrorTrends(errors)
        }
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {};
    }
  }

  /**
   * Generate user recommendations based on analytics
   * @returns {Array} - Recommendations
   */
  static generateRecommendations(events, profile, applications) {
    const recommendations = [];

    try {
      // Profile completion recommendations
      if (profile) {
        const validation = ProfileService.validateProfile(profile);
        if (validation.score < 80) {
          recommendations.push({
            type: 'profile_completion',
            priority: 'high',
            title: 'Complete Your Profile',
            description: `Your profile is ${validation.score}% complete. Complete it to get better scholarship matches.`,
            action: 'Complete Profile',
            actionUrl: '/profile'
          });
        }
      }

      // Search behavior recommendations
      const searchEvents = events.filter(e => e.type === this.EVENTS.SCHOLARSHIP_SEARCHED);
      if (searchEvents.length === 0) {
        recommendations.push({
          type: 'first_search',
          priority: 'medium',
          title: 'Start Your Scholarship Search',
          description: 'Begin finding scholarships that match your profile.',
          action: 'Search Scholarships',
          actionUrl: '/scholarships'
        });
      }

      // Application recommendations
      const applicationEvents = events.filter(e => e.type === this.EVENTS.APPLICATION_STARTED);
      const viewEvents = events.filter(e => e.type === this.EVENTS.SCHOLARSHIP_VIEWED);
      
      if (viewEvents.length > 5 && applicationEvents.length === 0) {
        recommendations.push({
          type: 'start_applying',
          priority: 'high',
          title: 'Start Applying to Scholarships',
          description: "You've viewed several scholarships. Consider starting your applications.",
          action: 'View Applications',
          actionUrl: '/applications'
        });
      }

      // Engagement recommendations
      const recentEvents = events.filter(e => {
        const eventDate = new Date(e.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return eventDate >= weekAgo;
      });

      if (recentEvents.length < 5) {
        recommendations.push({
          type: 'increase_engagement',
          priority: 'low',
          title: 'Stay Active',
          description: 'Regular activity helps you stay on top of new scholarship opportunities.',
          action: 'Explore Features',
          actionUrl: '/dashboard'
        });
      }

      return recommendations.slice(0, 5); // Limit to top 5 recommendations
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Export analytics data
   * @param {Object} options - Export options
   * @returns {string} - Exported data
   */
  static exportAnalytics(options = {}) {
    try {
      const {
        format = 'json',
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        includeEvents = true,
        includeSessions = true,
        includeMetrics = true
      } = options;

      const exportData = {};

      if (includeEvents) {
        exportData.events = this.getEvents({ startDate, endDate });
      }

      if (includeSessions) {
        exportData.sessions = this.getSessions({ startDate, endDate });
      }

      if (includeMetrics) {
        exportData.metrics = this.getDashboardData({ startDate, endDate });
      }

      exportData.exportedAt = new Date().toISOString();
      exportData.dateRange = { startDate, endDate };

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      }

      if (format === 'csv' && includeEvents) {
        return this.convertEventsToCSV(exportData.events);
      }

      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  // Helper methods
  static startSession() {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      pageViews: 0,
      events: 0,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      initialUrl: window.location.href
    };

    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    this.trackEvent(this.EVENTS.SESSION_START, { sessionId });
    
    return sessionId;
  }

  static getCurrentSessionId() {
    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      return sessionData ? JSON.parse(sessionData).id : this.startSession();
    } catch (error) {
      return this.startSession();
    }
  }

  static updateSessionActivity() {
    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.lastActivity = new Date().toISOString();
        session.events += 1;
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  static setupEventListeners() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent(this.EVENTS.SESSION_END, {
          reason: 'page_hidden',
          sessionDuration: this.getSessionDuration()
        });
      } else {
        this.trackEvent(this.EVENTS.SESSION_START, {
          reason: 'page_visible'
        });
      }
    });

    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent(this.EVENTS.SESSION_END, {
        reason: 'page_unload',
        sessionDuration: this.getSessionDuration()
      });
    });

    // Track errors
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  static trackPageLoad() {
    // Track initial page load time
    if (window.performance && window.performance.timing) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      this.trackEvent(this.EVENTS.LOAD_TIME, {
        page: window.location.pathname,
        duration: loadTime,
        type: 'initial_load'
      });
    }
  }

  static getDefaultContext() {
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    };
  }

  static storeEvent(event) {
    try {
      const events = this.getStoredEvents();
      events.push(event);
      
      // Limit stored events
      if (events.length > this.MAX_EVENTS) {
        events.splice(0, events.length - this.MAX_EVENTS);
      }
      
      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));
    } catch (error) {
      console.error('Error storing event:', error);
    }
  }

  static getStoredEvents() {
    try {
      const storedData = localStorage.getItem(this.EVENTS_KEY);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Error getting stored events:', error);
      return [];
    }
  }

  static getEvents(filters = {}) {
    try {
      let events = this.getStoredEvents();
      
      if (filters.startDate) {
        events = events.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
      }
      
      if (filters.endDate) {
        events = events.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
      }
      
      if (filters.eventTypes) {
        events = events.filter(e => filters.eventTypes.includes(e.type));
      }
      
      if (filters.sessionId) {
        events = events.filter(e => e.sessionId === filters.sessionId);
      }
      
      return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  static getSessions(filters = {}) {
    try {
      const events = this.getEvents(filters);
      const sessions = {};
      
      events.forEach(event => {
        if (!sessions[event.sessionId]) {
          sessions[event.sessionId] = {
            id: event.sessionId,
            startTime: event.timestamp,
            endTime: event.timestamp,
            events: [],
            duration: 0
          };
        }
        
        const session = sessions[event.sessionId];
        session.events.push(event);
        
        if (new Date(event.timestamp) < new Date(session.startTime)) {
          session.startTime = event.timestamp;
        }
        
        if (new Date(event.timestamp) > new Date(session.endTime)) {
          session.endTime = event.timestamp;
        }
        
        session.duration = new Date(session.endTime) - new Date(session.startTime);
      });
      
      return Object.values(sessions);
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  static getSessionDuration() {
    try {
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        return new Date() - new Date(session.startTime);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  static generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static calculateAverage(numbers) {
    if (!numbers || numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  static cleanupOldEvents() {
    try {
      const events = this.getStoredEvents();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentEvents = events.filter(e => new Date(e.timestamp) >= thirtyDaysAgo);
      
      if (recentEvents.length !== events.length) {
        localStorage.setItem(this.EVENTS_KEY, JSON.stringify(recentEvents));
      }
    } catch (error) {
      console.error('Error cleaning up old events:', error);
    }
  }

  // Analysis helper methods
  static getOverviewMetrics(events) {
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
    const pageViews = events.filter(e => e.type === this.EVENTS.PAGE_VIEW).length;
    const userActions = events.filter(e => e.type === this.EVENTS.FEATURE_USED).length;
    
    return {
      totalEvents: events.length,
      uniqueSessions,
      pageViews,
      userActions,
      averageEventsPerSession: uniqueSessions > 0 ? events.length / uniqueSessions : 0
    };
  }

  static getUserEngagementMetrics(events) {
    const sessions = this.getSessions();
    const averageSessionDuration = this.calculateAverage(sessions.map(s => s.duration));
    const bounceRate = sessions.filter(s => s.events.length === 1).length / sessions.length * 100;
    
    return {
      averageSessionDuration,
      bounceRate,
      totalSessions: sessions.length,
      returningUsers: 0 // Would need user identification for this
    };
  }

  static getScholarshipMetrics(events) {
    const scholarshipViews = events.filter(e => e.type === this.EVENTS.SCHOLARSHIP_VIEWED);
    const scholarshipFavorites = events.filter(e => e.type === this.EVENTS.SCHOLARSHIP_FAVORITED);
    const searches = events.filter(e => e.type === this.EVENTS.SCHOLARSHIP_SEARCHED);
    
    return {
      totalViews: scholarshipViews.length,
      totalFavorites: scholarshipFavorites.length,
      totalSearches: searches.length,
      averageViewsPerSearch: searches.length > 0 ? scholarshipViews.length / searches.length : 0
    };
  }

  static getApplicationMetrics(events) {
    const applicationsStarted = events.filter(e => e.type === this.EVENTS.APPLICATION_STARTED);
    const applicationsSubmitted = events.filter(e => e.type === this.EVENTS.APPLICATION_SUBMITTED);
    
    return {
      applicationsStarted: applicationsStarted.length,
      applicationsSubmitted: applicationsSubmitted.length,
      conversionRate: applicationsStarted.length > 0 ? 
        (applicationsSubmitted.length / applicationsStarted.length) * 100 : 0
    };
  }

  static getEmptyDashboard() {
    return {
      overview: { totalEvents: 0, uniqueSessions: 0, pageViews: 0, userActions: 0 },
      userEngagement: { averageSessionDuration: 0, bounceRate: 0, totalSessions: 0 },
      scholarshipMetrics: { totalViews: 0, totalFavorites: 0, totalSearches: 0 },
      applicationMetrics: { applicationsStarted: 0, applicationsSubmitted: 0, conversionRate: 0 },
      performanceMetrics: {},
      trends: [],
      topPages: [],
      userJourney: []
    };
  }

  static convertEventsToCSV(events) {
    const headers = ['ID', 'Type', 'Timestamp', 'Session ID', 'Properties', 'Context'];
    const rows = events.map(e => [
      e.id,
      e.type,
      e.timestamp,
      e.sessionId,
      JSON.stringify(e.properties),
      JSON.stringify(e.context)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Clear all analytics data
   * @returns {boolean} - Success status
   */
  static clearAllData() {
    try {
      localStorage.removeItem(this.EVENTS_KEY);
      localStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing analytics data:', error);
      return false;
    }
  }
}

export default AnalyticsService;
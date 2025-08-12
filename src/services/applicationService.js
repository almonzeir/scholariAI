/**
 * Scholarship Application Tracking Service
 * Manages scholarship applications, deadlines, and status tracking
 */

export class ApplicationService {
  static STORAGE_KEY = 'scholarai_applications';
  static FAVORITES_KEY = 'scholarai_favorites';
  static REMINDERS_KEY = 'scholarai_reminders';

  /**
   * Initialize the ApplicationService
   * @returns {Promise<boolean>} - Success status
   */
  static async initialize() {
    try {
      // Clean up expired reminders on initialization
      this.cleanupExpiredReminders();
      console.log('ApplicationService initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing ApplicationService:', error);
      return false;
    }
  }

  /**
   * Clean up expired reminders
   */
  static cleanupExpiredReminders() {
    try {
      const reminders = this.getReminders();
      const now = new Date();
      const activeReminders = {};
      
      Object.entries(reminders).forEach(([id, reminder]) => {
        if (new Date(reminder.reminderDate) > now) {
          activeReminders[id] = reminder;
        }
      });
      
      localStorage.setItem(this.REMINDERS_KEY, JSON.stringify(activeReminders));
    } catch (error) {
      console.error('Error cleaning up expired reminders:', error);
    }
  }

  /**
   * Application status constants
   */
  static STATUS = {
    SAVED: 'saved',
    IN_PROGRESS: 'in_progress',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    EXPIRED: 'expired'
  };

  /**
   * Priority levels
   */
  static PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  };

  /**
   * Save scholarship for later application
   * @param {Object} scholarship - Scholarship data
   * @param {Object} notes - User notes
   * @returns {string} - Application ID
   */
  static saveScholarship(scholarship, notes = {}) {
    try {
      const applicationId = this.generateApplicationId();
      const application = {
        id: applicationId,
        scholarshipId: scholarship.id || applicationId,
        scholarship,
        status: this.STATUS.SAVED,
        priority: this.calculatePriority(scholarship),
        notes: {
          userNotes: notes.userNotes || '',
          requirements: notes.requirements || [],
          documents: notes.documents || [],
          ...notes
        },
        timeline: {
          saved: new Date().toISOString(),
          deadline: scholarship.deadline,
          reminderDates: this.calculateReminderDates(scholarship.deadline)
        },
        progress: {
          documentsGathered: 0,
          requirementsMet: 0,
          completionPercentage: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const applications = this.getApplications();
      applications[applicationId] = application;
      this.saveApplications(applications);

      // Set up automatic reminders
      this.setupReminders(application);

      return applicationId;
    } catch (error) {
      console.error('Error saving scholarship:', error);
      throw new Error('Failed to save scholarship');
    }
  }

  /**
   * Update application status
   * @param {string} applicationId - Application ID
   * @param {string} status - New status
   * @param {Object} updates - Additional updates
   * @returns {boolean} - Success status
   */
  static updateApplicationStatus(applicationId, status, updates = {}) {
    try {
      const applications = this.getApplications();
      const application = applications[applicationId];

      if (!application) {
        throw new Error('Application not found');
      }

      // Update status and timeline
      application.status = status;
      application.timeline[status] = new Date().toISOString();
      application.updatedAt = new Date().toISOString();

      // Apply additional updates
      if (updates.notes) {
        application.notes = { ...application.notes, ...updates.notes };
      }

      if (updates.progress) {
        application.progress = { ...application.progress, ...updates.progress };
        application.progress.completionPercentage = this.calculateCompletionPercentage(application);
      }

      if (updates.priority) {
        application.priority = updates.priority;
      }

      applications[applicationId] = application;
      this.saveApplications(applications);

      return true;
    } catch (error) {
      console.error('Error updating application status:', error);
      return false;
    }
  }

  /**
   * Get all applications
   * @param {Object} filters - Filter options
   * @returns {Array} - Applications array
   */
  static getApplications(filters = {}) {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      const applications = storedData ? JSON.parse(storedData) : {};
      let applicationsArray = Object.values(applications);

      // Apply filters
      if (filters.status) {
        applicationsArray = applicationsArray.filter(app => app.status === filters.status);
      }

      if (filters.priority) {
        applicationsArray = applicationsArray.filter(app => app.priority === filters.priority);
      }

      if (filters.deadline) {
        const deadlineDate = new Date(filters.deadline);
        applicationsArray = applicationsArray.filter(app => {
          const appDeadline = new Date(app.timeline.deadline);
          return appDeadline <= deadlineDate;
        });
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        applicationsArray = applicationsArray.filter(app => 
          app.scholarship.title.toLowerCase().includes(searchTerm) ||
          app.scholarship.provider.toLowerCase().includes(searchTerm) ||
          app.notes.userNotes.toLowerCase().includes(searchTerm)
        );
      }

      // Sort by priority and deadline
      applicationsArray.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, sort by deadline
        return new Date(a.timeline.deadline) - new Date(b.timeline.deadline);
      });

      return applicationsArray;
    } catch (error) {
      console.error('Error getting applications:', error);
      return [];
    }
  }

  /**
   * Get single application by ID
   * @param {string} applicationId - Application ID
   * @returns {Object|null} - Application data
   */
  static getApplication(applicationId) {
    try {
      const applications = this.getApplications();
      return applications.find(app => app.id === applicationId) || null;
    } catch (error) {
      console.error('Error getting application:', error);
      return null;
    }
  }

  /**
   * Delete application
   * @param {string} applicationId - Application ID
   * @returns {boolean} - Success status
   */
  static deleteApplication(applicationId) {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      const applications = storedData ? JSON.parse(storedData) : {};

      if (applications[applicationId]) {
        delete applications[applicationId];
        this.saveApplications(applications);
        this.removeReminders(applicationId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting application:', error);
      return false;
    }
  }

  /**
   * Add scholarship to favorites
   * @param {Object} scholarship - Scholarship data
   * @returns {boolean} - Success status
   */
  static addToFavorites(scholarship) {
    try {
      const favorites = this.getFavorites();
      const favoriteId = scholarship.id || this.generateApplicationId();
      
      favorites[favoriteId] = {
        id: favoriteId,
        scholarship,
        addedAt: new Date().toISOString()
      };

      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }

  /**
   * Remove from favorites
   * @param {string} scholarshipId - Scholarship ID
   * @returns {boolean} - Success status
   */
  static removeFromFavorites(scholarshipId) {
    try {
      const favorites = this.getFavorites();
      
      if (favorites[scholarshipId]) {
        delete favorites[scholarshipId];
        localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }

  /**
   * Get favorites
   * @returns {Array} - Favorites array
   */
  static getFavorites() {
    try {
      const storedData = localStorage.getItem(this.FAVORITES_KEY);
      return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
      console.error('Error getting favorites:', error);
      return {};
    }
  }

  /**
   * Check if scholarship is favorited
   * @param {string} scholarshipId - Scholarship ID
   * @returns {boolean} - Is favorited
   */
  static isFavorited(scholarshipId) {
    try {
      const favorites = this.getFavorites();
      return !!favorites[scholarshipId];
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  /**
   * Get application statistics
   * @returns {Object} - Statistics
   */
  static getStatistics() {
    try {
      const applications = this.getApplications();
      const favorites = Object.keys(this.getFavorites()).length;
      
      const stats = {
        total: applications.length,
        favorites,
        byStatus: {},
        byPriority: {},
        upcomingDeadlines: 0,
        averageCompletion: 0
      };

      // Count by status
      Object.values(this.STATUS).forEach(status => {
        stats.byStatus[status] = applications.filter(app => app.status === status).length;
      });

      // Count by priority
      Object.values(this.PRIORITY).forEach(priority => {
        stats.byPriority[priority] = applications.filter(app => app.priority === priority).length;
      });

      // Count upcoming deadlines (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      stats.upcomingDeadlines = applications.filter(app => {
        const deadline = new Date(app.timeline.deadline);
        return deadline <= thirtyDaysFromNow && deadline >= new Date();
      }).length;

      // Calculate average completion
      if (applications.length > 0) {
        const totalCompletion = applications.reduce((sum, app) => sum + app.progress.completionPercentage, 0);
        stats.averageCompletion = Math.round(totalCompletion / applications.length);
      }

      return stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        total: 0,
        favorites: 0,
        byStatus: {},
        byPriority: {},
        upcomingDeadlines: 0,
        averageCompletion: 0
      };
    }
  }

  /**
   * Get upcoming deadlines
   * @param {number} days - Number of days to look ahead
   * @returns {Array} - Applications with upcoming deadlines
   */
  static getUpcomingDeadlines(days = 30) {
    try {
      const applications = this.getApplications();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);
      
      return applications
        .filter(app => {
          const deadline = new Date(app.timeline.deadline);
          return deadline <= cutoffDate && deadline >= new Date() && 
                 app.status !== this.STATUS.SUBMITTED && 
                 app.status !== this.STATUS.EXPIRED;
        })
        .sort((a, b) => new Date(a.timeline.deadline) - new Date(b.timeline.deadline));
    } catch (error) {
      console.error('Error getting upcoming deadlines:', error);
      return [];
    }
  }

  /**
   * Setup automatic reminders for application
   * @param {Object} application - Application data
   */
  static setupReminders(application) {
    try {
      const reminders = this.getReminders();
      
      application.timeline.reminderDates.forEach(reminderDate => {
        const reminderId = `${application.id}_${reminderDate}`;
        
        reminders[reminderId] = {
          id: reminderId,
          applicationId: application.id,
          scholarshipTitle: application.scholarship.title,
          reminderDate,
          deadline: application.timeline.deadline,
          sent: false,
          createdAt: new Date().toISOString()
        };
      });

      localStorage.setItem(this.REMINDERS_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error setting up reminders:', error);
    }
  }

  /**
   * Get pending reminders
   * @returns {Array} - Pending reminders
   */
  static getPendingReminders() {
    try {
      const reminders = this.getReminders();
      const now = new Date();
      
      return Object.values(reminders)
        .filter(reminder => !reminder.sent && new Date(reminder.reminderDate) <= now)
        .sort((a, b) => new Date(a.reminderDate) - new Date(b.reminderDate));
    } catch (error) {
      console.error('Error getting pending reminders:', error);
      return [];
    }
  }

  /**
   * Mark reminder as sent
   * @param {string} reminderId - Reminder ID
   * @returns {boolean} - Success status
   */
  static markReminderSent(reminderId) {
    try {
      const reminders = this.getReminders();
      
      if (reminders[reminderId]) {
        reminders[reminderId].sent = true;
        reminders[reminderId].sentAt = new Date().toISOString();
        localStorage.setItem(this.REMINDERS_KEY, JSON.stringify(reminders));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
      return false;
    }
  }

  // Helper methods
  static generateApplicationId() {
    return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static calculatePriority(scholarship) {
    const deadline = new Date(scholarship.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    const matchScore = scholarship.matchScore || 50;

    if (daysUntilDeadline <= 7) return this.PRIORITY.URGENT;
    if (daysUntilDeadline <= 30 && matchScore >= 80) return this.PRIORITY.HIGH;
    if (matchScore >= 70) return this.PRIORITY.MEDIUM;
    return this.PRIORITY.LOW;
  }

  static calculateReminderDates(deadline) {
    const deadlineDate = new Date(deadline);
    const reminders = [];
    
    // 30 days before
    const thirtyDays = new Date(deadlineDate);
    thirtyDays.setDate(thirtyDays.getDate() - 30);
    if (thirtyDays > new Date()) reminders.push(thirtyDays.toISOString());
    
    // 14 days before
    const fourteenDays = new Date(deadlineDate);
    fourteenDays.setDate(fourteenDays.getDate() - 14);
    if (fourteenDays > new Date()) reminders.push(fourteenDays.toISOString());
    
    // 7 days before
    const sevenDays = new Date(deadlineDate);
    sevenDays.setDate(sevenDays.getDate() - 7);
    if (sevenDays > new Date()) reminders.push(sevenDays.toISOString());
    
    // 3 days before
    const threeDays = new Date(deadlineDate);
    threeDays.setDate(threeDays.getDate() - 3);
    if (threeDays > new Date()) reminders.push(threeDays.toISOString());
    
    // 1 day before
    const oneDay = new Date(deadlineDate);
    oneDay.setDate(oneDay.getDate() - 1);
    if (oneDay > new Date()) reminders.push(oneDay.toISOString());
    
    return reminders;
  }

  static calculateCompletionPercentage(application) {
    const totalSteps = 5; // Documents, requirements, essay, review, submit
    let completedSteps = 0;
    
    if (application.progress.documentsGathered > 0) completedSteps++;
    if (application.progress.requirementsMet > 0) completedSteps++;
    if (application.status === this.STATUS.IN_PROGRESS) completedSteps++;
    if (application.status === this.STATUS.SUBMITTED) completedSteps = totalSteps;
    
    return Math.round((completedSteps / totalSteps) * 100);
  }

  static saveApplications(applications) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(applications));
  }

  static getReminders() {
    try {
      const storedData = localStorage.getItem(this.REMINDERS_KEY);
      return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
      console.error('Error getting reminders:', error);
      return {};
    }
  }

  static removeReminders(applicationId) {
    try {
      const reminders = this.getReminders();
      const updatedReminders = {};
      
      Object.entries(reminders).forEach(([id, reminder]) => {
        if (reminder.applicationId !== applicationId) {
          updatedReminders[id] = reminder;
        }
      });
      
      localStorage.setItem(this.REMINDERS_KEY, JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error removing reminders:', error);
    }
  }

  /**
   * Export applications data
   * @param {string} format - Export format ('json' or 'csv')
   * @returns {string} - Exported data
   */
  static exportApplications(format = 'json') {
    try {
      const applications = this.getApplications();
      
      if (format === 'json') {
        return JSON.stringify(applications, null, 2);
      }
      
      if (format === 'csv') {
        const headers = ['Title', 'Provider', 'Amount', 'Deadline', 'Status', 'Priority', 'Match Score', 'Completion %'];
        const rows = applications.map(app => [
          app.scholarship.title,
          app.scholarship.provider,
          app.scholarship.amount,
          app.timeline.deadline,
          app.status,
          app.priority,
          app.scholarship.matchScore || 'N/A',
          app.progress.completionPercentage
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }
      
      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Error exporting applications:', error);
      throw error;
    }
  }

  /**
   * Clear all application data
   * @returns {boolean} - Success status
   */
  static clearAllData() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.FAVORITES_KEY);
      localStorage.removeItem(this.REMINDERS_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing application data:', error);
      return false;
    }
  }
}

export default ApplicationService;
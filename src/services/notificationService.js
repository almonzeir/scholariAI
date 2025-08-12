/**
 * Notification Service
 * Handles user notifications, reminders, and alerts
 */

import ApplicationService from './applicationService.js';

export class NotificationService {
  static STORAGE_KEY = 'scholarai_notifications';
  static SETTINGS_KEY = 'scholarai_notification_settings';
  static MAX_NOTIFICATIONS = 100;

  /**
   * Initialize the NotificationService
   * @returns {Promise<boolean>} - Success status
   */
  static async initialize() {
    try {
      // Request notification permission if supported
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Set up periodic checks for reminders
      this.startReminderService();
      
      // Clean up old notifications
      this.cleanupOldNotifications();
      
      console.log('NotificationService initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
      return false;
    }
  }

  /**
   * Notification types
   */
  static TYPES = {
    DEADLINE_REMINDER: 'deadline_reminder',
    APPLICATION_UPDATE: 'application_update',
    NEW_SCHOLARSHIP: 'new_scholarship',
    PROFILE_INCOMPLETE: 'profile_incomplete',
    SYSTEM_UPDATE: 'system_update',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info'
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
   * Initialize notification service
   */
  static initialize() {
    try {
      // Request notification permission if supported
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Set up periodic checks for reminders
      this.startReminderService();
      
      // Clean up old notifications
      this.cleanupOldNotifications();
      
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Create a new notification
   * @param {Object} notification - Notification data
   * @returns {string} - Notification ID
   */
  static createNotification({
    type,
    title,
    message,
    priority = this.PRIORITY.MEDIUM,
    actionUrl = null,
    actionText = null,
    data = {},
    persistent = false,
    showBrowserNotification = false
  }) {
    try {
      const notificationId = this.generateNotificationId();
      const notification = {
        id: notificationId,
        type,
        title,
        message,
        priority,
        actionUrl,
        actionText,
        data,
        persistent,
        read: false,
        dismissed: false,
        createdAt: new Date().toISOString(),
        expiresAt: persistent ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      // Store notification
      const notifications = this.getNotifications();
      notifications[notificationId] = notification;
      this.saveNotifications(notifications);

      // Show browser notification if requested and permitted
      if (showBrowserNotification && this.canShowBrowserNotifications()) {
        this.showBrowserNotification(notification);
      }

      // Trigger custom event for UI updates
      this.dispatchNotificationEvent('notification_created', notification);

      return notificationId;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get all notifications
   * @param {Object} filters - Filter options
   * @returns {Array} - Notifications array
   */
  static getNotifications(filters = {}) {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      const notifications = storedData ? JSON.parse(storedData) : {};
      let notificationsArray = Object.values(notifications);

      // Apply filters
      if (filters.unreadOnly) {
        notificationsArray = notificationsArray.filter(n => !n.read);
      }

      if (filters.type) {
        notificationsArray = notificationsArray.filter(n => n.type === filters.type);
      }

      if (filters.priority) {
        notificationsArray = notificationsArray.filter(n => n.priority === filters.priority);
      }

      if (filters.since) {
        const sinceDate = new Date(filters.since);
        notificationsArray = notificationsArray.filter(n => new Date(n.createdAt) >= sinceDate);
      }

      // Remove expired notifications
      notificationsArray = notificationsArray.filter(n => {
        if (!n.expiresAt) return true; // Persistent notifications
        return new Date(n.expiresAt) > new Date();
      });

      // Sort by priority and creation date
      notificationsArray.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return notificationsArray;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {boolean} - Success status
   */
  static markAsRead(notificationId) {
    try {
      const notifications = this.getStoredNotifications();
      
      if (notifications[notificationId]) {
        notifications[notificationId].read = true;
        notifications[notificationId].readAt = new Date().toISOString();
        this.saveNotifications(notifications);
        
        this.dispatchNotificationEvent('notification_read', notifications[notificationId]);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   * @returns {number} - Number of notifications marked as read
   */
  static markAllAsRead() {
    try {
      const notifications = this.getStoredNotifications();
      let count = 0;
      
      Object.values(notifications).forEach(notification => {
        if (!notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
          count++;
        }
      });

      if (count > 0) {
        this.saveNotifications(notifications);
        this.dispatchNotificationEvent('notifications_read_all', { count });
      }

      return count;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Dismiss notification
   * @param {string} notificationId - Notification ID
   * @returns {boolean} - Success status
   */
  static dismissNotification(notificationId) {
    try {
      const notifications = this.getStoredNotifications();
      
      if (notifications[notificationId]) {
        notifications[notificationId].dismissed = true;
        notifications[notificationId].dismissedAt = new Date().toISOString();
        this.saveNotifications(notifications);
        
        this.dispatchNotificationEvent('notification_dismissed', notifications[notificationId]);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error dismissing notification:', error);
      return false;
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {boolean} - Success status
   */
  static deleteNotification(notificationId) {
    try {
      const notifications = this.getStoredNotifications();
      
      if (notifications[notificationId]) {
        delete notifications[notificationId];
        this.saveNotifications(notifications);
        
        this.dispatchNotificationEvent('notification_deleted', { id: notificationId });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Get notification statistics
   * @returns {Object} - Statistics
   */
  static getStatistics() {
    try {
      const notifications = this.getNotifications();
      
      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        byType: {},
        byPriority: {},
        recent: notifications.filter(n => {
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 1);
          return new Date(n.createdAt) >= dayAgo;
        }).length
      };

      // Count by type
      Object.values(this.TYPES).forEach(type => {
        stats.byType[type] = notifications.filter(n => n.type === type).length;
      });

      // Count by priority
      Object.values(this.PRIORITY).forEach(priority => {
        stats.byPriority[priority] = notifications.filter(n => n.priority === priority).length;
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification statistics:', error);
      return {
        total: 0,
        unread: 0,
        byType: {},
        byPriority: {},
        recent: 0
      };
    }
  }

  /**
   * Start reminder service for deadline notifications
   */
  static startReminderService() {
    // Check for reminders every hour
    setInterval(() => {
      this.checkForReminders();
    }, 60 * 60 * 1000);

    // Initial check
    this.checkForReminders();
  }

  /**
   * Check for pending reminders and create notifications
   */
  static checkForReminders() {
    try {
      const pendingReminders = ApplicationService.getPendingReminders();
      
      pendingReminders.forEach(reminder => {
        const daysUntilDeadline = Math.ceil(
          (new Date(reminder.deadline) - new Date()) / (1000 * 60 * 60 * 24)
        );

        let priority = this.PRIORITY.MEDIUM;
        let title = 'Scholarship Deadline Reminder';
        let message = `${reminder.scholarshipTitle} deadline is approaching`;

        if (daysUntilDeadline <= 1) {
          priority = this.PRIORITY.URGENT;
          title = 'Urgent: Scholarship Deadline Tomorrow!';
          message = `${reminder.scholarshipTitle} deadline is tomorrow!`;
        } else if (daysUntilDeadline <= 3) {
          priority = this.PRIORITY.HIGH;
          title = 'Important: Scholarship Deadline Soon';
          message = `${reminder.scholarshipTitle} deadline is in ${daysUntilDeadline} days`;
        } else if (daysUntilDeadline <= 7) {
          priority = this.PRIORITY.HIGH;
          message = `${reminder.scholarshipTitle} deadline is in ${daysUntilDeadline} days`;
        }

        this.createNotification({
          type: this.TYPES.DEADLINE_REMINDER,
          title,
          message,
          priority,
          actionUrl: `/applications/${reminder.applicationId}`,
          actionText: 'View Application',
          data: {
            applicationId: reminder.applicationId,
            deadline: reminder.deadline,
            daysUntilDeadline
          },
          showBrowserNotification: priority === this.PRIORITY.URGENT || priority === this.PRIORITY.HIGH
        });

        // Mark reminder as sent
        ApplicationService.markReminderSent(reminder.id);
      });
    } catch (error) {
      console.error('Error checking for reminders:', error);
    }
  }

  /**
   * Create profile completion reminder
   * @param {Object} profileValidation - Profile validation results
   */
  static createProfileCompletionReminder(profileValidation) {
    if (profileValidation.score >= 80) return; // Profile is complete enough

    const priority = profileValidation.score < 50 ? this.PRIORITY.HIGH : this.PRIORITY.MEDIUM;
    const message = `Your profile is ${profileValidation.score}% complete. Complete it to get better scholarship matches.`;

    this.createNotification({
      type: this.TYPES.PROFILE_INCOMPLETE,
      title: 'Complete Your Profile',
      message,
      priority,
      actionUrl: '/profile',
      actionText: 'Complete Profile',
      data: {
        completionScore: profileValidation.score,
        missingFields: profileValidation.errors.length + profileValidation.warnings.length
      }
    });
  }

  /**
   * Create new scholarship notification
   * @param {Array} scholarships - New scholarships
   * @param {Object} userProfile - User profile for matching
   */
  static createNewScholarshipNotification(scholarships, userProfile) {
    if (!scholarships || scholarships.length === 0) return;

    const highMatchScholarships = scholarships.filter(s => s.matchScore >= 80);
    
    if (highMatchScholarships.length > 0) {
      const message = highMatchScholarships.length === 1 
        ? `New high-match scholarship found: ${highMatchScholarships[0].title}`
        : `${highMatchScholarships.length} new high-match scholarships found`;

      this.createNotification({
        type: this.TYPES.NEW_SCHOLARSHIP,
        title: 'New Scholarship Matches',
        message,
        priority: this.PRIORITY.HIGH,
        actionUrl: '/scholarships',
        actionText: 'View Scholarships',
        data: {
          scholarshipCount: highMatchScholarships.length,
          topMatch: highMatchScholarships[0]
        },
        showBrowserNotification: true
      });
    }
  }

  /**
   * Create success notification
   * @param {string} message - Success message
   * @param {Object} options - Additional options
   */
  static createSuccessNotification(message, options = {}) {
    this.createNotification({
      type: this.TYPES.SUCCESS,
      title: options.title || 'Success',
      message,
      priority: this.PRIORITY.LOW,
      ...options
    });
  }

  /**
   * Create error notification
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   */
  static createErrorNotification(message, options = {}) {
    this.createNotification({
      type: this.TYPES.ERROR,
      title: options.title || 'Error',
      message,
      priority: this.PRIORITY.HIGH,
      persistent: true,
      ...options
    });
  }

  /**
   * Create warning notification
   * @param {string} message - Warning message
   * @param {Object} options - Additional options
   */
  static createWarningNotification(message, options = {}) {
    this.createNotification({
      type: this.TYPES.WARNING,
      title: options.title || 'Warning',
      message,
      priority: this.PRIORITY.MEDIUM,
      ...options
    });
  }

  /**
   * Get notification settings
   * @returns {Object} - Notification settings
   */
  static getSettings() {
    try {
      const storedData = localStorage.getItem(this.SETTINGS_KEY);
      const defaultSettings = {
        browserNotifications: true,
        deadlineReminders: true,
        newScholarshipAlerts: true,
        profileReminders: true,
        emailNotifications: false,
        reminderDays: [30, 14, 7, 3, 1],
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      };

      return storedData ? { ...defaultSettings, ...JSON.parse(storedData) } : defaultSettings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {};
    }
  }

  /**
   * Update notification settings
   * @param {Object} settings - New settings
   * @returns {boolean} - Success status
   */
  static updateSettings(settings) {
    try {
      const currentSettings = this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
      
      this.dispatchNotificationEvent('settings_updated', updatedSettings);
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }

  // Helper methods
  static generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getStoredNotifications() {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return {};
    }
  }

  static saveNotifications(notifications) {
    try {
      // Limit the number of stored notifications
      const notificationsArray = Object.values(notifications);
      if (notificationsArray.length > this.MAX_NOTIFICATIONS) {
        // Keep only the most recent notifications
        const sortedNotifications = notificationsArray
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, this.MAX_NOTIFICATIONS);
        
        const limitedNotifications = {};
        sortedNotifications.forEach(n => {
          limitedNotifications[n.id] = n;
        });
        
        notifications = limitedNotifications;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  static canShowBrowserNotifications() {
    return 'Notification' in window && 
           Notification.permission === 'granted' && 
           this.getSettings().browserNotifications;
  }

  static showBrowserNotification(notification) {
    try {
      if (!this.canShowBrowserNotifications()) return;

      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === this.PRIORITY.URGENT
      });

      browserNotification.onclick = () => {
        if (notification.actionUrl) {
          window.focus();
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== this.PRIORITY.URGENT) {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  static dispatchNotificationEvent(eventType, data) {
    try {
      const event = new CustomEvent(`scholarai_${eventType}`, {
        detail: data
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error dispatching notification event:', error);
    }
  }

  static cleanupOldNotifications() {
    try {
      const notifications = this.getStoredNotifications();
      const now = new Date();
      let cleaned = false;

      Object.entries(notifications).forEach(([id, notification]) => {
        // Remove expired non-persistent notifications
        if (notification.expiresAt && new Date(notification.expiresAt) < now) {
          delete notifications[id];
          cleaned = true;
        }
        
        // Remove very old dismissed notifications
        if (notification.dismissed && notification.dismissedAt) {
          const dismissedDate = new Date(notification.dismissedAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (dismissedDate < thirtyDaysAgo) {
            delete notifications[id];
            cleaned = true;
          }
        }
      });

      if (cleaned) {
        this.saveNotifications(notifications);
      }
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  /**
   * Clear all notifications
   * @returns {boolean} - Success status
   */
  static clearAllNotifications() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.dispatchNotificationEvent('notifications_cleared', {});
      return true;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      return false;
    }
  }

  /**
   * Export notifications data
   * @param {string} format - Export format ('json' or 'csv')
   * @returns {string} - Exported data
   */
  static exportNotifications(format = 'json') {
    try {
      const notifications = this.getNotifications();
      
      if (format === 'json') {
        return JSON.stringify(notifications, null, 2);
      }
      
      if (format === 'csv') {
        const headers = ['ID', 'Type', 'Title', 'Message', 'Priority', 'Read', 'Created At'];
        const rows = notifications.map(n => [
          n.id,
          n.type,
          n.title,
          n.message,
          n.priority,
          n.read ? 'Yes' : 'No',
          n.createdAt
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }
      
      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Error exporting notifications:', error);
      throw error;
    }
  }
}

export default NotificationService;
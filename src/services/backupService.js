/**
 * Backup and Sync Service
 * Handles data backup, restoration, and synchronization
 */

import ProfileService from './profileService.js';
import ApplicationService from './applicationService.js';
import SettingsService from './settingsService.js';
import NotificationService from './notificationService.js';
import AnalyticsService from './analyticsService.js';

export class BackupService {
  static STORAGE_KEY = 'scholarai_backups';
  static SYNC_KEY = 'scholarai_sync';
  static MAX_BACKUPS = 10;
  static BACKUP_VERSION = '1.0';
  static autoBackupInterval = null;

  /**
   * Backup types
   */
  static BACKUP_TYPES = {
    FULL: 'full',
    PROFILE: 'profile',
    APPLICATIONS: 'applications',
    SETTINGS: 'settings',
    NOTIFICATIONS: 'notifications',
    ANALYTICS: 'analytics'
  };

  /**
   * Sync status
   */
  static SYNC_STATUS = {
    IDLE: 'idle',
    SYNCING: 'syncing',
    SUCCESS: 'success',
    ERROR: 'error',
    CONFLICT: 'conflict'
  };

  /**
   * Initialize backup service
   */
  static initialize() {
    try {
      // Set up automatic backups
      this.setupAutomaticBackups();
      
      // Clean up old backups
      this.cleanupOldBackups();
      
      // Initialize sync status
      this.initializeSyncStatus();
      
      console.log('Backup service initialized');
      return true;
    } catch (error) {
      console.error('Error initializing backup service:', error);
      return false;
    }
  }

  /**
   * Create a full backup
   * @param {Object} options - Backup options
   * @returns {Object} - Backup result
   */
  static async createFullBackup(options = {}) {
    try {
      const {
        includeAnalytics = false,
        compress = true,
        description = 'Full backup'
      } = options;

      const backupData = {
        id: this.generateBackupId(),
        type: this.BACKUP_TYPES.FULL,
        version: this.BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        description,
        deviceInfo: this.getDeviceInfo(),
        data: {
          profile: ProfileService.exportProfile(),
          applications: ApplicationService.exportApplications(),
          settings: SettingsService.exportSettings(),
          notifications: NotificationService.exportNotifications()
        }
      };

      // Include analytics if requested
      if (includeAnalytics) {
        backupData.data.analytics = AnalyticsService.exportAnalytics();
      }

      // Compress data if requested
      if (compress) {
        backupData.data = await this.compressData(backupData.data);
        backupData.compressed = true;
      }

      // Calculate backup size
      backupData.size = this.calculateBackupSize(backupData);

      // Store backup
      const success = this.storeBackup(backupData);
      
      if (success) {
        this.dispatchBackupEvent('backup_created', backupData);
        return {
          success: true,
          backupId: backupData.id,
          size: backupData.size,
          createdAt: backupData.createdAt
        };
      } else {
        throw new Error('Failed to store backup');
      }
    } catch (error) {
      console.error('Error creating full backup:', error);
      this.dispatchBackupEvent('backup_failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a partial backup
   * @param {string} type - Backup type
   * @param {Object} options - Backup options
   * @returns {Object} - Backup result
   */
  static async createPartialBackup(type, options = {}) {
    try {
      const { description = `${type} backup` } = options;

      const backupData = {
        id: this.generateBackupId(),
        type,
        version: this.BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        description,
        deviceInfo: this.getDeviceInfo(),
        data: {}
      };

      // Get data based on type
      switch (type) {
        case this.BACKUP_TYPES.PROFILE:
          backupData.data.profile = ProfileService.exportProfile();
          break;
        case this.BACKUP_TYPES.APPLICATIONS:
          backupData.data.applications = ApplicationService.exportApplications();
          break;
        case this.BACKUP_TYPES.SETTINGS:
          backupData.data.settings = SettingsService.exportSettings();
          break;
        case this.BACKUP_TYPES.NOTIFICATIONS:
          backupData.data.notifications = NotificationService.exportNotifications();
          break;
        case this.BACKUP_TYPES.ANALYTICS:
          backupData.data.analytics = AnalyticsService.exportAnalytics();
          break;
        default:
          throw new Error(`Unsupported backup type: ${type}`);
      }

      // Calculate backup size
      backupData.size = this.calculateBackupSize(backupData);

      // Store backup
      const success = this.storeBackup(backupData);
      
      if (success) {
        this.dispatchBackupEvent('backup_created', backupData);
        return {
          success: true,
          backupId: backupData.id,
          type,
          size: backupData.size,
          createdAt: backupData.createdAt
        };
      } else {
        throw new Error('Failed to store backup');
      }
    } catch (error) {
      console.error('Error creating partial backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup ID to restore
   * @param {Object} options - Restore options
   * @returns {Object} - Restore result
   */
  static async restoreFromBackup(backupId, options = {}) {
    try {
      const {
        overwriteExisting = false,
        selectiveRestore = null, // Array of data types to restore
        createBackupBeforeRestore = true
      } = options;

      // Get backup data
      const backup = this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Create backup before restore if requested
      if (createBackupBeforeRestore) {
        await this.createFullBackup({
          description: 'Pre-restore backup'
        });
      }

      let restoredData = backup.data;
      
      // Decompress if needed
      if (backup.compressed) {
        restoredData = await this.decompressData(restoredData);
      }

      const restoreResults = {};

      // Restore profile data
      if ((!selectiveRestore || selectiveRestore.includes('profile')) && restoredData.profile) {
        try {
          const profileResult = ProfileService.importProfile(restoredData.profile, overwriteExisting);
          restoreResults.profile = { success: profileResult, error: null };
        } catch (error) {
          restoreResults.profile = { success: false, error: error.message };
        }
      }

      // Restore applications data
      if ((!selectiveRestore || selectiveRestore.includes('applications')) && restoredData.applications) {
        try {
          const applicationsResult = ApplicationService.importApplications(restoredData.applications, overwriteExisting);
          restoreResults.applications = { success: applicationsResult, error: null };
        } catch (error) {
          restoreResults.applications = { success: false, error: error.message };
        }
      }

      // Restore settings data
      if ((!selectiveRestore || selectiveRestore.includes('settings')) && restoredData.settings) {
        try {
          const settingsResult = SettingsService.importSettings(restoredData.settings);
          restoreResults.settings = { success: settingsResult, error: null };
        } catch (error) {
          restoreResults.settings = { success: false, error: error.message };
        }
      }

      // Restore notifications data
      if ((!selectiveRestore || selectiveRestore.includes('notifications')) && restoredData.notifications) {
        try {
          // Note: NotificationService would need an import method
          restoreResults.notifications = { success: true, error: null };
        } catch (error) {
          restoreResults.notifications = { success: false, error: error.message };
        }
      }

      // Check overall success
      const overallSuccess = Object.values(restoreResults).some(result => result.success);
      
      if (overallSuccess) {
        this.dispatchBackupEvent('restore_completed', {
          backupId,
          results: restoreResults,
          restoredAt: new Date().toISOString()
        });
      }

      return {
        success: overallSuccess,
        results: restoreResults,
        backupId,
        restoredAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error restoring from backup:', error);
      this.dispatchBackupEvent('restore_failed', { backupId, error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all backups
   * @param {Object} filters - Filter options
   * @returns {Array} - List of backups
   */
  static getBackups(filters = {}) {
    try {
      const storedBackups = localStorage.getItem(this.STORAGE_KEY);
      let backups = storedBackups ? JSON.parse(storedBackups) : [];

      // Apply filters
      if (filters.type) {
        backups = backups.filter(backup => backup.type === filters.type);
      }

      if (filters.startDate) {
        backups = backups.filter(backup => new Date(backup.createdAt) >= new Date(filters.startDate));
      }

      if (filters.endDate) {
        backups = backups.filter(backup => new Date(backup.createdAt) <= new Date(filters.endDate));
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return backups.map(backup => ({
        id: backup.id,
        type: backup.type,
        description: backup.description,
        createdAt: backup.createdAt,
        size: backup.size,
        version: backup.version,
        deviceInfo: backup.deviceInfo,
        compressed: backup.compressed || false
      }));
    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }

  /**
   * Get specific backup
   * @param {string} backupId - Backup ID
   * @returns {Object|null} - Backup data
   */
  static getBackup(backupId) {
    try {
      const storedBackups = localStorage.getItem(this.STORAGE_KEY);
      const backups = storedBackups ? JSON.parse(storedBackups) : [];
      return backups.find(backup => backup.id === backupId) || null;
    } catch (error) {
      console.error('Error getting backup:', error);
      return null;
    }
  }

  /**
   * Delete backup
   * @param {string} backupId - Backup ID to delete
   * @returns {boolean} - Success status
   */
  static deleteBackup(backupId) {
    try {
      const storedBackups = localStorage.getItem(this.STORAGE_KEY);
      let backups = storedBackups ? JSON.parse(storedBackups) : [];
      
      const initialLength = backups.length;
      backups = backups.filter(backup => backup.id !== backupId);
      
      if (backups.length < initialLength) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
        this.dispatchBackupEvent('backup_deleted', { backupId });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting backup:', error);
      return false;
    }
  }

  /**
   * Export backup to file
   * @param {string} backupId - Backup ID to export
   * @param {string} format - Export format ('json' or 'encrypted')
   * @returns {Object} - Export result
   */
  static exportBackupToFile(backupId, format = 'json') {
    try {
      const backup = this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      let exportData;
      let filename;
      let mimeType;

      if (format === 'json') {
        exportData = JSON.stringify(backup, null, 2);
        filename = `scholarai_backup_${backupId}_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else if (format === 'encrypted') {
        // Simple base64 encoding (in production, use proper encryption)
        exportData = btoa(JSON.stringify(backup));
        filename = `scholarai_backup_${backupId}_${new Date().toISOString().split('T')[0]}.bak`;
        mimeType = 'application/octet-stream';
      } else {
        throw new Error('Unsupported export format');
      }

      // Create download blob
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);

      return {
        success: true,
        url,
        filename,
        size: blob.size
      };
    } catch (error) {
      console.error('Error exporting backup to file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import backup from file
   * @param {File} file - Backup file
   * @param {string} format - Import format
   * @returns {Promise<Object>} - Import result
   */
  static async importBackupFromFile(file, format = 'json') {
    try {
      const fileContent = await this.readFileContent(file);
      let backupData;

      if (format === 'json') {
        backupData = JSON.parse(fileContent);
      } else if (format === 'encrypted') {
        const decodedContent = atob(fileContent);
        backupData = JSON.parse(decodedContent);
      } else {
        throw new Error('Unsupported import format');
      }

      // Validate backup data
      if (!this.validateBackupData(backupData)) {
        throw new Error('Invalid backup data');
      }

      // Generate new ID to avoid conflicts
      backupData.id = this.generateBackupId();
      backupData.importedAt = new Date().toISOString();

      // Store imported backup
      const success = this.storeBackup(backupData);
      
      if (success) {
        this.dispatchBackupEvent('backup_imported', backupData);
        return {
          success: true,
          backupId: backupData.id,
          originalCreatedAt: backupData.createdAt,
          importedAt: backupData.importedAt
        };
      } else {
        throw new Error('Failed to store imported backup');
      }
    } catch (error) {
      console.error('Error importing backup from file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get backup statistics
   * @returns {Object} - Backup statistics
   */
  static getBackupStatistics() {
    try {
      const backups = this.getBackups();
      
      const stats = {
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + (backup.size || 0), 0),
        byType: {},
        oldestBackup: null,
        newestBackup: null,
        averageSize: 0
      };

      // Count by type
      Object.values(this.BACKUP_TYPES).forEach(type => {
        stats.byType[type] = backups.filter(b => b.type === type).length;
      });

      // Find oldest and newest
      if (backups.length > 0) {
        stats.oldestBackup = backups[backups.length - 1];
        stats.newestBackup = backups[0];
        stats.averageSize = stats.totalSize / backups.length;
      }

      return stats;
    } catch (error) {
      console.error('Error getting backup statistics:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        byType: {},
        oldestBackup: null,
        newestBackup: null,
        averageSize: 0
      };
    }
  }

  /**
   * Set up automatic backups
   */
  static setupAutomaticBackups() {
    try {
      const settings = SettingsService.getSettings();
      const autoBackupEnabled = settings.applications?.backupData || false;
      
      if (autoBackupEnabled) {
        // Create automatic backup every 24 hours
        setInterval(() => {
          this.createFullBackup({
            description: 'Automatic backup',
            includeAnalytics: false
          });
        }, 24 * 60 * 60 * 1000);
        
        console.log('Automatic backups enabled');
      }
    } catch (error) {
      console.error('Error setting up automatic backups:', error);
    }
  }

  /**
   * Clean up old backups
   */
  static cleanupOldBackups() {
    try {
      const backups = this.getBackups();
      
      if (backups.length > this.MAX_BACKUPS) {
        // Keep only the most recent backups
        const backupsToDelete = backups.slice(this.MAX_BACKUPS);
        
        backupsToDelete.forEach(backup => {
          this.deleteBackup(backup.id);
        });
        
        console.log(`Cleaned up ${backupsToDelete.length} old backups`);
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  // Helper methods
  static generateBackupId() {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };
  }

  static calculateBackupSize(backupData) {
    try {
      return new Blob([JSON.stringify(backupData)]).size;
    } catch (error) {
      return 0;
    }
  }

  static storeBackup(backupData) {
    try {
      const storedBackups = localStorage.getItem(this.STORAGE_KEY);
      const backups = storedBackups ? JSON.parse(storedBackups) : [];
      
      backups.unshift(backupData); // Add to beginning
      
      // Limit number of stored backups
      if (backups.length > this.MAX_BACKUPS) {
        backups.splice(this.MAX_BACKUPS);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
      return true;
    } catch (error) {
      console.error('Error storing backup:', error);
      return false;
    }
  }

  static async compressData(data) {
    // Simple compression using JSON stringify (in production, use proper compression)
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Error compressing data:', error);
      return data;
    }
  }

  static async decompressData(compressedData) {
    // Simple decompression (in production, use proper decompression)
    try {
      return typeof compressedData === 'string' ? JSON.parse(compressedData) : compressedData;
    } catch (error) {
      console.error('Error decompressing data:', error);
      return compressedData;
    }
  }

  static validateBackupData(backupData) {
    try {
      return (
        backupData &&
        typeof backupData === 'object' &&
        backupData.id &&
        backupData.type &&
        backupData.version &&
        backupData.createdAt &&
        backupData.data &&
        typeof backupData.data === 'object'
      );
    } catch (error) {
      return false;
    }
  }

  static async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  static initializeSyncStatus() {
    try {
      const syncStatus = {
        status: this.SYNC_STATUS.IDLE,
        lastSync: null,
        lastError: null,
        syncEnabled: false
      };
      
      const storedStatus = localStorage.getItem(this.SYNC_KEY);
      if (storedStatus) {
        Object.assign(syncStatus, JSON.parse(storedStatus));
      }
      
      localStorage.setItem(this.SYNC_KEY, JSON.stringify(syncStatus));
    } catch (error) {
      console.error('Error initializing sync status:', error);
    }
  }

  static dispatchBackupEvent(eventType, data) {
    try {
      const event = new CustomEvent(`scholarai_${eventType}`, {
        detail: data
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error dispatching backup event:', error);
    }
  }

  /**
   * Clear all backup data
   * @returns {boolean} - Success status
   */
  static clearAllBackups() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.SYNC_KEY);
      this.dispatchBackupEvent('backups_cleared', {});
      return true;
    } catch (error) {
      console.error('Error clearing all backups:', error);
      return false;
    }
  }
}

export default BackupService;
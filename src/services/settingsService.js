/**
 * Settings Management Service
 * Handles user preferences, application configuration, and system settings
 */

export class SettingsService {
  static STORAGE_KEY = 'scholarai_settings';
  static THEME_KEY = 'scholarai_theme';
  static LANGUAGE_KEY = 'scholarai_language';

  /**
   * Initialize the SettingsService
   * @returns {Promise<boolean>} - Success status
   */
  static async initialize() {
    try {
      // Apply saved theme and settings on initialization
      this.applyTheme();
      this.applyAccessibilitySettings();
      
      console.log('SettingsService initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing SettingsService:', error);
      return false;
    }
  }
  static CONFIG_KEY = 'scholarai_config';

  /**
   * Default settings configuration
   */
  static DEFAULT_SETTINGS = {
    // Appearance
    theme: 'light', // 'light', 'dark', 'auto'
    language: 'en',
    fontSize: 'medium', // 'small', 'medium', 'large'
    compactMode: false,
    animations: true,
    
    // Notifications
    notifications: {
      browser: true,
      email: false,
      deadlineReminders: true,
      newScholarships: true,
      applicationUpdates: true,
      profileReminders: true,
      reminderDays: [30, 14, 7, 3, 1],
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    },
    
    // Privacy
    privacy: {
      analytics: true,
      crashReporting: true,
      dataSharing: false,
      profileVisibility: 'private', // 'private', 'limited', 'public'
      searchHistory: true,
      autoSave: true
    },
    
    // Search & Filtering
    search: {
      defaultSortBy: 'relevance', // 'relevance', 'deadline', 'amount', 'match_score'
      defaultSortOrder: 'desc', // 'asc', 'desc'
      resultsPerPage: 20,
      autoApplyFilters: false,
      saveSearchHistory: true,
      showMatchScores: true,
      highlightKeywords: true
    },
    
    // Applications
    applications: {
      autoSave: true,
      autoSaveInterval: 30, // seconds
      reminderFrequency: 'weekly', // 'daily', 'weekly', 'monthly'
      showProgress: true,
      backupData: true,
      exportFormat: 'pdf' // 'pdf', 'docx', 'txt'
    },
    
    // Profile
    profile: {
      autoComplete: true,
      showCompletionTips: true,
      validateOnSave: true,
      backupProfile: true,
      syncAcrossDevices: false
    },
    
    // Performance
    performance: {
      enableCaching: true,
      preloadImages: true,
      lazyLoading: true,
      compressionLevel: 'medium', // 'low', 'medium', 'high'
      offlineMode: false
    },
    
    // Accessibility
    accessibility: {
      highContrast: false,
      reduceMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      focusIndicators: true,
      altTextImages: true
    },
    
    // Advanced
    advanced: {
      debugMode: false,
      experimentalFeatures: false,
      apiTimeout: 30000, // milliseconds
      maxRetries: 3,
      logLevel: 'info' // 'debug', 'info', 'warn', 'error'
    }
  };

  /**
   * Initialize settings service
   */
  static initialize() {
    try {
      // Load and validate settings
      const settings = this.getSettings();
      
      // Apply theme
      this.applyTheme(settings.theme);
      
      // Apply accessibility settings
      this.applyAccessibilitySettings(settings.accessibility);
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('Settings service initialized');
      return true;
    } catch (error) {
      console.error('Error initializing settings service:', error);
      return false;
    }
  }

  /**
   * Get all settings
   * @returns {Object} - Complete settings object
   */
  static getSettings() {
    try {
      const storedSettings = localStorage.getItem(this.STORAGE_KEY);
      const settings = storedSettings ? JSON.parse(storedSettings) : {};
      
      // Merge with defaults to ensure all settings exist
      return this.mergeWithDefaults(settings);
    } catch (error) {
      console.error('Error getting settings:', error);
      return this.DEFAULT_SETTINGS;
    }
  }

  /**
   * Update settings
   * @param {Object} newSettings - Settings to update
   * @param {boolean} merge - Whether to merge with existing settings
   * @returns {boolean} - Success status
   */
  static updateSettings(newSettings, merge = true) {
    try {
      let settings;
      
      if (merge) {
        const currentSettings = this.getSettings();
        settings = this.deepMerge(currentSettings, newSettings);
      } else {
        settings = this.mergeWithDefaults(newSettings);
      }
      
      // Validate settings
      const validatedSettings = this.validateSettings(settings);
      
      // Save settings
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validatedSettings));
      
      // Apply immediate changes
      this.applySettingsChanges(newSettings);
      
      // Dispatch settings updated event
      this.dispatchSettingsEvent('settings_updated', validatedSettings);
      
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }

  /**
   * Get specific setting value
   * @param {string} path - Dot notation path to setting (e.g., 'notifications.browser')
   * @param {*} defaultValue - Default value if setting doesn't exist
   * @returns {*} - Setting value
   */
  static getSetting(path, defaultValue = null) {
    try {
      const settings = this.getSettings();
      return this.getNestedValue(settings, path, defaultValue);
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  }

  /**
   * Update specific setting
   * @param {string} path - Dot notation path to setting
   * @param {*} value - New value
   * @returns {boolean} - Success status
   */
  static updateSetting(path, value) {
    try {
      const settings = this.getSettings();
      this.setNestedValue(settings, path, value);
      return this.updateSettings(settings, false);
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  }

  /**
   * Reset settings to defaults
   * @param {Array} categories - Specific categories to reset (optional)
   * @returns {boolean} - Success status
   */
  static resetSettings(categories = null) {
    try {
      if (categories) {
        const currentSettings = this.getSettings();
        categories.forEach(category => {
          if (this.DEFAULT_SETTINGS[category]) {
            currentSettings[category] = { ...this.DEFAULT_SETTINGS[category] };
          }
        });
        return this.updateSettings(currentSettings, false);
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
        const defaultSettings = { ...this.DEFAULT_SETTINGS };
        this.applySettingsChanges(defaultSettings);
        this.dispatchSettingsEvent('settings_reset', defaultSettings);
        return true;
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }

  /**
   * Export settings
   * @param {string} format - Export format ('json' or 'txt')
   * @returns {string} - Exported settings
   */
  static exportSettings(format = 'json') {
    try {
      const settings = this.getSettings();
      const exportData = {
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        application: 'ScholarAI'
      };
      
      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      }
      
      if (format === 'txt') {
        return this.convertSettingsToText(settings);
      }
      
      throw new Error('Unsupported export format');
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  /**
   * Import settings
   * @param {string} settingsData - Settings data to import
   * @param {string} format - Import format ('json' or 'txt')
   * @returns {boolean} - Success status
   */
  static importSettings(settingsData, format = 'json') {
    try {
      let importedSettings;
      
      if (format === 'json') {
        const data = JSON.parse(settingsData);
        importedSettings = data.settings || data;
      } else {
        throw new Error('Text import not yet implemented');
      }
      
      // Validate imported settings
      const validatedSettings = this.validateSettings(importedSettings);
      
      // Update settings
      const success = this.updateSettings(validatedSettings, false);
      
      if (success) {
        this.dispatchSettingsEvent('settings_imported', validatedSettings);
      }
      
      return success;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }

  /**
   * Get theme settings
   * @returns {Object} - Theme configuration
   */
  static getThemeSettings() {
    const theme = this.getSetting('theme', 'light');
    const accessibility = this.getSetting('accessibility', {});
    
    return {
      theme,
      highContrast: accessibility.highContrast || false,
      reduceMotion: accessibility.reduceMotion || false,
      fontSize: this.getSetting('fontSize', 'medium'),
      compactMode: this.getSetting('compactMode', false),
      animations: this.getSetting('animations', true)
    };
  }

  /**
   * Apply theme changes
   * @param {string} theme - Theme name
   */
  static applyTheme(theme) {
    try {
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.classList.remove('theme-light', 'theme-dark', 'theme-auto');
      
      // Apply new theme
      if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
      } else {
        root.classList.add(`theme-${theme}`);
      }
      
      // Store theme preference
      localStorage.setItem(this.THEME_KEY, theme);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }

  /**
   * Apply accessibility settings
   * @param {Object} accessibilitySettings - Accessibility configuration
   */
  static applyAccessibilitySettings(accessibilitySettings) {
    try {
      const root = document.documentElement;
      
      // High contrast
      if (accessibilitySettings.highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }
      
      // Reduce motion
      if (accessibilitySettings.reduceMotion) {
        root.classList.add('reduce-motion');
      } else {
        root.classList.remove('reduce-motion');
      }
      
      // Focus indicators
      if (accessibilitySettings.focusIndicators) {
        root.classList.add('focus-indicators');
      } else {
        root.classList.remove('focus-indicators');
      }
    } catch (error) {
      console.error('Error applying accessibility settings:', error);
    }
  }

  /**
   * Get user preferences for specific features
   * @param {string} feature - Feature name
   * @returns {Object} - Feature preferences
   */
  static getFeaturePreferences(feature) {
    const preferences = {
      search: () => this.getSetting('search', {}),
      notifications: () => this.getSetting('notifications', {}),
      applications: () => this.getSetting('applications', {}),
      profile: () => this.getSetting('profile', {}),
      privacy: () => this.getSetting('privacy', {})
    };
    
    return preferences[feature] ? preferences[feature]() : {};
  }

  /**
   * Check if feature is enabled
   * @param {string} featurePath - Path to feature setting
   * @returns {boolean} - Whether feature is enabled
   */
  static isFeatureEnabled(featurePath) {
    return this.getSetting(featurePath, false) === true;
  }

  /**
   * Get performance settings
   * @returns {Object} - Performance configuration
   */
  static getPerformanceSettings() {
    return this.getSetting('performance', {});
  }

  /**
   * Validate settings object
   * @param {Object} settings - Settings to validate
   * @returns {Object} - Validated settings
   */
  static validateSettings(settings) {
    try {
      const validated = { ...settings };
      
      // Validate theme
      if (!['light', 'dark', 'auto'].includes(validated.theme)) {
        validated.theme = 'light';
      }
      
      // Validate language
      if (typeof validated.language !== 'string') {
        validated.language = 'en';
      }
      
      // Validate fontSize
      if (!['small', 'medium', 'large'].includes(validated.fontSize)) {
        validated.fontSize = 'medium';
      }
      
      // Validate notification reminder days
      if (validated.notifications && validated.notifications.reminderDays) {
        validated.notifications.reminderDays = validated.notifications.reminderDays
          .filter(day => typeof day === 'number' && day > 0 && day <= 365)
          .sort((a, b) => b - a); // Sort descending
      }
      
      // Validate API timeout
      if (validated.advanced && validated.advanced.apiTimeout) {
        const timeout = validated.advanced.apiTimeout;
        if (typeof timeout !== 'number' || timeout < 1000 || timeout > 300000) {
          validated.advanced.apiTimeout = 30000; // 30 seconds default
        }
      }
      
      return validated;
    } catch (error) {
      console.error('Error validating settings:', error);
      return this.DEFAULT_SETTINGS;
    }
  }

  /**
   * Apply immediate setting changes
   * @param {Object} changedSettings - Settings that changed
   */
  static applySettingsChanges(changedSettings) {
    try {
      // Apply theme changes
      if (changedSettings.theme) {
        this.applyTheme(changedSettings.theme);
      }
      
      // Apply accessibility changes
      if (changedSettings.accessibility) {
        this.applyAccessibilitySettings(changedSettings.accessibility);
      }
      
      // Apply font size changes
      if (changedSettings.fontSize) {
        document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
        document.documentElement.classList.add(`font-${changedSettings.fontSize}`);
      }
      
      // Apply compact mode
      if (typeof changedSettings.compactMode === 'boolean') {
        if (changedSettings.compactMode) {
          document.documentElement.classList.add('compact-mode');
        } else {
          document.documentElement.classList.remove('compact-mode');
        }
      }
      
      // Apply animations setting
      if (typeof changedSettings.animations === 'boolean') {
        if (changedSettings.animations) {
          document.documentElement.classList.remove('no-animations');
        } else {
          document.documentElement.classList.add('no-animations');
        }
      }
    } catch (error) {
      console.error('Error applying settings changes:', error);
    }
  }

  /**
   * Set up event listeners for settings
   */
  static setupEventListeners() {
    try {
      // Listen for system theme changes
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
          const currentTheme = this.getSetting('theme');
          if (currentTheme === 'auto') {
            this.applyTheme('auto');
          }
        });
      }
      
      // Listen for reduced motion preference changes
      if (window.matchMedia) {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionQuery.addEventListener('change', (e) => {
          if (e.matches && !this.getSetting('accessibility.reduceMotion')) {
            this.updateSetting('accessibility.reduceMotion', true);
          }
        });
      }
    } catch (error) {
      console.error('Error setting up settings event listeners:', error);
    }
  }

  // Helper methods
  static mergeWithDefaults(settings) {
    return this.deepMerge(this.DEFAULT_SETTINGS, settings);
  }

  static deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  static getNestedValue(obj, path, defaultValue = null) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }

  static setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  static convertSettingsToText(settings) {
    let text = 'ScholarAI Settings\n';
    text += '===================\n\n';
    
    const formatSection = (obj, indent = 0) => {
      let result = '';
      const spaces = '  '.repeat(indent);
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result += `${spaces}${key}:\n`;
          result += formatSection(value, indent + 1);
        } else {
          result += `${spaces}${key}: ${JSON.stringify(value)}\n`;
        }
      }
      
      return result;
    };
    
    text += formatSection(settings);
    text += `\nExported at: ${new Date().toISOString()}\n`;
    
    return text;
  }

  static dispatchSettingsEvent(eventType, data) {
    try {
      const event = new CustomEvent(`scholarai_${eventType}`, {
        detail: data
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error dispatching settings event:', error);
    }
  }

  /**
   * Get settings summary for display
   * @returns {Object} - Settings summary
   */
  static getSettingsSummary() {
    try {
      const settings = this.getSettings();
      
      return {
        theme: settings.theme,
        language: settings.language,
        notifications: {
          enabled: settings.notifications.browser,
          reminders: settings.notifications.deadlineReminders
        },
        privacy: {
          analytics: settings.privacy.analytics,
          dataSharing: settings.privacy.dataSharing
        },
        accessibility: {
          highContrast: settings.accessibility.highContrast,
          reduceMotion: settings.accessibility.reduceMotion
        },
        performance: {
          caching: settings.performance.enableCaching,
          offlineMode: settings.performance.offlineMode
        }
      };
    } catch (error) {
      console.error('Error getting settings summary:', error);
      return {};
    }
  }

  /**
   * Clear all settings data
   * @returns {boolean} - Success status
   */
  static clearAllSettings() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.THEME_KEY);
      localStorage.removeItem(this.PREFERENCES_KEY);
      localStorage.removeItem(this.CONFIG_KEY);
      
      // Reset to defaults
      this.applySettingsChanges(this.DEFAULT_SETTINGS);
      this.dispatchSettingsEvent('settings_cleared', {});
      
      return true;
    } catch (error) {
      console.error('Error clearing settings:', error);
      return false;
    }
  }
}

export default SettingsService;
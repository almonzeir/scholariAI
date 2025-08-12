import React, { useState, useEffect } from 'react';
import SettingsService from '../services/settingsService';
import BackupService from '../services/backupService';
import AnalyticsService from '../services/analyticsService';

const SettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupStats, setBackupStats] = useState({});
  const [importFile, setImportFile] = useState(null);

  useEffect(() => {
    loadSettings();
    loadBackupStats();
    AnalyticsService.trackPageView('/settings');
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const allSettings = SettingsService.getAllSettings();
      setSettings(allSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBackupStats = () => {
    try {
      const stats = BackupService.getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      console.error('Error loading backup stats:', error);
    }
  };

  const handleSettingChange = (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    setSettings(newSettings);
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Save each category
      for (const [category, categorySettings] of Object.entries(settings)) {
        for (const [key, value] of Object.entries(categorySettings)) {
          SettingsService.updateSetting(category, key, value);
        }
      }
      
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
        action: 'save_settings',
        categories: Object.keys(settings)
      });
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      try {
        SettingsService.resetAllSettings();
        loadSettings();
        
        AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
          action: 'reset_settings'
        });
        
        alert('Settings reset to default successfully!');
      } catch (error) {
        console.error('Error resetting settings:', error);
        alert('Error resetting settings: ' + error.message);
      }
    }
  };

  const handleExportSettings = () => {
    try {
      const exportData = SettingsService.exportSettings();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
        action: 'export_settings'
      });
    } catch (error) {
      console.error('Error exporting settings:', error);
      alert('Error exporting settings: ' + error.message);
    }
  };

  const handleImportSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        SettingsService.importSettings(importData);
        loadSettings();
        
        AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
          action: 'import_settings'
        });
        
        alert('Settings imported successfully!');
      } catch (error) {
        console.error('Error importing settings:', error);
        alert('Error importing settings: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleCreateBackup = async () => {
    try {
      const backup = BackupService.createFullBackup();
      loadBackupStats();
      
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
        action: 'create_backup'
      });
      
      alert('Backup created successfully!');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup: ' + error.message);
    }
  };

  const handleExportBackup = () => {
    try {
      const exportData = BackupService.exportToFile();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scholarai_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
        action: 'export_backup'
      });
    } catch (error) {
      console.error('Error exporting backup:', error);
      alert('Error exporting backup: ' + error.message);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This will delete your profile, applications, settings, and cannot be undone.')) {
      if (window.confirm('This is your final warning. ALL DATA WILL BE PERMANENTLY DELETED. Continue?')) {
        try {
          BackupService.clearAllData();
          loadSettings();
          loadBackupStats();
          
          AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
            action: 'clear_all_data'
          });
          
          alert('All data cleared successfully!');
        } catch (error) {
          console.error('Error clearing data:', error);
          alert('Error clearing data: ' + error.message);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-blue-200">Customize your ScholarAI experience.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
              <nav className="space-y-2">
                {[
                  { id: 'general', label: 'General', icon: '⚙️' },
                  { id: 'notifications', label: 'Notifications', icon: '🔔' },
                  { id: 'privacy', label: 'Privacy', icon: '🔒' },
                  { id: 'search', label: 'Search', icon: '🔍' },
                  { id: 'applications', label: 'Applications', icon: '📋' },
                  { id: 'performance', label: 'Performance', icon: '⚡' },
                  { id: 'backup', label: 'Backup & Data', icon: '💾' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-3/4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">General Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Theme</label>
                      <select
                        value={settings.general?.theme || 'dark'}
                        onChange={(e) => handleSettingChange('general', 'theme', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Language</label>
                      <select
                        value={settings.general?.language || 'en'}
                        onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Currency</label>
                      <select
                        value={settings.general?.currency || 'USD'}
                        onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD (C$)</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoSave"
                        checked={settings.general?.autoSave !== false}
                        onChange={(e) => handleSettingChange('general', 'autoSave', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="autoSave" className="text-white">Enable auto-save</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Notification Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        checked={settings.notifications?.email !== false}
                        onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="emailNotifications" className="text-white">Email notifications</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="pushNotifications"
                        checked={settings.notifications?.push !== false}
                        onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="pushNotifications" className="text-white">Push notifications</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="deadlineReminders"
                        checked={settings.notifications?.deadlineReminders !== false}
                        onChange={(e) => handleSettingChange('notifications', 'deadlineReminders', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="deadlineReminders" className="text-white">Deadline reminders</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="newScholarships"
                        checked={settings.notifications?.newScholarships !== false}
                        onChange={(e) => handleSettingChange('notifications', 'newScholarships', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="newScholarships" className="text-white">New scholarship alerts</label>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Reminder frequency</label>
                      <select
                        value={settings.notifications?.reminderFrequency || 'daily'}
                        onChange={(e) => handleSettingChange('notifications', 'reminderFrequency', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Privacy Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="analytics"
                        checked={settings.privacy?.analytics !== false}
                        onChange={(e) => handleSettingChange('privacy', 'analytics', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="analytics" className="text-white">Allow analytics tracking</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="crashReports"
                        checked={settings.privacy?.crashReports !== false}
                        onChange={(e) => handleSettingChange('privacy', 'crashReports', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="crashReports" className="text-white">Send crash reports</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="dataSharing"
                        checked={settings.privacy?.dataSharing === true}
                        onChange={(e) => handleSettingChange('privacy', 'dataSharing', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="dataSharing" className="text-white">Share anonymized data for research</label>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Data retention period</label>
                      <select
                        value={settings.privacy?.dataRetention || '1year'}
                        onChange={(e) => handleSettingChange('privacy', 'dataRetention', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="3months">3 months</option>
                        <option value="6months">6 months</option>
                        <option value="1year">1 year</option>
                        <option value="2years">2 years</option>
                        <option value="forever">Forever</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Settings */}
              {activeTab === 'search' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Search Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Default search radius (miles)</label>
                      <input
                        type="number"
                        value={settings.search?.radius || 50}
                        onChange={(e) => handleSettingChange('search', 'radius', parseInt(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                        min="1"
                        max="1000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Results per page</label>
                      <select
                        value={settings.search?.resultsPerPage || 20}
                        onChange={(e) => handleSettingChange('search', 'resultsPerPage', parseInt(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="saveSearchHistory"
                        checked={settings.search?.saveHistory !== false}
                        onChange={(e) => handleSettingChange('search', 'saveHistory', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="saveSearchHistory" className="text-white">Save search history</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoComplete"
                        checked={settings.search?.autoComplete !== false}
                        onChange={(e) => handleSettingChange('search', 'autoComplete', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="autoComplete" className="text-white">Enable auto-complete</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Applications Settings */}
              {activeTab === 'applications' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Application Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Default reminder days before deadline</label>
                      <input
                        type="number"
                        value={settings.applications?.reminderDays || 7}
                        onChange={(e) => handleSettingChange('applications', 'reminderDays', parseInt(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                        min="1"
                        max="365"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoBackup"
                        checked={settings.applications?.autoBackup !== false}
                        onChange={(e) => handleSettingChange('applications', 'autoBackup', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="autoBackup" className="text-white">Auto-backup applications</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="trackProgress"
                        checked={settings.applications?.trackProgress !== false}
                        onChange={(e) => handleSettingChange('applications', 'trackProgress', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="trackProgress" className="text-white">Track application progress</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Settings */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Performance Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="enableCaching"
                        checked={settings.performance?.caching !== false}
                        onChange={(e) => handleSettingChange('performance', 'caching', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="enableCaching" className="text-white">Enable caching</label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="preloadData"
                        checked={settings.performance?.preloadData !== false}
                        onChange={(e) => handleSettingChange('performance', 'preloadData', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="preloadData" className="text-white">Preload data</label>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Cache size limit (MB)</label>
                      <input
                        type="number"
                        value={settings.performance?.cacheSize || 100}
                        onChange={(e) => handleSettingChange('performance', 'cacheSize', parseInt(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                        min="10"
                        max="1000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Backup & Data Settings */}
              {activeTab === 'backup' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Backup & Data Management</h2>
                  
                  {/* Backup Statistics */}
                  <div className="bg-white/5 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Backup Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-blue-200">Total Backups</p>
                        <p className="text-white font-semibold">{backupStats.totalBackups || 0}</p>
                      </div>
                      <div>
                        <p className="text-blue-200">Last Backup</p>
                        <p className="text-white font-semibold">
                          {backupStats.lastBackup ? new Date(backupStats.lastBackup).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-200">Storage Used</p>
                        <p className="text-white font-semibold">{backupStats.storageUsed || '0 KB'}</p>
                      </div>
                      <div>
                        <p className="text-blue-200">Auto Backup</p>
                        <p className="text-white font-semibold">
                          {settings.backup?.autoBackup !== false ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Backup Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoBackupEnabled"
                        checked={settings.backup?.autoBackup !== false}
                        onChange={(e) => handleSettingChange('backup', 'autoBackup', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                      />
                      <label htmlFor="autoBackupEnabled" className="text-white">Enable automatic backups</label>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Backup frequency</label>
                      <select
                        value={settings.backup?.frequency || 'weekly'}
                        onChange={(e) => handleSettingChange('backup', 'frequency', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Keep backups for</label>
                      <select
                        value={settings.backup?.retention || '3months'}
                        onChange={(e) => handleSettingChange('backup', 'retention', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="1month">1 month</option>
                        <option value="3months">3 months</option>
                        <option value="6months">6 months</option>
                        <option value="1year">1 year</option>
                        <option value="forever">Forever</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Backup Actions */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">Backup Actions</h3>
                    
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleCreateBackup}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Create Backup Now
                      </button>
                      
                      <button
                        onClick={handleExportBackup}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Export Backup
                      </button>
                      
                      <label className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
                        Import Backup
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                try {
                                  const data = JSON.parse(event.target.result);
                                  BackupService.importFromFile(data);
                                  loadSettings();
                                  loadBackupStats();
                                  alert('Backup imported successfully!');
                                } catch (error) {
                                  alert('Error importing backup: ' + error.message);
                                }
                              };
                              reader.readAsText(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  
                  {/* Danger Zone */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-300 mb-3">Danger Zone</h3>
                    <p className="text-red-200 text-sm mb-4">
                      These actions cannot be undone. Please be careful.
                    </p>
                    
                    <button
                      onClick={handleClearAllData}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Clear All Data
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-white/20">
                <div className="flex space-x-3">
                  <button
                    onClick={handleExportSettings}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Export Settings
                  </button>
                  
                  <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
                    Import Settings
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleResetSettings}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Reset to Default
                  </button>
                  
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
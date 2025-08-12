import React, { useState, useEffect } from 'react';
import ApplicationService from '../services/applicationService';
import AnalyticsService from '../services/analyticsService';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'favorites', 'deadlines'
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplicationData();
    AnalyticsService.trackPageView('/applications');
  }, []);

  const loadApplicationData = () => {
    try {
      setLoading(true);
      
      const allApplications = ApplicationService.getAllApplications();
      const userFavorites = ApplicationService.getFavorites();
      const stats = ApplicationService.getStatistics();
      const deadlines = ApplicationService.getUpcomingDeadlines(30); // Next 30 days
      
      setApplications(allApplications);
      setFavorites(userFavorites);
      setStatistics(stats);
      setUpcomingDeadlines(deadlines);
    } catch (error) {
      console.error('Error loading application data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (applicationId, newStatus) => {
    try {
      ApplicationService.updateApplicationStatus(applicationId, newStatus);
      loadApplicationData();
      
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.APPLICATION_STATUS_CHANGED, {
        applicationId,
        newStatus,
        source: 'applications_page'
      });
      
      if (newStatus === 'submitted') {
        AnalyticsService.trackEvent(AnalyticsService.EVENTS.APPLICATION_SUBMITTED, {
          applicationId
        });
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Error updating application status: ' + error.message);
    }
  };

  const handleDeleteApplication = (applicationId) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        ApplicationService.deleteApplication(applicationId);
        loadApplicationData();
        
        AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
          action: 'delete_application',
          applicationId
        });
      } catch (error) {
        console.error('Error deleting application:', error);
        alert('Error deleting application: ' + error.message);
      }
    }
  };

  const handleRemoveFavorite = (scholarshipId) => {
    try {
      ApplicationService.removeFavorite(scholarshipId);
      loadApplicationData();
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleExportApplications = () => {
    try {
      const exportData = ApplicationService.exportApplications();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
        action: 'export_applications'
      });
    } catch (error) {
      console.error('Error exporting applications:', error);
      alert('Error exporting applications: ' + error.message);
    }
  };

  const getFilteredApplications = () => {
    let filtered = applications;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }
    
    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline) - new Date(b.deadline);
        case 'amount':
          return (b.amount || 0) - (a.amount || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-300';
      case 'in-progress': return 'bg-blue-500/20 text-blue-300';
      case 'submitted': return 'bg-green-500/20 text-green-300';
      case 'accepted': return 'bg-emerald-500/20 text-emerald-300';
      case 'rejected': return 'bg-red-500/20 text-red-300';
      case 'waitlisted': return 'bg-yellow-500/20 text-yellow-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return 'Amount not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Deadline passed';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const getDeadlineColor = (deadline) => {
    if (!deadline) return 'text-gray-400';
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-400';
    if (diffDays <= 3) return 'text-red-300';
    if (diffDays <= 7) return 'text-yellow-300';
    return 'text-green-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Applications</h1>
              <p className="text-blue-200">Track and manage your scholarship applications.</p>
            </div>
            <button
              onClick={handleExportApplications}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Export Data
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total Applications</p>
                <p className="text-3xl font-bold text-white">{statistics.total || 0}</p>
              </div>
              <span className="text-3xl">📋</span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Submitted</p>
                <p className="text-3xl font-bold text-green-300">{statistics.submitted || 0}</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-blue-300">{statistics.inProgress || 0}</p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Favorites</p>
                <p className="text-3xl font-bold text-red-300">{favorites.length}</p>
              </div>
              <span className="text-3xl">❤️</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-blue-200 hover:text-white'
              }`}
            >
              All Applications ({applications.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'favorites' ? 'bg-blue-600 text-white' : 'text-blue-200 hover:text-white'
              }`}
            >
              Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab('deadlines')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                activeTab === 'deadlines' ? 'bg-blue-600 text-white' : 'text-blue-200 hover:text-white'
              }`}
            >
              Upcoming Deadlines ({upcomingDeadlines.length})
            </button>
          </div>
        </div>

        {/* Filters and Sort */}
        {activeTab === 'all' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-blue-200 text-sm mb-1">Filter by Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>
              </div>
              
              <div>
                <label className="block text-blue-200 text-sm mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="deadline">Deadline</option>
                  <option value="amount">Amount</option>
                  <option value="status">Status</option>
                  <option value="title">Title</option>
                  <option value="created">Date Created</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'all' && (
          <div className="space-y-4">
            {getFilteredApplications().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-2xl font-semibold text-white mb-2">No applications yet</h3>
                <p className="text-blue-200 mb-6">Start applying to scholarships to see them here.</p>
                <a
                  href="/scholarships"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
                >
                  Browse Scholarships
                </a>
              </div>
            ) : (
              getFilteredApplications().map((application) => (
                <div
                  key={application.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {application.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-300 font-semibold">
                          {formatAmount(application.amount)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {application.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className={`font-medium ${getDeadlineColor(application.deadline)}`}>
                          {formatDeadline(application.deadline)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={application.status}
                        onChange={(e) => handleStatusChange(application.id, e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm"
                      >
                        <option value="draft">Draft</option>
                        <option value="in-progress">In Progress</option>
                        <option value="submitted">Submitted</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="waitlisted">Waitlisted</option>
                      </select>
                      
                      <button
                        onClick={() => handleDeleteApplication(application.id)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete application"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {application.notes && (
                    <div className="mb-4">
                      <h4 className="text-white font-medium text-sm mb-2">Notes:</h4>
                      <p className="text-blue-200 text-sm">{application.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-blue-300">
                    <span>Created: {new Date(application.createdAt).toLocaleDateString()}</span>
                    {application.updatedAt && application.updatedAt !== application.createdAt && (
                      <span>Updated: {new Date(application.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">❤️</div>
                <h3 className="text-2xl font-semibold text-white mb-2">No favorites yet</h3>
                <p className="text-blue-200 mb-6">Mark scholarships as favorites to see them here.</p>
                <a
                  href="/scholarships"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors inline-block"
                >
                  Browse Scholarships
                </a>
              </div>
            ) : (
              favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {favorite.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-300 font-semibold">
                          {formatAmount(favorite.amount)}
                        </span>
                        <span className={`font-medium ${getDeadlineColor(favorite.deadline)}`}>
                          {formatDeadline(favorite.deadline)}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveFavorite(favorite.scholarshipId)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Remove from favorites"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="mt-4 text-sm text-blue-300">
                    Added: {new Date(favorite.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'deadlines' && (
          <div className="space-y-4">
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-2xl font-semibold text-white mb-2">No upcoming deadlines</h3>
                <p className="text-blue-200">All caught up! No deadlines in the next 30 days.</p>
              </div>
            ) : (
              upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {deadline.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-300 font-semibold">
                          {formatAmount(deadline.amount)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deadline.status)}`}>
                          {deadline.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getDeadlineColor(deadline.deadline)}`}>
                        {formatDeadline(deadline.deadline)}
                      </div>
                      <div className="text-blue-300 text-sm">
                        {deadline.daysLeft} days left
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;
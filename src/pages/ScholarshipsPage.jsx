import React, { useState, useEffect } from 'react';
import { ScholarSeekerAPI } from '../services/api';
import ProfileService from '../services/profileService';
import ApplicationService from '../services/applicationService';
import AnalyticsService from '../services/analyticsService';
import { useAuth } from '../contexts/AuthContext';

const ScholarshipsPage = () => {
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    deadline: '',
    fieldOfStudy: '',
    level: '',
    location: ''
  });
  const [favorites, setFavorites] = useState(new Set());
  const [applications, setApplications] = useState(new Set());
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    loadScholarships();
    loadUserData();
    AnalyticsService.trackPageView('/scholarships');
  }, []);

  const loadScholarships = async () => {
    try {
      setLoading(true);
      // Use profile if user is authenticated, otherwise use default/empty profile
      const profile = user ? ProfileService.getProfile() : {
        fieldOfStudy: '',
        academicLevel: '',
        gpa: '',
        location: '',
        interests: []
      };
      const results = await ScholarSeekerAPI.findScholarships(profile, {
        searchQuery,
        ...filters
      });
      
      let sortedResults = [...results];
      
      // Apply sorting
      switch (sortBy) {
        case 'amount':
          sortedResults.sort((a, b) => (b.amount || 0) - (a.amount || 0));
          break;
        case 'deadline':
          sortedResults.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
          break;
        case 'relevance':
        default:
          sortedResults.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
          break;
      }
      
      setScholarships(sortedResults);
      
      // Track search event
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.SEARCH_PERFORMED, {
        query: searchQuery,
        filters,
        resultsCount: results.length
      });
    } catch (error) {
      console.error('Error loading scholarships:', error);
      setScholarships([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = () => {
    // Only load user data if user is authenticated
    if (!user) {
      setFavorites(new Set());
      setApplications(new Set());
      return;
    }
    
    try {
      // Load favorites
      const userApplications = ApplicationService.getAllApplications();
      const favoriteIds = new Set(
        userApplications
          .filter(app => app.isFavorite)
          .map(app => app.scholarshipId)
      );
      const applicationIds = new Set(
        userApplications.map(app => app.scholarshipId)
      );
      
      setFavorites(favoriteIds);
      setApplications(applicationIds);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSearch = () => {
    loadScholarships();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleFavorite = (scholarship) => {
    // Redirect to login if user is not authenticated
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    try {
      const isCurrentlyFavorite = favorites.has(scholarship.id);
      
      if (isCurrentlyFavorite) {
        ApplicationService.removeFavorite(scholarship.id);
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(scholarship.id);
          return newSet;
        });
      } else {
        ApplicationService.addFavorite({
          scholarshipId: scholarship.id,
          title: scholarship.title,
          amount: scholarship.amount,
          deadline: scholarship.deadline
        });
        setFavorites(prev => new Set([...prev, scholarship.id]));
        
        AnalyticsService.trackEvent(AnalyticsService.EVENTS.SCHOLARSHIP_FAVORITED, {
          scholarshipId: scholarship.id,
          title: scholarship.title
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleStartApplication = (scholarship) => {
    // Redirect to login if user is not authenticated
    if (!user) {
      window.location.href = '/login';
      return;
    }
    
    try {
      const applicationData = {
        scholarshipId: scholarship.id,
        title: scholarship.title,
        amount: scholarship.amount,
        deadline: scholarship.deadline,
        status: 'draft',
        startedAt: new Date().toISOString()
      };
      
      ApplicationService.saveApplication(applicationData);
      setApplications(prev => new Set([...prev, scholarship.id]));
      
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.APPLICATION_STARTED, {
        scholarshipId: scholarship.id,
        title: scholarship.title
      });
      
      alert('Application started! You can continue it from the Applications page.');
    } catch (error) {
      console.error('Error starting application:', error);
      alert('Error starting application: ' + error.message);
    }
  };

  const handleViewDetails = (scholarship) => {
    AnalyticsService.trackEvent(AnalyticsService.EVENTS.SCHOLARSHIP_VIEWED, {
      scholarshipId: scholarship.id,
      title: scholarship.title,
      source: 'scholarships_page'
    });
    
    // In a real app, this would navigate to a detailed view
    alert(`Viewing details for: ${scholarship.title}\n\nDescription: ${scholarship.description}\n\nRequirements: ${scholarship.requirements?.join(', ') || 'Not specified'}`);
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
    if (!deadline) return 'No deadline specified';
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

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-green-300';
    if (score >= 60) return 'text-yellow-300';
    return 'text-red-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Finding scholarships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Scholarships</h1>
          <p className="text-blue-200">Discover scholarships that match your profile and goals.</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
          {/* Search Bar */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search scholarships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-200"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-blue-200 mb-2 text-sm">Min Amount</label>
              <input
                type="number"
                placeholder="$0"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-blue-200 mb-2 text-sm">Max Amount</label>
              <input
                type="number"
                placeholder="$50000"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-blue-200 mb-2 text-sm">Field of Study</label>
              <select
                value={filters.fieldOfStudy}
                onChange={(e) => handleFilterChange('fieldOfStudy', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">All Fields</option>
                <option value="engineering">Engineering</option>
                <option value="medicine">Medicine</option>
                <option value="business">Business</option>
                <option value="arts">Arts</option>
                <option value="science">Science</option>
              </select>
            </div>
            <div>
              <label className="block text-blue-200 mb-2 text-sm">Level</label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">All Levels</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="graduate">Graduate</option>
                <option value="phd">PhD</option>
              </select>
            </div>
            <div>
              <label className="block text-blue-200 mb-2 text-sm">Location</label>
              <input
                type="text"
                placeholder="Any location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-blue-200 mb-2 text-sm">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="amount">Amount</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-200 text-sm">
                {scholarships.length} scholarships found
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white/10 text-blue-200'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white/10 text-blue-200'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scholarships Grid/List */}
        {scholarships.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-white mb-2">No scholarships found</h3>
            <p className="text-blue-200 mb-6">Try adjusting your search criteria or filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  minAmount: '',
                  maxAmount: '',
                  deadline: '',
                  fieldOfStudy: '',
                  level: '',
                  location: ''
                });
                handleSearch();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
            'space-y-4'
          }>
            {scholarships.map((scholarship) => (
              <div
                key={scholarship.id}
                className={`bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden hover:bg-white/20 transition-all duration-300 ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                        {scholarship.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-300 font-semibold">
                          {formatAmount(scholarship.amount)}
                        </span>
                        {scholarship.matchScore && (
                          <span className={`font-medium ${getMatchScoreColor(scholarship.matchScore)}`}>
                            {scholarship.matchScore}% match
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFavorite(scholarship)}
                      className={`p-2 rounded-full transition-colors ${
                        favorites.has(scholarship.id) ?
                        'text-red-400 hover:text-red-300' :
                        'text-gray-400 hover:text-red-400'
                      }`}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-blue-200 text-sm mb-4 line-clamp-3">
                    {scholarship.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <span className="text-blue-300 w-20">Deadline:</span>
                      <span className="text-white">{formatDeadline(scholarship.deadline)}</span>
                    </div>
                    {scholarship.provider && (
                      <div className="flex items-center text-sm">
                        <span className="text-blue-300 w-20">Provider:</span>
                        <span className="text-white">{scholarship.provider}</span>
                      </div>
                    )}
                    {scholarship.level && (
                      <div className="flex items-center text-sm">
                        <span className="text-blue-300 w-20">Level:</span>
                        <span className="text-white capitalize">{scholarship.level}</span>
                      </div>
                    )}
                  </div>

                  {/* Requirements */}
                  {scholarship.requirements && scholarship.requirements.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-white font-medium text-sm mb-2">Requirements:</h4>
                      <div className="flex flex-wrap gap-1">
                        {scholarship.requirements.slice(0, 3).map((req, index) => (
                          <span
                            key={index}
                            className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs"
                          >
                            {req}
                          </span>
                        ))}
                        {scholarship.requirements.length > 3 && (
                          <span className="text-blue-300 text-xs px-2 py-1">
                            +{scholarship.requirements.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(scholarship)}
                      className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      View Details
                    </button>
                    {applications.has(scholarship.id) ? (
                      <button
                        disabled
                        className="flex-1 bg-green-600/20 text-green-300 px-4 py-2 rounded-lg text-sm cursor-not-allowed"
                      >
                        Applied ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartApplication(scholarship)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScholarshipsPage;
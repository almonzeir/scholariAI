import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { 
  Award, 
  FileText, 
  Heart, 
  TrendingUp, 
  Search,
  Plus,
  Calendar,
  Bell,
  User,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalApplications: 0,
      pendingApplications: 0,
      acceptedApplications: 0,
      totalFavorites: 0
    },
    recentApplications: [],
    recommendedScholarships: [],
    upcomingDeadlines: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, applicationsRes, scholarshipsRes] = await Promise.all([
          apiClient.get('/users/dashboard/stats'),
          apiClient.get('/users/applications/recent'),
          apiClient.get('/scholarships/recommended')
        ]);
        
        setDashboardData({
          stats: statsRes.data,
          recentApplications: applicationsRes.data,
          recommendedScholarships: scholarshipsRes.data,
          upcomingDeadlines: [] // Will be implemented later
        });
        
        // Track page view
        await apiClient.post('/analytics/track', {
          event: 'page_view',
          page: '/dashboard'
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err.message);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color = 'blue', trend }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'Student'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's your scholarship journey overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Applications" 
            value={dashboardData.stats.totalApplications} 
            icon={FileText} 
            color="blue" 
          />
          <StatCard 
            title="Pending Applications" 
            value={dashboardData.stats.pendingApplications} 
            icon={Calendar} 
            color="yellow" 
          />
          <StatCard 
            title="Accepted Applications" 
            value={dashboardData.stats.acceptedApplications} 
            icon={Award} 
            color="green" 
          />
          <StatCard 
            title="Saved Scholarships" 
            value={dashboardData.stats.totalFavorites} 
            icon={Heart} 
            color="red" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
              <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="p-6">
              {dashboardData.recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentApplications.slice(0, 5).map((application) => (
                    <div key={application.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {application.scholarshipTitle}
                        </p>
                        <p className="text-sm text-gray-500">
                          Applied {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {application.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No applications yet</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-500 text-sm font-medium">
                    Browse Scholarships
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Scholarships */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recommended for You</h3>
              <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="p-6">
              {dashboardData.recommendedScholarships.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recommendedScholarships.slice(0, 5).map((scholarship) => (
                    <div key={scholarship.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Award className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {scholarship.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${scholarship.amount?.toLocaleString() || 'Amount varies'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recommendations yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Complete your profile to get personalized recommendations
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Search className="h-6 w-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Find Scholarships</p>
                  <p className="text-sm text-gray-500">Discover new opportunities</p>
                </div>
              </button>
              <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <User className="h-6 w-6 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Update Profile</p>
                  <p className="text-sm text-gray-500">Keep your info current</p>
                </div>
              </button>
              <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Plus className="h-6 w-6 text-purple-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Upload Documents</p>
                  <p className="text-sm text-gray-500">Add transcripts & essays</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
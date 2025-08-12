import React, { useState, useEffect } from 'react';
import { ScholarSeekerAPI } from '../services/api';
import ProfileService from '../services/profileService';
import AnalyticsService from '../services/analyticsService';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [uploadingCV, setUploadingCV] = useState(false);

  useEffect(() => {
    loadProfileData();
    AnalyticsService.trackPageView('/profile');
  }, []);

  const loadProfileData = () => {
    try {
      setLoading(true);
      const profileData = ProfileService.getProfile();
      const profileInsights = ScholarSeekerAPI.getProfileInsights();
      
      setProfile(profileData);
      setInsights(profileInsights);
      setEditForm(profileData || {});
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingCV(true);
      const parsedProfile = await ScholarSeekerAPI.parseCVFile(file);
      
      if (parsedProfile.success) {
        ProfileService.storeProfile(parsedProfile.profile);
        loadProfileData();
        
        AnalyticsService.trackEvent(AnalyticsService.EVENTS.CV_UPLOADED, {
          fileName: file.name,
          fileSize: file.size,
          source: 'profile_page'
        });
        
        alert('CV uploaded and parsed successfully!');
      } else {
        throw new Error(parsedProfile.error || 'Failed to parse CV');
      }
    } catch (error) {
      console.error('Error uploading CV:', error);
      alert('Error uploading CV: ' + error.message);
    } finally {
      setUploadingCV(false);
    }
  };

  const handleSaveProfile = () => {
    try {
      ProfileService.updateProfile(editForm);
      setProfile(editForm);
      setEditing(false);
      loadProfileData();
      
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.PROFILE_UPDATED, {
        source: 'manual_edit'
      });
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile: ' + error.message);
    }
  };

  const handleExportProfile = () => {
    try {
      const exportData = ProfileService.exportProfile();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      AnalyticsService.trackEvent(AnalyticsService.EVENTS.FEATURE_USED, {
        action: 'export_profile'
      });
    } catch (error) {
      console.error('Error exporting profile:', error);
      alert('Error exporting profile: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-blue-200">Manage your personal information and CV data.</p>
        </div>

        {/* Profile Status */}
        {insights && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">Profile Status</h2>
              {insights.hasProfile && insights.completeness && (
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-16 relative">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#374151"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        strokeDasharray={`${insights.completeness.score}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {insights.completeness.score}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {!insights.hasProfile ? (
              <div className="text-center py-8">
                <p className="text-red-300 mb-4">No profile found. Upload your CV to get started.</p>
                <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors inline-block">
                  {uploadingCV ? 'Uploading...' : 'Upload CV'}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleCVUpload}
                    disabled={uploadingCV}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {insights.completeness?.score || 0}%
                  </div>
                  <div className="text-blue-200">Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {insights.validation?.errors?.length || 0}
                  </div>
                  <div className="text-red-300">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {insights.validation?.warnings?.length || 0}
                  </div>
                  <div className="text-yellow-300">Warnings</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors">
            {uploadingCV ? 'Uploading...' : 'Upload New CV'}
            <input
              type="file"
              accept=".pdf"
              onChange={handleCVUpload}
              disabled={uploadingCV}
              className="hidden"
            />
          </label>
          
          {profile && (
            <>
              <button
                onClick={() => setEditing(!editing)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {editing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              
              <button
                onClick={handleExportProfile}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Export Profile
              </button>
            </>
          )}
        </div>

        {/* Profile Data */}
        {profile && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Profile Information</h2>
                {editing && (
                  <button
                    onClick={handleSaveProfile}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-blue-200 mb-2">Full Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.personalInfo?.name || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            personalInfo: {
                              ...editForm.personalInfo,
                              name: e.target.value
                            }
                          })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                        />
                      ) : (
                        <p className="text-white">{profile.personalInfo?.name || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-blue-200 mb-2">Email</label>
                      {editing ? (
                        <input
                          type="email"
                          value={editForm.personalInfo?.email || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            personalInfo: {
                              ...editForm.personalInfo,
                              email: e.target.value
                            }
                          })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                        />
                      ) : (
                        <p className="text-white">{profile.personalInfo?.email || 'Not provided'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-blue-200 mb-2">Phone</label>
                      {editing ? (
                        <input
                          type="tel"
                          value={editForm.personalInfo?.phone || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            personalInfo: {
                              ...editForm.personalInfo,
                              phone: e.target.value
                            }
                          })}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                        />
                      ) : (
                        <p className="text-white">{profile.personalInfo?.phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Education</h3>
                  <div className="space-y-4">
                    {profile.education?.map((edu, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-white font-medium">{edu.degree || 'Degree'}</h4>
                        <p className="text-blue-200">{edu.institution || 'Institution'}</p>
                        <p className="text-blue-300 text-sm">{edu.year || 'Year'}</p>
                        {edu.gpa && (
                          <p className="text-green-300 text-sm">GPA: {edu.gpa}</p>
                        )}
                      </div>
                    )) || (
                      <p className="text-blue-200">No education information available</p>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills?.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    )) || (
                      <p className="text-blue-200">No skills listed</p>
                    )}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Experience</h3>
                  <div className="space-y-4">
                    {profile.experience?.map((exp, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-white font-medium">{exp.position || 'Position'}</h4>
                        <p className="text-blue-200">{exp.company || 'Company'}</p>
                        <p className="text-blue-300 text-sm">{exp.duration || 'Duration'}</p>
                        {exp.description && (
                          <p className="text-blue-200 text-sm mt-2">{exp.description}</p>
                        )}
                      </div>
                    )) || (
                      <p className="text-blue-200">No experience information available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {insights?.recommendations?.length > 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Recommendations</h2>
              <div className="space-y-4">
                {insights.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.type === 'error' ? 'bg-red-500/10 border-red-500' :
                      rec.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                      'bg-blue-500/10 border-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{rec.title}</h4>
                        <p className="text-blue-200 text-sm">{rec.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
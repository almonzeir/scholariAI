// src/pages/Phase5Demo.jsx
import React, { useState } from 'react';
import { Hero } from '../components/Hero';
import { FileDropPDF } from '../components/FileDropPDF';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { parseCVFile, matchScholarships, createMockProfile, createMockScholarships } from '../services/aiService';

export function Phase5Demo() {
  const [profile, setProfile] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload', 'profile', 'results'
  const [extractionQuality, setExtractionQuality] = useState(null);

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use actual AI parsing with strict JSON validation
      const parsedData = await parseCVFile(file);
      
      // Extract profile and metadata
      const { _metadata, ...profileData } = parsedData;
      setProfile(profileData);
      setExtractionQuality(_metadata);
      setStep('profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFindScholarships = async () => {
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // For demo purposes, we'll use mock data since matching isn't fully implemented
      // const matchedScholarships = await matchScholarships(profile);
      const matchedScholarships = createMockScholarships();
      setScholarships(matchedScholarships);
      setStep('results');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setProfile(null);
    setScholarships([]);
    setError(null);
    setExtractionQuality(null);
    setStep('upload');
  };

  const formatDeadline = (deadline) => {
    if (deadline === 'varies') return 'Varies';
    try {
      return new Date(deadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return deadline;
    }
  };

  const getFitScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative">
        <Hero />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Phase 5: AI-Powered Matching
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience our advanced CV parsing and scholarship matching system
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {error && (
          <Card className="mb-8 border-red-500/20 bg-red-500/10">
            <div className="p-6">
              <h3 className="text-red-400 font-semibold mb-2">Error</h3>
              <p className="text-red-300">{error}</p>
              <Button onClick={handleReset} className="mt-4" variant="ghost">
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Step 1: File Upload */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Upload Your CV
              </h2>
              <FileDropPDF 
                onFileSelect={handleFileUpload}
                disabled={loading}
              />
              {loading && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                    Parsing CV with AI...
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Step 2: Profile Review */}
        {step === 'profile' && profile && (
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Extracted Profile
                  </h2>
                  {extractionQuality && (
                    <div className="flex items-center mt-2 space-x-4">
                      <div className={`text-sm font-semibold ${
                        extractionQuality.quality.grade === 'A' ? 'text-green-400' :
                        extractionQuality.quality.grade === 'B' ? 'text-blue-400' :
                        extractionQuality.quality.grade === 'C' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        Quality: {extractionQuality.quality.grade} ({extractionQuality.quality.score}/100)
                      </div>
                      <div className="text-xs text-gray-500">
                        {extractionQuality.quality.completedFields}/{extractionQuality.quality.totalFields} fields extracted
                      </div>
                    </div>
                  )}
                </div>
                <Button onClick={handleReset} variant="ghost">
                  Upload New CV
                </Button>
              </div>
              
              {/* Quality Warnings */}
              {extractionQuality?.warnings?.length > 0 && (
                <Card className="mb-6 border-yellow-500/20 bg-yellow-500/10">
                  <div className="p-4">
                    <h3 className="text-yellow-400 font-semibold mb-2 flex items-center">
                      <span className="mr-2">⚠️</span>
                      Extraction Warnings
                    </h3>
                    <ul className="text-yellow-300 text-sm space-y-1">
                      {extractionQuality.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-yellow-400 mt-2">
                      These warnings indicate potential data quality issues. Please review the extracted information.
                    </p>
                  </div>
                </Card>
              )}
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white ml-2">{profile.name || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Nationality:</span>
                      <span className="text-white ml-2">{profile.nationality || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Target Degree:</span>
                      <span className="text-white ml-2">{profile.degreeTarget || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Field:</span>
                      <span className="text-white ml-2">{profile.field || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">GPA:</span>
                      <span className="text-white ml-2">{profile.gpa || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Additional Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Certifications:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.certifications?.length > 0 ? (
                          profile.certifications.map((cert, index) => (
                            <Pill key={index}>{cert}</Pill>
                          ))
                        ) : (
                          <span className="text-gray-500">None specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Languages:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {profile.languages?.length > 0 ? (
                          profile.languages.map((lang, index) => (
                            <Pill key={index}>{lang}</Pill>
                          ))
                        ) : (
                          <span className="text-gray-500">None specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Special Status:</span>
                      <span className="text-white ml-2">{profile.specialStatus || 'None'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={handleFindScholarships}
                  disabled={loading}
                  className="px-8 py-3"
                >
                  {loading ? 'Finding Scholarships...' : 'Find Matching Scholarships'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Scholarship Results */}
        {step === 'results' && scholarships.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white">
                Matched Scholarships ({scholarships.length})
              </h2>
              <div className="space-x-4">
                <Button onClick={() => setStep('profile')} variant="ghost">
                  Edit Profile
                </Button>
                <Button onClick={handleReset} variant="ghost">
                  Start Over
                </Button>
              </div>
            </div>
            
            <div className="grid gap-6">
              {scholarships.map((scholarship) => (
                <Card key={scholarship.id} className="p-6 hover:border-blue-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {scholarship.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>📍 {scholarship.country}</span>
                        <span>🎓 {scholarship.degree}</span>
                        <span>📅 {formatDeadline(scholarship.deadline)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getFitScoreColor(scholarship.fitScore)}`}>
                        {Math.round(scholarship.fitScore * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-4">{scholarship.eligibility}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Source: {scholarship.source}
                    </div>
                    <Button 
                      onClick={() => window.open(scholarship.link, '_blank')}
                      className="px-6"
                    >
                      Apply Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Phase5Demo;
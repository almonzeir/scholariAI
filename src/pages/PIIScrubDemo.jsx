import React, { useState } from 'react';
import {
  scrubProfilePII,
  detectProfilePII,
  batchScrubProfilePII,
  testPIIScrubbing,
  createMockProfileWithPII,
  createMockProfilesBatch,
  formatPIIScrubResults,
  getPIISummary
} from '../services/piiScrubService';

const PIIScrubDemo = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Single profile state
  const [profileInput, setProfileInput] = useState('');
  const [singleResult, setSingleResult] = useState(null);

  // Batch processing state
  const [batchResults, setBatchResults] = useState(null);

  // API test state
  const [testResults, setTestResults] = useState(null);

  const handleSingleScrub = async () => {
    setLoading(true);
    setError(null);
    setSingleResult(null);

    try {
      let profile;
      if (profileInput.trim()) {
        profile = JSON.parse(profileInput);
      } else {
        profile = createMockProfileWithPII();
      }

      const result = await scrubProfilePII(profile);
      setSingleResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectOnly = async () => {
    setLoading(true);
    setError(null);
    setSingleResult(null);

    try {
      let profile;
      if (profileInput.trim()) {
        profile = JSON.parse(profileInput);
      } else {
        profile = createMockProfileWithPII();
      }

      const result = await detectProfilePII(profile);
      setSingleResult({ ...result, detectOnly: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchScrub = async () => {
    setLoading(true);
    setError(null);
    setBatchResults(null);

    try {
      const profiles = createMockProfilesBatch(5);
      const result = await batchScrubProfilePII(profiles);
      setBatchResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAPITest = async () => {
    setLoading(true);
    setError(null);
    setTestResults(null);

    try {
      const result = await testPIIScrubbing();
      setTestResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMockProfile = () => {
    const mockProfile = createMockProfileWithPII();
    setProfileInput(JSON.stringify(mockProfile, null, 2));
  };

  const renderPIIComparison = (original, scrubbed, piiDetection) => {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">Original Profile (with PII)</h4>
          <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-64">
            {JSON.stringify(original, null, 2)}
          </pre>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">Scrubbed Profile (PII Removed)</h4>
          <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-64">
            {JSON.stringify(scrubbed, null, 2)}
          </pre>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">PII Detection Summary</h4>
          <div className="space-y-2">
            <p><strong>Summary:</strong> {getPIISummary(piiDetection)}</p>
            <p><strong>Has Name:</strong> {piiDetection.hasName ? '✓ Yes' : '✗ No'}</p>
            <p><strong>Has Email:</strong> {piiDetection.hasEmail ? '✓ Yes' : '✗ No'}</p>
            <p><strong>Has Phone:</strong> {piiDetection.hasPhone ? '✓ Yes' : '✗ No'}</p>
            {piiDetection.details && piiDetection.details.length > 0 && (
              <div>
                <strong>Details:</strong>
                <ul className="list-disc list-inside mt-1">
                  {piiDetection.details.map((detail, index) => (
                    <li key={index} className="text-sm">{detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6">
            <h1 className="text-3xl font-bold">PII Scrubbing Demo</h1>
            <p className="mt-2 text-red-100">
              Remove personally identifiable information (PII) from profile data before saving
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'single', label: 'Single Profile' },
                { id: 'batch', label: 'Batch Processing' },
                { id: 'test', label: 'API Test' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="text-red-400">⚠️</div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Single Profile Tab */}
            {activeTab === 'single' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Single Profile PII Scrubbing</h2>
                  <p className="text-gray-600 mb-4">
                    Enter a profile JSON or use the mock data to test PII scrubbing functionality.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile JSON (leave empty to use mock data)
                    </label>
                    <textarea
                      value={profileInput}
                      onChange={(e) => setProfileInput(e.target.value)}
                      placeholder="Enter profile JSON here..."
                      className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={loadMockProfile}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Load Mock Profile
                    </button>
                    <button
                      onClick={handleDetectOnly}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Detecting...' : 'Detect PII Only'}
                    </button>
                    <button
                      onClick={handleSingleScrub}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Scrubbing...' : 'Scrub PII'}
                    </button>
                  </div>
                </div>

                {singleResult && (
                  <div className="mt-6">
                    {singleResult.detectOnly ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 mb-3">PII Detection Results</h3>
                        <div className="space-y-2">
                          <p><strong>Summary:</strong> {getPIISummary(singleResult.piiDetection)}</p>
                          <p><strong>Has PII:</strong> {singleResult.piiDetection.hasPII ? '✓ Yes' : '✗ No'}</p>
                          {singleResult.piiDetection.details && (
                            <div>
                              <strong>Details:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {singleResult.piiDetection.details.map((detail, index) => (
                                  <li key={index} className="text-sm">{detail}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      renderPIIComparison(singleResult.original, singleResult.scrubbed, singleResult.piiDetection)
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Batch Processing Tab */}
            {activeTab === 'batch' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Batch PII Scrubbing</h2>
                  <p className="text-gray-600 mb-4">
                    Process multiple profiles at once to remove PII from all of them.
                  </p>
                </div>

                <button
                  onClick={handleBatchScrub}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Processing Batch...' : 'Process 5 Mock Profiles'}
                </button>

                {batchResults && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">Batch Processing Summary</h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white p-3 rounded border">
                          <div className="text-2xl font-bold text-blue-600">{batchResults.summary.total}</div>
                          <div className="text-sm text-gray-600">Total Profiles</div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <div className="text-2xl font-bold text-green-600">{batchResults.summary.successful}</div>
                          <div className="text-sm text-gray-600">Successful</div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <div className="text-2xl font-bold text-red-600">{batchResults.summary.failed}</div>
                          <div className="text-sm text-gray-600">Failed</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {batchResults.results.map((result, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold mb-2">Profile {index + 1}</h4>
                          {result.success ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h5 className="font-medium text-red-700 mb-1">Original (with PII)</h5>
                                <pre className="text-xs bg-red-50 p-2 rounded border overflow-auto max-h-32">
                                  {JSON.stringify(result.original, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <h5 className="font-medium text-green-700 mb-1">Scrubbed (PII removed)</h5>
                                <pre className="text-xs bg-green-50 p-2 rounded border overflow-auto max-h-32">
                                  {JSON.stringify(result.scrubbed, null, 2)}
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <div className="text-red-600">
                              <strong>Error:</strong> {result.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* API Test Tab */}
            {activeTab === 'test' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">API Testing</h2>
                  <p className="text-gray-600 mb-4">
                    Test the PII scrubbing API with predefined test cases.
                  </p>
                </div>

                <button
                  onClick={handleAPITest}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Running Tests...' : 'Run API Tests'}
                </button>

                {testResults && (
                  <div className="mt-6">
                    <div className={`border rounded-lg p-4 ${
                      testResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <h3 className={`font-semibold mb-3 ${
                        testResults.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        Test Results: {testResults.success ? 'PASSED' : 'FAILED'}
                      </h3>
                      
                      {testResults.success ? (
                        <div className="space-y-4">
                          {renderPIIComparison(testResults.original, testResults.scrubbed, testResults.original)}
                        </div>
                      ) : (
                        <div className="text-red-700">
                          <strong>Error:</strong> {testResults.error}
                        </div>
                      )}
                      
                      <div className="mt-3 text-sm text-gray-600">
                        <strong>Timestamp:</strong> {testResults.timestamp}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PIIScrubDemo;
import React, { useState, useEffect } from 'react';
import {
  scrapeScholarship,
  batchScrapeScholarships,
  testScholarshipScraping,
  validateScholarship,
  getScholarshipSchema,
  formatScholarshipForDisplay,
  extractDomain,
  isValidUrl,
  getScholarshipCardColor,
  getFundingBadgeColor
} from '../services/scholarshipService';

const ScholarshipDemo = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [schema, setSchema] = useState(null);

  // Single scraping state
  const [singleUrl, setSingleUrl] = useState('');
  const [singleResult, setSingleResult] = useState(null);

  // Batch scraping state
  const [batchUrls, setBatchUrls] = useState('');
  const [batchConcurrency, setBatchConcurrency] = useState(3);
  const [batchResults, setBatchResults] = useState(null);

  // Validation state
  const [validationJson, setValidationJson] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  // Load schema on component mount
  useEffect(() => {
    const loadSchema = async () => {
      try {
        const schemaData = await getScholarshipSchema();
        setSchema(schemaData);
      } catch (err) {
        console.error('Failed to load schema:', err);
      }
    };
    loadSchema();
  }, []);

  const handleSingleScrape = async () => {
    if (!singleUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(singleUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);
    setSingleResult(null);

    try {
      const result = await scrapeScholarship(singleUrl);
      setSingleResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchScrape = async () => {
    const urls = batchUrls.split('\n').map(url => url.trim()).filter(url => url);
    
    if (urls.length === 0) {
      setError('Please enter at least one URL');
      return;
    }

    const invalidUrls = urls.filter(url => !isValidUrl(url));
    if (invalidUrls.length > 0) {
      setError(`Invalid URLs found: ${invalidUrls.join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);
    setBatchResults(null);

    try {
      const result = await batchScrapeScholarships(urls, batchConcurrency);
      setBatchResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const result = await testScholarshipScraping();
      setResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async () => {
    if (!validationJson.trim()) {
      setError('Please enter JSON to validate');
      return;
    }

    try {
      const scholarship = JSON.parse(validationJson);
      setLoading(true);
      setError(null);
      setValidationResult(null);

      const result = await validateScholarship(scholarship);
      setValidationResult(result);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const ScholarshipCard = ({ scholarship, metadata }) => {
    const formatted = formatScholarshipForDisplay(scholarship);
    const cardColor = getScholarshipCardColor(scholarship.degree);
    const fundingColor = getFundingBadgeColor(scholarship.isFullyFunded);

    return (
      <div className={`${cardColor} rounded-lg p-6 border border-gray-700 shadow-lg`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white mb-2">{scholarship.name}</h3>
          <div className="flex gap-2">
            <span className={`${fundingColor} text-white px-2 py-1 rounded-full text-xs font-medium`}>
              {formatted.formattedFunding}
            </span>
            <span className="bg-gray-700 text-white px-2 py-1 rounded-full text-xs font-medium">
              {formatted.formattedDegree}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          {scholarship.country && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Country:</span>
              <span className="text-white text-sm">{scholarship.country}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Deadline:</span>
            <span className="text-white text-sm">{formatted.formattedDeadline}</span>
          </div>
          
          <div>
            <span className="text-gray-400 text-sm block mb-1">Eligibility:</span>
            <p className="text-white text-sm leading-relaxed">{scholarship.eligibility}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Source:</span>
            <span className="text-blue-400 text-sm">{scholarship.source}</span>
          </div>
          
          <div className="pt-3 border-t border-gray-600">
            <a 
              href={scholarship.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Apply Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
        
        {metadata && (
          <div className="mt-4 pt-3 border-t border-gray-600">
            <details className="text-xs text-gray-400">
              <summary className="cursor-pointer hover:text-gray-300">Scraping Details</summary>
              <div className="mt-2 space-y-1">
                <div>URL: {metadata.url}</div>
                <div>Domain: {metadata.domain}</div>
                <div>Scraped: {new Date(metadata.scrapedAt).toLocaleString()}</div>
                <div>Normalized: {new Date(metadata.normalizedAt).toLocaleString()}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    );
  };

  const TabButton = ({ id, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-3 font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Scholarship Engine Demo
          </h1>
          <p className="text-gray-400 text-lg">
            Scrape scholarship pages and normalize them into structured data using AI
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 justify-center">
          <TabButton
            id="single"
            label="Single Scrape"
            active={activeTab === 'single'}
            onClick={setActiveTab}
          />
          <TabButton
            id="batch"
            label="Batch Scrape"
            active={activeTab === 'batch'}
            onClick={setActiveTab}
          />
          <TabButton
            id="validate"
            label="Validate"
            active={activeTab === 'validate'}
            onClick={setActiveTab}
          />
          <TabButton
            id="test"
            label="Test"
            active={activeTab === 'test'}
            onClick={setActiveTab}
          />
          <TabButton
            id="schema"
            label="Schema"
            active={activeTab === 'schema'}
            onClick={setActiveTab}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {/* Single Scrape Tab */}
          {activeTab === 'single' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Single Scholarship Scraping</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Scholarship URL
                  </label>
                  <input
                    type="url"
                    value={singleUrl}
                    onChange={(e) => setSingleUrl(e.target.value)}
                    placeholder="https://example.com/scholarship-page"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={handleSingleScrape}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scraping...
                    </>
                  ) : (
                    'Scrape Scholarship'
                  )}
                </button>
              </div>

              {singleResult && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4">Scraped Scholarship</h3>
                  <ScholarshipCard 
                    scholarship={singleResult.data} 
                    metadata={singleResult.metadata}
                  />
                </div>
              )}
            </div>
          )}

          {/* Batch Scrape Tab */}
          {activeTab === 'batch' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Batch Scholarship Scraping</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URLs (one per line)
                  </label>
                  <textarea
                    value={batchUrls}
                    onChange={(e) => setBatchUrls(e.target.value)}
                    placeholder="https://example.com/scholarship1\nhttps://example.com/scholarship2\nhttps://example.com/scholarship3"
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Concurrency (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={batchConcurrency}
                    onChange={(e) => setBatchConcurrency(parseInt(e.target.value) || 3)}
                    className="w-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={handleBatchScrape}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scraping...
                    </>
                  ) : (
                    'Batch Scrape'
                  )}
                </button>
              </div>

              {batchResults && (
                <div className="mt-8">
                  <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-bold mb-2">Batch Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Total:</span>
                        <span className="ml-2 text-white font-medium">{batchResults.summary.total}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Successful:</span>
                        <span className="ml-2 text-green-400 font-medium">{batchResults.summary.successful}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Failed:</span>
                        <span className="ml-2 text-red-400 font-medium">{batchResults.summary.failed}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Success Rate:</span>
                        <span className="ml-2 text-blue-400 font-medium">{batchResults.summary.successRate}</span>
                      </div>
                    </div>
                  </div>
                  
                  {batchResults.scholarships.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Scraped Scholarships ({batchResults.scholarships.length})</h3>
                      <div className="grid gap-6 md:grid-cols-2">
                        {batchResults.scholarships.map((scholarship, index) => (
                          <ScholarshipCard key={index} scholarship={scholarship} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {batchResults.errors.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-xl font-bold mb-4 text-red-400">Errors ({batchResults.errors.length})</h3>
                      <div className="space-y-2">
                        {batchResults.errors.map((error, index) => (
                          <div key={index} className="bg-red-900 border border-red-700 p-3 rounded-lg">
                            <div className="text-sm">
                              <span className="text-red-300">URL:</span> {error.url}
                            </div>
                            <div className="text-sm text-red-100">
                              <span className="text-red-300">Error:</span> {error.error}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Validate Tab */}
          {activeTab === 'validate' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Validate Scholarship JSON</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Scholarship JSON
                  </label>
                  <textarea
                    value={validationJson}
                    onChange={(e) => setValidationJson(e.target.value)}
                    placeholder={JSON.stringify({
                      id: "scholarship_12345678",
                      name: "Example Scholarship",
                      country: "USA",
                      degree: "Bachelor",
                      eligibility: "Must be enrolled in a STEM program with GPA 3.5+",
                      deadline: "2024-12-31",
                      link: "https://example.com/apply",
                      source: "example.com",
                      isFullyFunded: true
                    }, null, 2)}
                    rows={12}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
                
                <button
                  onClick={handleValidation}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Validating...
                    </>
                  ) : (
                    'Validate JSON'
                  )}
                </button>
              </div>

              {validationResult && (
                <div className="mt-8">
                  <div className={`p-4 rounded-lg border ${
                    validationResult.valid 
                      ? 'bg-green-900 border-green-700 text-green-100'
                      : 'bg-red-900 border-red-700 text-red-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {validationResult.valid ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="font-bold">
                        {validationResult.valid ? 'Valid Scholarship JSON' : 'Invalid Scholarship JSON'}
                      </span>
                    </div>
                    
                    {!validationResult.valid && validationResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium mb-2">Validation Errors:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {validationResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {validationResult.valid && validationResult.scholarship && (
                    <div className="mt-6">
                      <h3 className="text-xl font-bold mb-4">Validated Scholarship</h3>
                      <ScholarshipCard scholarship={validationResult.scholarship} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Test Tab */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Test Scholarship Scraping</h2>
              <p className="text-gray-400 mb-6">
                Test the scholarship scraping functionality with predefined URLs.
              </p>
              
              <button
                onClick={handleTest}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running Test...
                  </>
                ) : (
                  'Run Test'
                )}
              </button>

              {results && (
                <div className="mt-8">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-bold mb-4">Test Results</h3>
                    <pre className="text-sm text-gray-300 overflow-auto">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Schema Tab */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Scholarship Schema</h2>
              <p className="text-gray-400 mb-6">
                The JSON schema that defines the structure of normalized scholarship objects.
              </p>
              
              {schema && (
                <div className="space-y-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-bold mb-4">Schema Definition</h3>
                    <pre className="text-sm text-gray-300 overflow-auto">
                      {JSON.stringify(schema.schema, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-bold mb-4">Constraints</h3>
                    <div className="space-y-2">
                      {Object.entries(schema.constraints).map(([field, constraint]) => (
                        <div key={field} className="flex gap-4">
                          <span className="text-blue-400 font-medium min-w-24">{field}:</span>
                          <span className="text-gray-300">{constraint}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScholarshipDemo;
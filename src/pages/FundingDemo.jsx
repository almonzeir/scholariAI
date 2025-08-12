import React, { useState } from 'react';
import {
  classifyFunding,
  batchClassifyFunding,
  testFundingClassification,
  validateClassification,
  getFundingSchema,
  formatClassificationForDisplay,
  getFundingBadgeColor,
  getFundingStatusText,
  validateScholarshipForClassification,
  extractFundingKeywords
} from '../services/fundingService';

const FundingDemo = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Single classification state
  const [singleScholarship, setSingleScholarship] = useState({
    id: 'demo_1',
    name: 'Rhodes Scholarship',
    country: 'UK',
    degree: 'Master',
    eligibility: 'Full funding including tuition, college fees, living stipend, and travel allowance',
    deadline: '2024-10-01',
    link: 'https://www.rhodeshouse.ox.ac.uk/',
    source: 'Rhodes Trust',
    isFullyFunded: null
  });

  // Batch classification state
  const [batchScholarships, setBatchScholarships] = useState([
    {
      id: 'batch_1',
      name: 'Fulbright Scholarship',
      eligibility: 'Covers tuition, living expenses, health insurance, and round-trip travel',
      country: 'USA'
    },
    {
      id: 'batch_2',
      name: 'Merit Scholarship',
      eligibility: 'Tuition waiver only, students cover living expenses',
      country: 'Canada'
    }
  ]);
  const [concurrency, setConcurrency] = useState(3);

  // Validation state
  const [validationInput, setValidationInput] = useState({
    isFullyFunded: true,
    reason: 'Covers tuition, living stipend, and travel expenses'
  });

  // Schema state
  const [schema, setSchema] = useState(null);

  const handleSingleClassification = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const validation = validateScholarshipForClassification(singleScholarship);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const result = await classifyFunding(singleScholarship);
      setResults({
        type: 'single',
        data: result,
        formatted: formatClassificationForDisplay(result.data),
        keywords: extractFundingKeywords(singleScholarship)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchClassification = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      if (batchScholarships.length === 0) {
        throw new Error('At least one scholarship is required');
      }

      const result = await batchClassifyFunding(batchScholarships, concurrency);
      setResults({
        type: 'batch',
        data: result,
        summary: result.data.summary
      });
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
      const result = await testFundingClassification();
      setResults({
        type: 'test',
        data: result
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const result = await validateClassification(validationInput);
      setResults({
        type: 'validation',
        data: result
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetSchema = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getFundingSchema();
      setSchema(result.schema);
      setResults({
        type: 'schema',
        data: result
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addBatchScholarship = () => {
    setBatchScholarships([...batchScholarships, {
      id: `batch_${Date.now()}`,
      name: '',
      eligibility: '',
      country: ''
    }]);
  };

  const removeBatchScholarship = (index) => {
    setBatchScholarships(batchScholarships.filter((_, i) => i !== index));
  };

  const updateBatchScholarship = (index, field, value) => {
    const updated = [...batchScholarships];
    updated[index][field] = value;
    setBatchScholarships(updated);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Funding Classifier Demo
          </h1>
          <p className="text-gray-300 text-lg">
            AI-powered scholarship funding classification system with Gemini integration
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700">
          {[
            { id: 'single', label: 'Single Classification' },
            { id: 'batch', label: 'Batch Processing' },
            { id: 'validation', label: 'Validation' },
            { id: 'test', label: 'System Test' },
            { id: 'schema', label: 'Schema' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Single Classification Tab */}
        {activeTab === 'single' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">Single Scholarship Classification</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Scholarship Name</label>
                  <input
                    type="text"
                    value={singleScholarship.name}
                    onChange={(e) => setSingleScholarship({...singleScholarship, name: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter scholarship name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                  <input
                    type="text"
                    value={singleScholarship.country}
                    onChange={(e) => setSingleScholarship({...singleScholarship, country: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter country"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Eligibility & Funding Details</label>
                <textarea
                  value={singleScholarship.eligibility}
                  onChange={(e) => setSingleScholarship({...singleScholarship, eligibility: e.target.value})}
                  rows={4}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the funding coverage and eligibility requirements"
                />
              </div>
              
              <button
                onClick={handleSingleClassification}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Classifying...
                  </>
                ) : (
                  'Classify Funding'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Batch Classification Tab */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">Batch Funding Classification</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Concurrency Level</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value))}
                  className="w-32 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-4 mb-6">
                {batchScholarships.map((scholarship, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-gray-200">Scholarship {index + 1}</h3>
                      <button
                        onClick={() => removeBatchScholarship(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <input
                        type="text"
                        value={scholarship.name}
                        onChange={(e) => updateBatchScholarship(index, 'name', e.target.value)}
                        placeholder="Scholarship name"
                        className="p-2 bg-gray-600 border border-gray-500 rounded text-white focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={scholarship.country}
                        onChange={(e) => updateBatchScholarship(index, 'country', e.target.value)}
                        placeholder="Country"
                        className="p-2 bg-gray-600 border border-gray-500 rounded text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <textarea
                      value={scholarship.eligibility}
                      onChange={(e) => updateBatchScholarship(index, 'eligibility', e.target.value)}
                      placeholder="Funding details and eligibility"
                      rows={2}
                      className="w-full p-2 bg-gray-600 border border-gray-500 rounded text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={addBatchScholarship}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Scholarship
                </button>
                
                <button
                  onClick={handleBatchClassification}
                  disabled={loading || batchScholarships.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    `Classify ${batchScholarships.length} Scholarships`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Tab */}
        {activeTab === 'validation' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">Classification Validation</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Funding Status</label>
                  <select
                    value={validationInput.isFullyFunded}
                    onChange={(e) => setValidationInput({...validationInput, isFullyFunded: e.target.value === 'true'})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Fully Funded</option>
                    <option value="false">Partially Funded</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Reason (max 160 characters)</label>
                  <textarea
                    value={validationInput.reason}
                    onChange={(e) => setValidationInput({...validationInput, reason: e.target.value})}
                    maxLength={160}
                    rows={3}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Explain the funding classification reasoning"
                  />
                  <p className="text-sm text-gray-400 mt-1">{validationInput.reason.length}/160 characters</p>
                </div>
              </div>
              
              <button
                onClick={handleValidation}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Validating...
                  </>
                ) : (
                  'Validate Classification'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">System Test</h2>
              <p className="text-gray-300 mb-6">
                Test the funding classification system with predefined scholarship examples.
              </p>
              
              <button
                onClick={handleTest}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Running Tests...
                  </>
                ) : (
                  'Run System Test'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">Classification Schema</h2>
              <p className="text-gray-300 mb-6">
                View the funding classification schema and validation rules.
              </p>
              
              <button
                onClick={handleGetSchema}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading Schema...
                  </>
                ) : (
                  'Get Schema'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">Results</h2>
            
            {results.type === 'single' && (
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      results.formatted.color === 'green' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {results.formatted.status}
                    </span>
                    <span className="text-sm text-gray-400">Confidence: {results.formatted.confidence}</span>
                  </div>
                  <p className="text-gray-300 mb-2"><strong>Reason:</strong> {results.formatted.reason}</p>
                  <p className="text-sm text-gray-400">Model: {results.formatted.model}</p>
                </div>
                
                {results.keywords && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-blue-400 mb-2">Keyword Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-400 mb-1">Full Funding Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {results.keywords.fullFundingKeywords.map((keyword, i) => (
                            <span key={i} className="px-2 py-1 bg-green-600 text-xs rounded">{keyword}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-orange-400 mb-1">Partial Funding Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {results.keywords.partialFundingKeywords.map((keyword, i) => (
                            <span key={i} className="px-2 py-1 bg-orange-600 text-xs rounded">{keyword}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {results.type === 'batch' && (
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-400 mb-2">Batch Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">{results.summary.total}</div>
                      <div className="text-sm text-gray-400">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">{results.summary.fullyFunded}</div>
                      <div className="text-sm text-gray-400">Fully Funded</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-400">{results.summary.partiallyFunded}</div>
                      <div className="text-sm text-gray-400">Partially Funded</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{results.summary.averageTimePerScholarship}ms</div>
                      <div className="text-sm text-gray-400">Avg Time</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {results.data.data.results.map((result, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-medium text-white">{result.scholarshipId}</span>
                        <span className="ml-2 text-sm text-gray-400">{result.classification?.reason}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        result.classification?.isFullyFunded ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {getFundingStatusText(result.classification?.isFullyFunded)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-gray-900 rounded border">
              <details>
                <summary className="cursor-pointer text-gray-400 hover:text-white">View Raw Response</summary>
                <pre className="mt-2 text-xs text-gray-300 overflow-auto">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundingDemo;
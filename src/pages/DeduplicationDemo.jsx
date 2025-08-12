import React, { useState, useEffect } from 'react';
import deduplicationService, { deduplicationUtils } from '../services/deduplicationService';

const DeduplicationDemo = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schema, setSchema] = useState(null);
  
  // Single deduplication state
  const [singleItems, setSingleItems] = useState('');
  const [singleMethod, setSingleMethod] = useState('hybrid');
  const [singleResult, setSingleResult] = useState(null);
  
  // Batch deduplication state
  const [batchItems, setBatchItems] = useState('');
  const [batchMethod, setBatchMethod] = useState('hybrid');
  const [batchResult, setBatchResult] = useState(null);
  
  // Validation state
  const [originalItems, setOriginalItems] = useState('');
  const [deduplicatedItems, setDeduplicatedItems] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  
  // Test state
  const [testMethod, setTestMethod] = useState('hybrid');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      const response = await deduplicationService.getSchema();
      setSchema(response.schema);
    } catch (err) {
      console.error('Error loading schema:', err);
    }
  };

  const handleSingleDeduplicate = async () => {
    if (!singleItems.trim()) {
      setError('Please enter scholarship items JSON');
      return;
    }

    setLoading(true);
    setError('');
    setSingleResult(null);

    try {
      const items = JSON.parse(singleItems);
      
      if (!Array.isArray(items)) {
        throw new Error('Items must be an array');
      }

      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const validation = deduplicationUtils.validateScholarshipObject(items[i]);
        if (!validation.isValid) {
          throw new Error(`Item ${i + 1}: ${validation.error}`);
        }
      }

      const result = await deduplicationService.deduplicateScholarships(items, singleMethod);
      setSingleResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDeduplicate = async () => {
    if (!batchItems.trim()) {
      setError('Please enter batch items JSON');
      return;
    }

    setLoading(true);
    setError('');
    setBatchResult(null);

    try {
      const batches = JSON.parse(batchItems);
      
      if (!Array.isArray(batches)) {
        throw new Error('Batches must be an array of arrays');
      }

      const result = await deduplicationService.batchDeduplicate(batches, batchMethod);
      setBatchResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async () => {
    if (!originalItems.trim() || !deduplicatedItems.trim()) {
      setError('Please enter both original and deduplicated items JSON');
      return;
    }

    setLoading(true);
    setError('');
    setValidationResult(null);

    try {
      const original = JSON.parse(originalItems);
      const deduplicated = JSON.parse(deduplicatedItems);
      
      const result = await deduplicationService.validateDeduplication(original, deduplicated);
      setValidationResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setError('');
    setTestResult(null);

    try {
      const result = await deduplicationService.testDeduplication(testMethod);
      setTestResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    const sampleData = deduplicationUtils.generateSampleData();
    setSingleItems(JSON.stringify(sampleData, null, 2));
  };

  const loadBatchSampleData = () => {
    const sampleData = deduplicationUtils.generateSampleData();
    const batch1 = sampleData.slice(0, 3);
    const batch2 = sampleData.slice(2, 5); // Overlapping to show deduplication
    setBatchItems(JSON.stringify([batch1, batch2], null, 2));
  };

  const renderMethodBadge = (method) => {
    const color = deduplicationUtils.getMethodColor(method);
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${color}`}>
        {method.toUpperCase()}
      </span>
    );
  };

  const renderStats = (stats) => {
    if (!stats) return null;

    const statusColor = deduplicationUtils.getStatusColor(stats.rate);
    const statusText = deduplicationUtils.getStatusText(stats.rate);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-400">Original</div>
          <div className="text-xl font-bold text-white">{stats.original}</div>
        </div>
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-400">Deduplicated</div>
          <div className="text-xl font-bold text-green-400">{stats.deduplicated}</div>
        </div>
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-400">Removed</div>
          <div className="text-xl font-bold text-red-400">{stats.removed}</div>
        </div>
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-400">Status</div>
          <div className={`text-sm font-medium ${statusColor}`}>{statusText}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Deduplication Demo</h1>
          <p className="text-gray-400">
            Test the Phase 7.4 scholarship deduplication system that identifies and merges near-identical items from multiple sources.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          {[
            { id: 'single', label: 'Single Deduplication' },
            { id: 'batch', label: 'Batch Deduplication' },
            { id: 'validation', label: 'Validation' },
            { id: 'test', label: 'System Test' },
            { id: 'schema', label: 'Schema' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Single Deduplication Tab */}
        {activeTab === 'single' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Single Array Deduplication</h2>
                <button
                  onClick={loadSampleData}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  Load Sample Data
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Method</label>
                <select
                  value={singleMethod}
                  onChange={(e) => setSingleMethod(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hybrid">Hybrid (AI + Rules)</option>
                  <option value="ai">AI Only</option>
                  <option value="rules">Rules Only</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Scholarship Items (JSON Array)</label>
                <textarea
                  value={singleItems}
                  onChange={(e) => setSingleItems(e.target.value)}
                  placeholder='[{"title": "Scholarship Name", "organization": "Org Name", ...}]'
                  className="w-full h-40 p-3 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <button
                onClick={handleSingleDeduplicate}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium transition-colors"
              >
                {loading ? 'Deduplicating...' : 'Deduplicate Items'}
              </button>
            </div>

            {singleResult && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Deduplication Results</h3>
                  {renderMethodBadge(singleResult.method)}
                </div>
                
                {renderStats(deduplicationUtils.formatResults(singleResult).stats)}
                
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Deduplicated Items ({singleResult.deduplicatedCount})</h4>
                  <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto max-h-96">
                    {JSON.stringify(singleResult.deduplicated, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Batch Deduplication Tab */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Batch Deduplication</h2>
                <button
                  onClick={loadBatchSampleData}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  Load Sample Data
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Method</label>
                <select
                  value={batchMethod}
                  onChange={(e) => setBatchMethod(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hybrid">Hybrid (AI + Rules)</option>
                  <option value="ai">AI Only</option>
                  <option value="rules">Rules Only</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Batch Items (Array of Arrays)</label>
                <textarea
                  value={batchItems}
                  onChange={(e) => setBatchItems(e.target.value)}
                  placeholder='[[{"title": "Scholarship 1", ...}], [{"title": "Scholarship 2", ...}]]'
                  className="w-full h-40 p-3 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <button
                onClick={handleBatchDeduplicate}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium transition-colors"
              >
                {loading ? 'Processing Batches...' : 'Deduplicate Batches'}
              </button>
            </div>

            {batchResult && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Batch Results</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-gray-900 p-3 rounded">
                    <div className="text-sm text-gray-400">Total Batches</div>
                    <div className="text-xl font-bold text-white">{batchResult.summary?.totalBatches || 0}</div>
                  </div>
                  <div className="bg-gray-900 p-3 rounded">
                    <div className="text-sm text-gray-400">Successful</div>
                    <div className="text-xl font-bold text-green-400">{batchResult.summary?.successfulBatches || 0}</div>
                  </div>
                  <div className="bg-gray-900 p-3 rounded">
                    <div className="text-sm text-gray-400">Original Items</div>
                    <div className="text-xl font-bold text-blue-400">{batchResult.summary?.totalOriginalItems || 0}</div>
                  </div>
                  <div className="bg-gray-900 p-3 rounded">
                    <div className="text-sm text-gray-400">Deduplicated</div>
                    <div className="text-xl font-bold text-green-400">{batchResult.summary?.totalDeduplicatedItems || 0}</div>
                  </div>
                  <div className="bg-gray-900 p-3 rounded">
                    <div className="text-sm text-gray-400">Removed</div>
                    <div className="text-xl font-bold text-red-400">{batchResult.summary?.totalDuplicatesRemoved || 0}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {batchResult.results?.map((result, index) => (
                    <div key={index} className="bg-gray-900 p-4 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">Batch {index + 1}</h4>
                        {result.success ? (
                          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">SUCCESS</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">ERROR</span>
                        )}
                        {result.method && renderMethodBadge(result.method)}
                      </div>
                      
                      {result.success ? (
                        <div className="text-sm text-gray-300">
                          {result.originalCount} → {result.deduplicatedCount} items 
                          ({result.duplicatesRemoved} duplicates removed)
                        </div>
                      ) : (
                        <div className="text-sm text-red-400">{result.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation Tab */}
        {activeTab === 'validation' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Validate Deduplication Results</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Original Items (JSON Array)</label>
                  <textarea
                    value={originalItems}
                    onChange={(e) => setOriginalItems(e.target.value)}
                    placeholder='[{"title": "Original Item 1", ...}]'
                    className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Deduplicated Items (JSON Array)</label>
                  <textarea
                    value={deduplicatedItems}
                    onChange={(e) => setDeduplicatedItems(e.target.value)}
                    placeholder='[{"title": "Deduplicated Item 1", ...}]'
                    className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleValidation}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium transition-colors"
              >
                {loading ? 'Validating...' : 'Validate Results'}
              </button>
            </div>

            {validationResult && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Validation Results</h3>
                
                <div className="mb-4">
                  <span className={`px-3 py-1 rounded font-medium ${
                    validationResult.validation?.isValid 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {validationResult.validation?.isValid ? 'VALID' : 'INVALID'}
                  </span>
                </div>
                
                {validationResult.validation?.statistics && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-900 p-3 rounded">
                      <div className="text-sm text-gray-400">Original Count</div>
                      <div className="text-xl font-bold text-white">
                        {validationResult.validation.statistics.originalCount}
                      </div>
                    </div>
                    <div className="bg-gray-900 p-3 rounded">
                      <div className="text-sm text-gray-400">Deduplicated Count</div>
                      <div className="text-xl font-bold text-green-400">
                        {validationResult.validation.statistics.deduplicatedCount}
                      </div>
                    </div>
                    <div className="bg-gray-900 p-3 rounded">
                      <div className="text-sm text-gray-400">Reduction Rate</div>
                      <div className="text-xl font-bold text-blue-400">
                        {(validationResult.validation.statistics.reductionRate * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
                
                {validationResult.validation?.errors?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-red-400 mb-2">Errors:</h4>
                    <ul className="list-disc list-inside text-red-300 space-y-1">
                      {validationResult.validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validationResult.validation?.warnings?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-400 mb-2">Warnings:</h4>
                    <ul className="list-disc list-inside text-yellow-300 space-y-1">
                      {validationResult.validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">System Test</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Test Method</label>
                <select
                  value={testMethod}
                  onChange={(e) => setTestMethod(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hybrid">Hybrid (AI + Rules)</option>
                  <option value="ai">AI Only</option>
                  <option value="rules">Rules Only</option>
                </select>
              </div>

              <button
                onClick={handleTest}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium transition-colors"
              >
                {loading ? 'Running Test...' : 'Run System Test'}
              </button>
            </div>

            {testResult && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Test Results</h3>
                
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Input Data:</h4>
                  <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto max-h-48">
                    {JSON.stringify(testResult.testData?.input, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Output Results:</h4>
                  <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto max-h-96">
                    {JSON.stringify(testResult.testData?.output, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API Schema</h2>
            {schema ? (
              <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(schema, null, 2)}
              </pre>
            ) : (
              <div className="text-gray-400">Loading schema...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeduplicationDemo;
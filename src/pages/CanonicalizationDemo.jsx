import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Hero } from '../components/Hero';
import { 
  canonicalizeDegreeField, 
  batchCanonicalizeDegreeField, 
  testCanonicalization,
  createMockCanonicalizationData,
  formatCanonicalizationResult,
  getValidDegreeTargets
} from '../services/canonicalizationService';

const CanonicalizationDemo = () => {
  const [singleInput, setSingleInput] = useState({ degreeTarget: '', field: '' });
  const [singleResult, setSingleResult] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('single');

  const handleSingleCanonicalization = async () => {
    if (!singleInput.degreeTarget.trim() || !singleInput.field.trim()) {
      setError('Please enter both degree and field');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await canonicalizeDegreeField(singleInput.degreeTarget, singleInput.field);
      const formatted = formatCanonicalizationResult(singleInput, result);
      setSingleResult(formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchCanonicalization = async () => {
    setLoading(true);
    setError(null);

    try {
      const mockData = createMockCanonicalizationData();
      const inputs = mockData.map(item => item.input);
      const results = await batchCanonicalizeDegreeField(inputs);
      
      const formattedResults = inputs.map((input, index) => ({
        ...formatCanonicalizationResult(input, results[index]),
        id: index
      }));
      
      setBatchResults(formattedResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCanonicalization = async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await testCanonicalization();
      setTestResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validDegrees = getValidDegreeTargets();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Hero 
        title="Degree & Field Canonicalization"
        subtitle="UNESCO-ish Taxonomy Normalization Demo"
        description="Transform free text degree and field inputs into standardized, controlled vocabulary using AI-powered canonicalization."
      />

      <div className="container mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800/50 rounded-lg p-1 flex space-x-1">
            {[
              { id: 'single', label: 'Single Input' },
              { id: 'batch', label: 'Batch Processing' },
              { id: 'test', label: 'API Test' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-500/20 bg-red-500/10">
            <div className="p-4">
              <h3 className="text-red-400 font-semibold mb-2">Error</h3>
              <p className="text-red-300">{error}</p>
            </div>
          </Card>
        )}

        {/* Single Input Tab */}
        {activeTab === 'single' && (
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 mb-6">
              <h2 className="text-2xl font-bold text-white mb-6">Single Canonicalization</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Degree Target (Free Text)
                  </label>
                  <input
                    type="text"
                    value={singleInput.degreeTarget}
                    onChange={(e) => setSingleInput(prev => ({ ...prev, degreeTarget: e.target.value }))}
                    placeholder="e.g., bachelor of science, masters, doctorate, BS, PhD"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Field (Free Text)
                  </label>
                  <input
                    type="text"
                    value={singleInput.field}
                    onChange={(e) => setSingleInput(prev => ({ ...prev, field: e.target.value }))}
                    placeholder="e.g., computer science, electrical eng, CS, public health"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSingleCanonicalization}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Canonicalizing...' : 'Canonicalize'}
              </Button>
            </Card>

            {/* Single Result */}
            {singleResult && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Canonicalization Result</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="text-purple-400 font-medium mb-3">Original Input</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-400 text-sm">Degree:</span>
                        <p className="text-white">{singleResult.original.degree}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Field:</span>
                        <p className="text-white">{singleResult.original.field}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-900/20 rounded-lg p-4">
                    <h4 className="text-green-400 font-medium mb-3">Canonicalized Output</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-400 text-sm">Degree:</span>
                        <p className={`font-medium ${
                          singleResult.changes.degreeChanged ? 'text-green-400' : 'text-white'
                        }`}>
                          {singleResult.canonicalized.degree}
                          {singleResult.changes.degreeChanged && ' ✓'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Field:</span>
                        <p className={`font-medium ${
                          singleResult.changes.fieldChanged ? 'text-green-400' : 'text-white'
                        }`}>
                          {singleResult.canonicalized.field}
                          {singleResult.changes.fieldChanged && ' ✓'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Batch Processing Tab */}
        {activeTab === 'batch' && (
          <div className="max-w-6xl mx-auto">
            <Card className="p-8 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Batch Processing</h2>
              <p className="text-gray-300 mb-6">
                Process multiple degree and field pairs simultaneously using sample data.
              </p>
              
              <Button 
                onClick={handleBatchCanonicalization}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Processing Batch...' : 'Run Batch Canonicalization'}
              </Button>
            </Card>

            {/* Batch Results */}
            {batchResults.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Batch Results ({batchResults.length} items)
                </h3>
                
                <div className="space-y-4">
                  {batchResults.map((result) => (
                    <div key={result.id} className="bg-slate-800/30 rounded-lg p-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-purple-400 font-medium mb-2">Input</h4>
                          <p className="text-sm text-gray-300">
                            {result.original.degree} → {result.original.field}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-green-400 font-medium mb-2">Output</h4>
                          <p className="text-sm text-white">
                            {result.canonicalized.degree} → {result.canonicalized.field}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-blue-400 font-medium mb-2">Changes</h4>
                          <div className="flex space-x-2 text-xs">
                            {result.changes.degreeChanged && (
                              <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded">
                                Degree ✓
                              </span>
                            )}
                            {result.changes.fieldChanged && (
                              <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                                Field ✓
                              </span>
                            )}
                            {!result.changes.degreeChanged && !result.changes.fieldChanged && (
                              <span className="bg-gray-600/20 text-gray-400 px-2 py-1 rounded">
                                No changes
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* API Test Tab */}
        {activeTab === 'test' && (
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">API Test</h2>
              <p className="text-gray-300 mb-6">
                Test the canonicalization API with predefined test cases to verify functionality.
              </p>
              
              <Button 
                onClick={handleTestCanonicalization}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Running Tests...' : 'Run API Tests'}
              </Button>
            </Card>

            {/* Test Results */}
            {testResults && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">Test Results</h3>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-green-400">
                      ✓ {testResults.summary.successful} passed
                    </span>
                    <span className="text-red-400">
                      ✗ {testResults.summary.failed} failed
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {testResults.results.map((result, index) => (
                    <div 
                      key={index} 
                      className={`rounded-lg p-4 ${
                        result.status === 'success' 
                          ? 'bg-green-900/20 border border-green-500/20' 
                          : 'bg-red-900/20 border border-red-500/20'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm text-gray-300 mb-1">
                            Input: {result.input.degreeTarget} → {result.input.field}
                          </div>
                          {result.status === 'success' ? (
                            <div className="text-sm text-white">
                              Output: {result.output.degreeTarget || 'null'} → {result.output.field || 'null'}
                            </div>
                          ) : (
                            <div className="text-sm text-red-300">
                              Error: {result.error}
                            </div>
                          )}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          result.status === 'success' 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {result.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Valid Degrees Reference */}
        <Card className="mt-8 p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-3">Controlled Vocabulary Reference</h3>
          <div>
            <h4 className="text-purple-400 font-medium mb-2">Valid Degree Targets:</h4>
            <div className="flex flex-wrap gap-2">
              {validDegrees.map((degree) => (
                <span 
                  key={degree}
                  className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm"
                >
                  {degree}
                </span>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-3">
              Fields are canonicalized to compact canonical labels (e.g., "Computer Science", "Electrical Engineering", "Public Health").
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CanonicalizationDemo;
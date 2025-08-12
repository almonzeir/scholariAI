import React, { useState, useEffect } from 'react';
import {
  parseDeadline,
  parseDeadlineWithAI,
  parseDeadlineWithRules,
  batchParseDeadlines,
  testDeadlineParsing,
  validateDeadline,
  getDeadlineParsingSchema,
  formatDeadlineForDisplay,
  getDeadlineStatus,
  getDeadlineUrgency,
  getUrgencyColor,
  getDaysUntilDeadline,
  extractDeadlineKeywords
} from '../services/deadlineService.js';

const DeadlineDemo = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Single parsing state
  const [singleText, setSingleText] = useState('');
  const [singleResult, setSingleResult] = useState(null);
  const [parseMethod, setParseMethod] = useState('hybrid');
  
  // Batch parsing state
  const [batchTexts, setBatchTexts] = useState(['']);
  const [batchResults, setBatchResults] = useState(null);
  
  // Validation state
  const [validationDeadline, setValidationDeadline] = useState('');
  const [validationText, setValidationText] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  
  // Test state
  const [testResults, setTestResults] = useState(null);
  
  // Schema state
  const [schema, setSchema] = useState(null);
  
  const handleSingleParse = async () => {
    if (!singleText.trim()) {
      setError('Please enter deadline text to parse');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let result;
      switch (parseMethod) {
        case 'ai':
          result = await parseDeadlineWithAI(singleText);
          break;
        case 'rules':
          result = await parseDeadlineWithRules(singleText);
          break;
        default:
          result = await parseDeadline(singleText);
      }
      setSingleResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBatchParse = async () => {
    const validTexts = batchTexts.filter(text => text.trim());
    if (validTexts.length === 0) {
      setError('Please enter at least one deadline text to parse');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await batchParseDeadlines(validTexts);
      setBatchResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleValidation = async () => {
    if (!validationDeadline.trim()) {
      setError('Please enter a deadline to validate');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await validateDeadline(validationDeadline, validationText);
      setValidationResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await testDeadlineParsing();
      setTestResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadSchema = async () => {
    try {
      const result = await getDeadlineParsingSchema();
      setSchema(result.schema);
    } catch (err) {
      console.error('Failed to load schema:', err);
    }
  };
  
  useEffect(() => {
    loadSchema();
  }, []);
  
  const addBatchText = () => {
    setBatchTexts([...batchTexts, '']);
  };
  
  const removeBatchText = (index) => {
    setBatchTexts(batchTexts.filter((_, i) => i !== index));
  };
  
  const updateBatchText = (index, value) => {
    const newTexts = [...batchTexts];
    newTexts[index] = value;
    setBatchTexts(newTexts);
  };
  
  const renderDeadlineInfo = (deadline) => {
    if (!deadline) return null;
    
    const status = getDeadlineStatus(deadline);
    const urgency = getDeadlineUrgency(deadline);
    const daysUntil = getDaysUntilDeadline(deadline);
    const urgencyColor = getUrgencyColor(urgency);
    
    return (
      <div className="mt-2 p-3 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-300">Formatted:</span>
          <span className="text-white">{formatDeadlineForDisplay(deadline)}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Status:</span>
            <span className="capitalize" style={{ color: urgencyColor }}>
              {status}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Urgency:</span>
            <span className="capitalize" style={{ color: urgencyColor }}>
              {urgency}
            </span>
          </div>
          {daysUntil !== null && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Days:</span>
              <span className="text-white">
                {daysUntil > 0 ? `${daysUntil} days left` : 
                 daysUntil === 0 ? 'Today' : 
                 `${Math.abs(daysUntil)} days ago`}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Deadline Parser Demo</h1>
          <p className="text-gray-400">
            Test the robust date normalization system that parses application deadlines into ISO YYYY-MM-DD format or "varies".
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            {[
              { id: 'single', label: 'Single Parse' },
              { id: 'batch', label: 'Batch Parse' },
              { id: 'validate', label: 'Validate' },
              { id: 'test', label: 'Test System' },
              { id: 'schema', label: 'Schema' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Single Parse Tab */}
        {activeTab === 'single' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Parse Single Deadline</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Parse Method
                  </label>
                  <select
                    value={parseMethod}
                    onChange={(e) => setParseMethod(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hybrid">Hybrid (AI + Rules Fallback)</option>
                    <option value="ai">AI Only</option>
                    <option value="rules">Rule-based Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deadline Text
                  </label>
                  <textarea
                    value={singleText}
                    onChange={(e) => setSingleText(e.target.value)}
                    placeholder="Enter deadline text (e.g., 'Application deadline: December 31, 2024' or 'Rolling admissions')"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <button
                  onClick={handleSingleParse}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Parsing...' : 'Parse Deadline'}
                </button>
              </div>
              
              {singleResult && (
                <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Result</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-300">Deadline:</span>
                      <span className="text-green-400 font-mono">{singleResult.result.deadline}</span>
                    </div>
                    {renderDeadlineInfo(singleResult.result.deadline)}
                    
                    {singleResult.metadata && (
                      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Metadata</h4>
                        <div className="text-sm text-gray-400 space-y-1">
                          <div>Processing Time: {singleResult.metadata.processingTimeMs}ms</div>
                          <div>Method: {singleResult.metadata.method}</div>
                          <div>Input Length: {singleResult.metadata.inputLength} characters</div>
                        </div>
                      </div>
                    )}
                    
                    {singleText && (
                      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Keywords Found</h4>
                        <div className="flex flex-wrap gap-2">
                          {extractDeadlineKeywords(singleText).map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-600 text-blue-100 rounded text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Batch Parse Tab */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Batch Parse Deadlines</h2>
              
              <div className="space-y-4">
                {batchTexts.map((text, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={text}
                      onChange={(e) => updateBatchText(index, e.target.value)}
                      placeholder={`Deadline text ${index + 1}`}
                      className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                    {batchTexts.length > 1 && (
                      <button
                        onClick={() => removeBatchText(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <button
                    onClick={addBatchText}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Add Text
                  </button>
                  <button
                    onClick={handleBatchParse}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? 'Processing...' : 'Parse All'}
                  </button>
                </div>
              </div>
              
              {batchResults && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Batch Results</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{batchResults.summary.total}</div>
                        <div className="text-gray-400">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{batchResults.summary.successful}</div>
                        <div className="text-gray-400">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{batchResults.summary.failed}</div>
                        <div className="text-gray-400">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{batchResults.summary.averageTimePerText}ms</div>
                        <div className="text-gray-400">Avg Time</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {batchResults.results.map((result, index) => (
                      <div key={index} className="p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm text-gray-400">Text {index + 1}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            result.success ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                          }`}>
                            {result.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 mb-2">"{result.text}"</div>
                        {result.success ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-300">Deadline:</span>
                              <span className="text-green-400 font-mono">{result.result.deadline}</span>
                            </div>
                            {renderDeadlineInfo(result.result.deadline)}
                          </div>
                        ) : (
                          <div className="text-red-400 text-sm">{result.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Validate Tab */}
        {activeTab === 'validate' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Validate Deadline</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deadline to Validate
                  </label>
                  <input
                    type="text"
                    value={validationDeadline}
                    onChange={(e) => setValidationDeadline(e.target.value)}
                    placeholder="e.g., 2024-12-31 or varies"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Original Text (Optional)
                  </label>
                  <textarea
                    value={validationText}
                    onChange={(e) => setValidationText(e.target.value)}
                    placeholder="Original deadline text for context"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
                
                <button
                  onClick={handleValidation}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Validating...' : 'Validate Deadline'}
                </button>
              </div>
              
              {validationResult && (
                <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Validation Result</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-300">Valid:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        validationResult.validation.isValid 
                          ? 'bg-green-600 text-green-100' 
                          : 'bg-red-600 text-red-100'
                      }`}>
                        {validationResult.validation.isValid ? 'Yes' : 'No'}
                      </span>
                    </div>
                    
                    {validationResult.validation.format && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-300">Format:</span>
                        <span className="text-blue-400">{validationResult.validation.format}</span>
                      </div>
                    )}
                    
                    {validationResult.validation.issues && validationResult.validation.issues.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-300">Issues:</span>
                        <ul className="mt-1 space-y-1">
                          {validationResult.validation.issues.map((issue, index) => (
                            <li key={index} className="text-sm text-red-400 ml-4">• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">System Test</h2>
              <p className="text-gray-400 mb-4">
                Run comprehensive tests with sample deadline texts to verify system accuracy.
              </p>
              
              <button
                onClick={handleTest}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Running Tests...' : 'Run Tests'}
              </button>
              
              {testResults && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Test Summary</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-400">{testResults.testResults.total}</div>
                        <div className="text-gray-400">Total Tests</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-400">{testResults.testResults.passed}</div>
                        <div className="text-gray-400">Passed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-400">{testResults.testResults.failed}</div>
                        <div className="text-gray-400">Failed</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {testResults.testResults.details.map((test, index) => (
                      <div key={index} className="p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium">{test.name}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            test.passed ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                          }`}>
                            {test.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 mb-2">"{test.input}"</div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">Expected:</span>
                            <span className="text-yellow-400 font-mono">{test.expected}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">Actual:</span>
                            <span className={`font-mono ${
                              test.passed ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {test.actual || 'null'}
                            </span>
                          </div>
                        </div>
                        {test.error && (
                          <div className="mt-2 text-sm text-red-400">
                            Error: {test.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Deadline Parsing Schema</h2>
              
              {schema ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Input Schema</h3>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-400">Type:</span> <span className="text-blue-400">{schema.input.type}</span></div>
                        <div><span className="text-gray-400">Description:</span> <span className="text-gray-300">{schema.input.description}</span></div>
                        <div><span className="text-gray-400">Example:</span> <span className="text-green-400 font-mono">"{schema.input.example}"</span></div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Output Schema</h3>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <div className="space-y-3 text-sm">
                        <div><span className="text-gray-400">Type:</span> <span className="text-blue-400">{schema.output.type}</span></div>
                        <div>
                          <span className="text-gray-400">Properties:</span>
                          <div className="ml-4 mt-2 space-y-2">
                            <div>
                              <span className="text-yellow-400">deadline:</span>
                              <div className="ml-4 space-y-1">
                                <div><span className="text-gray-400">Type:</span> <span className="text-blue-400">{schema.output.properties.deadline.type}</span></div>
                                <div><span className="text-gray-400">Pattern:</span> <span className="text-green-400 font-mono">{schema.output.properties.deadline.pattern}</span></div>
                                <div><span className="text-gray-400">Description:</span> <span className="text-gray-300">{schema.output.properties.deadline.description}</span></div>
                                <div>
                                  <span className="text-gray-400">Examples:</span>
                                  <div className="flex gap-2 mt-1">
                                    {schema.output.properties.deadline.examples.map((example, index) => (
                                      <span key={index} className="px-2 py-1 bg-gray-600 rounded text-xs font-mono">{example}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div><span className="text-gray-400">Required:</span> <span className="text-red-400">{schema.output.required.join(', ')}</span></div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Parsing Rules</h3>
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <ul className="space-y-2 text-sm">
                        {schema.rules.map((rule, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span className="text-gray-300">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">Loading schema...</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeadlineDemo;
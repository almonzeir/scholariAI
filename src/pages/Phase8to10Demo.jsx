import React, { useState, useEffect } from 'react';
import testDataService from '../services/testDataService';
import { MICROCOPY, TOASTS } from '../lib/microcopy';

// Import SVG icons as URLs
import UploadIcon from '../assets/icons/upload.svg';
import QuestionsIcon from '../assets/icons/questions.svg';
import FilterIcon from '../assets/icons/filter.svg';
import OpenLinkIcon from '../assets/icons/openLink.svg';
import CopyIcon from '../assets/icons/copy.svg';

const Phase8to10Demo = () => {
  const [activeTab, setActiveTab] = useState('microcopy');
  const [testData, setTestData] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [showToast, setShowToast] = useState(null);
  const [validationResults, setValidationResults] = useState(null);

  useEffect(() => {
    // Load test data on component mount
    const loadTestData = () => {
      const data = {
        profiles: testDataService.getSyntheticProfiles(),
        scholarships: testDataService.getAdversarialScholarships(),
        scenarios: testDataService.generateTestScenarios(),
        validation: testDataService.validateTestData()
      };
      setTestData(data);
      setValidationResults(data.validation);
    };

    loadTestData();
  }, []);

  const showToastMessage = (key) => {
    setShowToast({ key, message: TOASTS[key] });
    setTimeout(() => setShowToast(null), 3000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    showToastMessage('copyDone');
  };

  const renderMicrocopyDemo = () => (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Primary Buttons & CTAs</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(MICROCOPY.buttons).map(([key, text]) => (
            <button
              key={key}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              onClick={() => showToastMessage('parsingStart')}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Empty States</h3>
        <div className="grid gap-4">
          {Object.entries(MICROCOPY.emptyStates).map(([key, text]) => (
            <div key={key} className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-gray-400 text-sm mb-2">{key}</div>
              <div className="text-gray-300">{text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Error Hints</h3>
        <div className="grid gap-3">
          {Object.entries(MICROCOPY.errorHints).map(([key, text]) => (
            <div key={key} className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <div className="text-red-400 text-sm mb-1">{key}</div>
              <div className="text-red-300">{text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Toast Messages</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(TOASTS).map(([key, text]) => (
            <button
              key={key}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-left"
              onClick={() => showToastMessage(key)}
            >
              <div className="text-xs opacity-75">{key}</div>
              <div>{text}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTestDataDemo = () => (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Synthetic Profiles ({testData?.profiles?.length || 0})</h3>
          <button
            onClick={() => copyToClipboard(testData?.profiles)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
          >
            Copy All
          </button>
        </div>
        <div className="grid gap-4">
          {testData?.profiles?.slice(0, 3).map((profile) => (
            <div key={profile.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-white font-medium">{profile.firstName} {profile.lastName}</h4>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">{profile.specialStatus}</span>
              </div>
              <div className="text-gray-300 text-sm space-y-1">
                <div><strong>Field:</strong> {profile.fieldOfStudy}</div>
                <div><strong>Degree:</strong> {profile.degreeLevel}</div>
                <div><strong>Nationality:</strong> {profile.nationality}</div>
                <div><strong>GPA:</strong> {profile.currentGPA}</div>
              </div>
              <button
                onClick={() => setSelectedProfile(profile)}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                View Details →
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Adversarial Scholarships ({testData?.scholarships?.length || 0})</h3>
          <button
            onClick={() => copyToClipboard(testData?.scholarships)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
          >
            Copy All
          </button>
        </div>
        <div className="grid gap-4">
          {testData?.scholarships?.slice(0, 3).map((scholarship) => (
            <div key={scholarship.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-white font-medium">{scholarship.title}</h4>
                <div className="flex gap-2">
                  {scholarship.deadline === 'varies' && (
                    <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">No Deadline</span>
                  )}
                  {scholarship.amount.includes('TBD') && (
                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">Ambiguous $</span>
                  )}
                </div>
              </div>
              <div className="text-gray-300 text-sm space-y-1">
                <div><strong>Provider:</strong> {scholarship.provider}</div>
                <div><strong>Amount:</strong> {scholarship.amount}</div>
                <div><strong>Deadline:</strong> {scholarship.deadline}</div>
                <div><strong>Coverage:</strong> {scholarship.coverage.join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Test Scenarios</h3>
        <div className="grid gap-4">
          {testData?.scenarios && Object.entries(testData.scenarios).map(([key, scenario]) => (
            <div key={key} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-white font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                <button
                  onClick={() => setSelectedScenario(scenario)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Test Scenario →
                </button>
              </div>
              <div className="text-gray-300 text-sm">
                <div><strong>Profile:</strong> {scenario.profile?.firstName} {scenario.profile?.lastName}</div>
                <div><strong>Test Cases:</strong> {scenario.scholarships?.length} scholarships</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderIconsDemo = () => (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">3D Icon Set</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2">
              <img src={UploadIcon} alt="Upload" className="w-full h-full" />
            </div>
            <div className="text-gray-300 text-sm">Upload</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2">
              <img src={QuestionsIcon} alt="Questions" className="w-full h-full" />
            </div>
            <div className="text-gray-300 text-sm">Questions</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2">
              <img src={FilterIcon} alt="Filter" className="w-full h-full" />
            </div>
            <div className="text-gray-300 text-sm">Filter</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2">
              <img src={OpenLinkIcon} alt="Open Link" className="w-full h-full" />
            </div>
            <div className="text-gray-300 text-sm">Open Link</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2">
              <img src={CopyIcon} alt="Copy" className="w-full h-full" />
            </div>
            <div className="text-gray-300 text-sm">Copy</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Icon Usage Examples</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
            <UploadIcon className="w-8 h-8" />
            <span className="text-white">{MICROCOPY.buttons.uploadCV}</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
            <QuestionsIcon className="w-8 h-8" />
            <span className="text-white">{MICROCOPY.buttons.answerQuestions}</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
            <FilterIcon className="w-8 h-8" />
            <span className="text-white">{MICROCOPY.buttons.resetFilters}</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
            <OpenLinkIcon className="w-8 h-8" />
            <span className="text-white">{MICROCOPY.buttons.openLink}</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
            <CopyIcon className="w-8 h-8" />
            <span className="text-white">{MICROCOPY.buttons.copyAll}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderValidationDemo = () => (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Data Validation Results</h3>
        {validationResults && (
          <div className="space-y-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Profiles Validation</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-gray-300">
                  <div><strong>Count:</strong> {validationResults.profiles.count}</div>
                  <div><strong>Has Required Fields:</strong> {validationResults.profiles.hasRequiredFields ? '✅' : '❌'}</div>
                  <div><strong>Unique IDs:</strong> {validationResults.profiles.uniqueIds ? '✅' : '❌'}</div>
                </div>
                <div className="text-gray-300">
                  <div><strong>Fields Covered:</strong> {validationResults.profiles.fieldsCovered.length}</div>
                  <div><strong>Nationalities:</strong> {validationResults.profiles.nationalitiesCovered.length}</div>
                  <div><strong>Statuses:</strong> {validationResults.profiles.statusesCovered.length}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Scholarships Validation</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-gray-300">
                  <div><strong>Count:</strong> {validationResults.scholarships.count}</div>
                  <div><strong>Has Required Fields:</strong> {validationResults.scholarships.hasRequiredFields ? '✅' : '❌'}</div>
                  <div><strong>Unique IDs:</strong> {validationResults.scholarships.uniqueIds ? '✅' : '❌'}</div>
                </div>
                <div className="text-gray-300">
                  <div><strong>Missing Deadlines:</strong> {validationResults.scholarships.issueTypes.missingDeadlines}</div>
                  <div><strong>Ambiguous Funding:</strong> {validationResults.scholarships.issueTypes.ambiguousFunding}</div>
                  <div><strong>Partial Tuition:</strong> {validationResults.scholarships.issueTypes.partialTuition}</div>
                  <div><strong>Wrong Field Combos:</strong> {validationResults.scholarships.issueTypes.wrongFieldCombos}</div>
                  <div><strong>Duplicates:</strong> {validationResults.scholarships.issueTypes.duplicates}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Microcopy Validation</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                <div><strong>Buttons:</strong> {validationResults.microcopy.buttonsCount}</div>
                <div><strong>Empty States:</strong> {validationResults.microcopy.emptyStatesCount}</div>
                <div><strong>Error Hints:</strong> {validationResults.microcopy.errorHintsCount}</div>
                <div><strong>Toasts:</strong> {validationResults.microcopy.toastsCount}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Phase 8-10 Demo</h1>
          <p className="text-gray-400">Frontend Microcopy, QA Test Data & Visual Assets</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'microcopy', label: 'Microcopy & UI Text' },
            { key: 'testdata', label: 'Test Data & Scenarios' },
            { key: 'icons', label: 'Visual Assets & Icons' },
            { key: 'validation', label: 'Data Validation' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'microcopy' && renderMicrocopyDemo()}
          {activeTab === 'testdata' && renderTestDataDemo()}
          {activeTab === 'icons' && renderIconsDemo()}
          {activeTab === 'validation' && renderValidationDemo()}
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {showToast.message}
          </div>
        )}

        {/* Profile Detail Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Profile Details</h3>
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <pre className="text-gray-300 text-sm overflow-x-auto">
                {JSON.stringify(selectedProfile, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Scenario Detail Modal */}
        {selectedScenario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Test Scenario</h3>
                <button
                  onClick={() => setSelectedScenario(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <pre className="text-gray-300 text-sm overflow-x-auto">
                {JSON.stringify(selectedScenario, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Phase8to10Demo;
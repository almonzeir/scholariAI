/**
 * Canonicalization Service
 * Provides client-side interaction with the degree and field canonicalization API
 */

const API_BASE_URL = 'http://localhost:5002/api/canonicalize';

/**
 * Canonicalize a single degree and field pair
 * @param {string} degreeTarget - Free text degree input
 * @param {string} field - Free text field input
 * @returns {Promise<{degreeTarget: string|null, field: string|null}>}
 */
export async function canonicalizeDegreeField(degreeTarget, field) {
  try {
    const response = await fetch(`${API_BASE_URL}/degree-field`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ degreeTarget, field }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Canonicalization failed');
    }

    const data = await response.json();
    return data.output;
  } catch (error) {
    console.error('Canonicalization error:', error);
    throw error;
  }
}

/**
 * Canonicalize multiple degree and field pairs
 * @param {Array<{degreeTarget: string, field: string}>} inputs
 * @returns {Promise<Array<{degreeTarget: string|null, field: string|null}>>}
 */
export async function batchCanonicalizeDegreeField(inputs) {
  try {
    const response = await fetch(`${API_BASE_URL}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Batch canonicalization failed');
    }

    const data = await response.json();
    return data.outputs;
  } catch (error) {
    console.error('Batch canonicalization error:', error);
    throw error;
  }
}

/**
 * Test the canonicalization API with sample data
 * @returns {Promise<Object>} Test results
 */
export async function testCanonicalization() {
  try {
    const response = await fetch(`${API_BASE_URL}/test`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Test failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Test canonicalization error:', error);
    throw error;
  }
}

/**
 * Validate degree target against controlled vocabulary
 * @param {string} degree
 * @returns {boolean}
 */
export function isValidDegreeTarget(degree) {
  const validDegrees = ['Bachelor', 'Master', 'PhD'];
  return validDegrees.includes(degree);
}

/**
 * Get all valid degree targets
 * @returns {Array<string>}
 */
export function getValidDegreeTargets() {
  return ['Bachelor', 'Master', 'PhD'];
}

/**
 * Create mock canonicalization data for testing
 * @returns {Array<{input: Object, expected: Object}>}
 */
export function createMockCanonicalizationData() {
  return [
    {
      input: { degreeTarget: 'bachelor of science', field: 'computer science' },
      expected: { degreeTarget: 'Bachelor', field: 'Computer Science' }
    },
    {
      input: { degreeTarget: 'masters', field: 'electrical eng' },
      expected: { degreeTarget: 'Master', field: 'Electrical Engineering' }
    },
    {
      input: { degreeTarget: 'doctorate', field: 'public health' },
      expected: { degreeTarget: 'PhD', field: 'Public Health' }
    },
    {
      input: { degreeTarget: 'BS', field: 'CS' },
      expected: { degreeTarget: 'Bachelor', field: 'Computer Science' }
    },
    {
      input: { degreeTarget: 'phd', field: 'development studies' },
      expected: { degreeTarget: 'PhD', field: 'Development Studies' }
    },
    {
      input: { degreeTarget: 'undergraduate', field: 'software engineering' },
      expected: { degreeTarget: 'Bachelor', field: 'Software Engineering' }
    },
    {
      input: { degreeTarget: 'graduate', field: 'data science' },
      expected: { degreeTarget: 'Master', field: 'Data Science' }
    }
  ];
}

/**
 * Utility function to format canonicalization results for display
 * @param {Object} input - Original input
 * @param {Object} output - Canonicalized output
 * @returns {Object} Formatted result
 */
export function formatCanonicalizationResult(input, output) {
  return {
    original: {
      degree: input.degreeTarget,
      field: input.field
    },
    canonicalized: {
      degree: output.degreeTarget || 'Unknown',
      field: output.field || 'Unknown'
    },
    changes: {
      degreeChanged: input.degreeTarget !== output.degreeTarget,
      fieldChanged: input.field !== output.field
    }
  };
}
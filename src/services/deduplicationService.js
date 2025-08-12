import apiClient from './apiClient';

/**
 * Deduplication Service
 * Provides client-side interaction with the deduplication API
 */
class DeduplicationService {
  constructor() {
    this.baseURL = '/api/deduplication';
  }

  /**
   * Deduplicate scholarship items using hybrid approach
   */
  async deduplicateScholarships(items, method = 'hybrid') {
    try {
      const response = await apiClient.post(`${this.baseURL}/deduplicate`, {
        items,
        method
      });
      return response.data;
    } catch (error) {
      console.error('Error deduplicating scholarships:', error);
      throw new Error(error.response?.data?.error || 'Failed to deduplicate scholarships');
    }
  }

  /**
   * Deduplicate using AI only
   */
  async deduplicateWithAI(items) {
    try {
      const response = await apiClient.post(`${this.baseURL}/deduplicate-ai`, {
        items
      });
      return response.data;
    } catch (error) {
      console.error('Error with AI deduplication:', error);
      throw new Error(error.response?.data?.error || 'Failed to deduplicate with AI');
    }
  }

  /**
   * Deduplicate using rule-based approach only
   */
  async deduplicateWithRules(items) {
    try {
      const response = await apiClient.post(`${this.baseURL}/deduplicate-rules`, {
        items
      });
      return response.data;
    } catch (error) {
      console.error('Error with rule-based deduplication:', error);
      throw new Error(error.response?.data?.error || 'Failed to deduplicate with rules');
    }
  }

  /**
   * Deduplicate multiple arrays of scholarship items
   */
  async batchDeduplicate(batches, method = 'hybrid') {
    try {
      const response = await apiClient.post(`${this.baseURL}/batch-deduplicate`, {
        batches,
        method
      });
      return response.data;
    } catch (error) {
      console.error('Error with batch deduplication:', error);
      throw new Error(error.response?.data?.error || 'Failed to batch deduplicate');
    }
  }

  /**
   * Validate deduplication results
   */
  async validateDeduplication(original, deduplicated) {
    try {
      const response = await apiClient.post(`${this.baseURL}/validate`, {
        original,
        deduplicated
      });
      return response.data;
    } catch (error) {
      console.error('Error validating deduplication:', error);
      throw new Error(error.response?.data?.error || 'Failed to validate deduplication');
    }
  }

  /**
   * Test the deduplication system
   */
  async testDeduplication(method = 'hybrid') {
    try {
      const response = await apiClient.get(`${this.baseURL}/test`, {
        params: { method }
      });
      return response.data;
    } catch (error) {
      console.error('Error testing deduplication:', error);
      throw new Error(error.response?.data?.error || 'Failed to test deduplication');
    }
  }

  /**
   * Get deduplication API schema
   */
  async getSchema() {
    try {
      const response = await apiClient.get(`${this.baseURL}/schema`);
      return response.data;
    } catch (error) {
      console.error('Error getting deduplication schema:', error);
      throw new Error(error.response?.data?.error || 'Failed to get schema');
    }
  }
}

// Create singleton instance
const deduplicationService = new DeduplicationService();

// Utility functions
export const deduplicationUtils = {
  /**
   * Format deduplication results for display
   */
  formatResults(result) {
    if (!result || !result.success) {
      return {
        status: 'error',
        message: result?.error || 'Deduplication failed',
        items: [],
        stats: null
      };
    }

    return {
      status: 'success',
      message: `Successfully deduplicated ${result.originalCount} items to ${result.deduplicatedCount} items`,
      items: result.deduplicated || [],
      stats: {
        original: result.originalCount,
        deduplicated: result.deduplicatedCount,
        removed: result.duplicatesRemoved,
        rate: result.metadata?.deduplicationRate || 0,
        method: result.method,
        processingTime: result.metadata?.processingTime || 0,
        confidence: result.metadata?.confidence || 0
      }
    };
  },

  /**
   * Get status color based on deduplication rate
   */
  getStatusColor(rate) {
    if (rate >= 0.5) return 'text-red-400'; // High duplication
    if (rate >= 0.2) return 'text-yellow-400'; // Medium duplication
    if (rate > 0) return 'text-green-400'; // Low duplication
    return 'text-blue-400'; // No duplicates
  },

  /**
   * Get status text based on deduplication rate
   */
  getStatusText(rate) {
    if (rate >= 0.5) return 'High Duplication';
    if (rate >= 0.2) return 'Medium Duplication';
    if (rate > 0) return 'Low Duplication';
    return 'No Duplicates';
  },

  /**
   * Get method badge color
   */
  getMethodColor(method) {
    switch (method) {
      case 'ai': return 'bg-purple-500';
      case 'rules': return 'bg-blue-500';
      case 'hybrid': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  },

  /**
   * Validate scholarship object structure
   */
  validateScholarshipObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return { isValid: false, error: 'Object is required' };
    }

    const requiredFields = ['title'];
    const optionalFields = ['organization', 'amount', 'deadline', 'description', 'eligibility', 'requirements', 'link'];
    const allFields = [...requiredFields, ...optionalFields];

    // Check required fields
    for (const field of requiredFields) {
      if (!obj[field] || typeof obj[field] !== 'string' || obj[field].trim().length === 0) {
        return { isValid: false, error: `${field} is required and must be a non-empty string` };
      }
    }

    // Check field types
    for (const field of allFields) {
      if (obj[field] !== undefined && typeof obj[field] !== 'string') {
        return { isValid: false, error: `${field} must be a string` };
      }
    }

    return { isValid: true };
  },

  /**
   * Calculate similarity score between two scholarship objects
   */
  calculateSimilarity(obj1, obj2) {
    if (!obj1 || !obj2) return 0;

    let score = 0;
    let factors = 0;

    // Title similarity (most important)
    if (obj1.title && obj2.title) {
      const titleSim = this.stringSimilarity(obj1.title.toLowerCase(), obj2.title.toLowerCase());
      score += titleSim * 0.4;
      factors += 0.4;
    }

    // Organization similarity
    if (obj1.organization && obj2.organization) {
      const orgSim = this.stringSimilarity(obj1.organization.toLowerCase(), obj2.organization.toLowerCase());
      score += orgSim * 0.3;
      factors += 0.3;
    }

    // Amount similarity
    if (obj1.amount && obj2.amount) {
      const amount1 = this.extractAmount(obj1.amount);
      const amount2 = this.extractAmount(obj2.amount);
      if (amount1 && amount2) {
        const amountSim = Math.abs(amount1 - amount2) < (Math.max(amount1, amount2) * 0.1) ? 1 : 0;
        score += amountSim * 0.2;
        factors += 0.2;
      }
    }

    // Deadline similarity
    if (obj1.deadline && obj2.deadline) {
      const deadlineSim = obj1.deadline === obj2.deadline ? 1 : 0;
      score += deadlineSim * 0.1;
      factors += 0.1;
    }

    return factors > 0 ? score / factors : 0;
  },

  /**
   * Calculate string similarity using Jaccard index
   */
  stringSimilarity(str1, str2) {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  },

  /**
   * Extract numeric amount from string
   */
  extractAmount(amountStr) {
    const match = amountStr.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : null;
  },

  /**
   * Generate sample scholarship data for testing
   */
  generateSampleData() {
    return [
      {
        title: "Gates Millennium Scholarship",
        organization: "Bill & Melinda Gates Foundation",
        amount: "$50,000",
        deadline: "2024-01-15",
        description: "Full scholarship for outstanding minority students",
        eligibility: "Minority students with high academic achievement",
        link: "https://www.gatesfoundation.org/scholarships"
      },
      {
        title: "Gates Millennium Scholars Program",
        organization: "Gates Foundation",
        amount: "$50000",
        deadline: "2024-01-15",
        description: "Comprehensive scholarship program for minority students pursuing higher education",
        eligibility: "Outstanding minority students",
        link: "https://scholarships.com/gates-millennium"
      },
      {
        title: "National Merit Scholarship",
        organization: "National Merit Scholarship Corporation",
        amount: "$2,500",
        deadline: "2024-02-01",
        description: "Merit-based scholarship for high-achieving students",
        eligibility: "High PSAT/NMSQT scores",
        link: "https://www.nationalmerit.org"
      },
      {
        title: "Coca-Cola Scholars Program",
        organization: "The Coca-Cola Foundation",
        amount: "$20,000",
        deadline: "2024-10-31",
        description: "Leadership scholarship for high school seniors",
        eligibility: "High school seniors with leadership experience",
        link: "https://www.coca-colascholarsfoundation.org"
      },
      {
        title: "Coca Cola Scholarship",
        organization: "Coca-Cola Foundation",
        amount: "$20000",
        deadline: "2024-10-31",
        description: "Annual scholarship program for student leaders",
        eligibility: "High school seniors demonstrating leadership",
        link: "https://scholarships.com/coca-cola"
      }
    ];
  }
};

export default deduplicationService;
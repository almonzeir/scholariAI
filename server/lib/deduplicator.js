import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * System prompt for scholarship deduplication
 */
const DEDUPLICATION_SYSTEM_PROMPT = `
You are a scholarship deduplication system. Given an array of scholarship items (same program across multiple pages), return a deduplicated array. Keep the item with the most complete info and official link if available. Output array JSON only.

Rules for deduplication:
1. Identify items that represent the same scholarship program
2. Compare based on: title similarity, organization, deadline, amount, requirements
3. Keep the item with:
   - Most complete information (more fields filled)
   - Official/authoritative source URL if available
   - More detailed description
   - More specific eligibility criteria
4. Merge complementary information when possible
5. Remove exact duplicates
6. Return only the JSON array, no explanations

Output format: JSON array of deduplicated scholarship objects
`;

/**
 * Rule-based deduplication fallback
 */
class RuleBasedDeduplicator {
  /**
   * Calculate similarity score between two scholarships
   */
  calculateSimilarity(item1, item2) {
    let score = 0;
    let factors = 0;

    // Title similarity (most important)
    if (item1.title && item2.title) {
      const titleSim = this.stringSimilarity(item1.title.toLowerCase(), item2.title.toLowerCase());
      score += titleSim * 0.4;
      factors += 0.4;
    }

    // Organization similarity
    if (item1.organization && item2.organization) {
      const orgSim = this.stringSimilarity(item1.organization.toLowerCase(), item2.organization.toLowerCase());
      score += orgSim * 0.3;
      factors += 0.3;
    }

    // Amount similarity
    if (item1.amount && item2.amount) {
      const amount1 = this.extractAmount(item1.amount);
      const amount2 = this.extractAmount(item2.amount);
      if (amount1 && amount2) {
        const amountSim = Math.abs(amount1 - amount2) < (Math.max(amount1, amount2) * 0.1) ? 1 : 0;
        score += amountSim * 0.2;
        factors += 0.2;
      }
    }

    // Deadline similarity
    if (item1.deadline && item2.deadline) {
      const deadlineSim = item1.deadline === item2.deadline ? 1 : 0;
      score += deadlineSim * 0.1;
      factors += 0.1;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate string similarity using Jaccard index
   */
  stringSimilarity(str1, str2) {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Extract numeric amount from string
   */
  extractAmount(amountStr) {
    const match = amountStr.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : null;
  }

  /**
   * Calculate completeness score for an item
   */
  calculateCompleteness(item) {
    const fields = ['title', 'organization', 'amount', 'deadline', 'description', 'eligibility', 'requirements', 'link'];
    const filledFields = fields.filter(field => item[field] && item[field].toString().trim().length > 0);
    return filledFields.length / fields.length;
  }

  /**
   * Check if URL is official/authoritative
   */
  isOfficialSource(url) {
    if (!url) return false;
    
    const officialDomains = [
      '.edu', '.gov', '.org',
      'scholarship.com', 'fastweb.com', 'scholarships.com',
      'collegeboard.org', 'petersons.com'
    ];
    
    return officialDomains.some(domain => url.toLowerCase().includes(domain));
  }

  /**
   * Merge two similar scholarship items
   */
  mergeItems(item1, item2) {
    const merged = { ...item1 };
    
    // Merge fields, preferring more complete information
    Object.keys(item2).forEach(key => {
      if (!merged[key] || (item2[key] && item2[key].toString().length > merged[key].toString().length)) {
        merged[key] = item2[key];
      }
    });

    // Prefer official links
    if (this.isOfficialSource(item2.link) && !this.isOfficialSource(item1.link)) {
      merged.link = item2.link;
    }

    return merged;
  }

  /**
   * Deduplicate array using rule-based approach
   */
  deduplicate(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const deduplicated = [];
    const processed = new Set();

    for (let i = 0; i < items.length; i++) {
      if (processed.has(i)) continue;

      let bestItem = items[i];
      const duplicates = [i];

      // Find similar items
      for (let j = i + 1; j < items.length; j++) {
        if (processed.has(j)) continue;

        const similarity = this.calculateSimilarity(items[i], items[j]);
        if (similarity > 0.7) { // 70% similarity threshold
          duplicates.push(j);
          
          // Choose the better item
          const completeness1 = this.calculateCompleteness(bestItem);
          const completeness2 = this.calculateCompleteness(items[j]);
          const isOfficial1 = this.isOfficialSource(bestItem.link);
          const isOfficial2 = this.isOfficialSource(items[j].link);

          if (isOfficial2 && !isOfficial1) {
            bestItem = this.mergeItems(bestItem, items[j]);
          } else if (completeness2 > completeness1) {
            bestItem = this.mergeItems(bestItem, items[j]);
          } else {
            bestItem = this.mergeItems(items[j], bestItem);
          }
        }
      }

      // Mark all duplicates as processed
      duplicates.forEach(idx => processed.add(idx));
      deduplicated.push(bestItem);
    }

    return deduplicated;
  }
}

/**
 * AI-powered deduplication using Gemini
 */
export async function deduplicateWithAI(items) {
  try {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const prompt = `${DEDUPLICATION_SYSTEM_PROMPT}\n\nITEMS:\n${JSON.stringify(items, null, 2)}`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const deduplicatedItems = JSON.parse(jsonMatch[0]);
      return Array.isArray(deduplicatedItems) ? deduplicatedItems : [];
    }

    throw new Error('No valid JSON array found in AI response');
  } catch (error) {
    console.error('AI deduplication failed:', error);
    throw error;
  }
}

/**
 * Rule-based deduplication fallback
 */
export function deduplicateWithRules(items) {
  try {
    const deduplicator = new RuleBasedDeduplicator();
    return deduplicator.deduplicate(items);
  } catch (error) {
    console.error('Rule-based deduplication failed:', error);
    throw error;
  }
}

/**
 * Hybrid deduplication (AI with rule-based fallback)
 */
export async function deduplicateScholarships(items, method = 'hybrid') {
  try {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array');
    }

    if (items.length === 0) {
      return {
        success: true,
        deduplicated: [],
        originalCount: 0,
        deduplicatedCount: 0,
        duplicatesRemoved: 0,
        method: method,
        metadata: {
          processingTime: 0,
          confidence: 1.0
        }
      };
    }

    const startTime = Date.now();
    let deduplicatedItems = [];
    let usedMethod = method;

    if (method === 'ai' || method === 'hybrid') {
      try {
        deduplicatedItems = await deduplicateWithAI(items);
        usedMethod = 'ai';
      } catch (error) {
        if (method === 'hybrid') {
          console.warn('AI deduplication failed, falling back to rules:', error.message);
          deduplicatedItems = deduplicateWithRules(items);
          usedMethod = 'rules';
        } else {
          throw error;
        }
      }
    } else if (method === 'rules') {
      deduplicatedItems = deduplicateWithRules(items);
      usedMethod = 'rules';
    } else {
      throw new Error('Invalid method. Use "ai", "rules", or "hybrid"');
    }

    const processingTime = Date.now() - startTime;
    const originalCount = items.length;
    const deduplicatedCount = deduplicatedItems.length;
    const duplicatesRemoved = originalCount - deduplicatedCount;

    return {
      success: true,
      deduplicated: deduplicatedItems,
      originalCount,
      deduplicatedCount,
      duplicatesRemoved,
      method: usedMethod,
      metadata: {
        processingTime,
        confidence: usedMethod === 'ai' ? 0.9 : 0.7,
        deduplicationRate: originalCount > 0 ? (duplicatesRemoved / originalCount) : 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      deduplicated: [],
      originalCount: Array.isArray(items) ? items.length : 0,
      deduplicatedCount: 0,
      duplicatesRemoved: 0,
      method: method,
      metadata: {
        processingTime: 0,
        confidence: 0
      }
    };
  }
}

/**
 * Validate deduplication result
 */
export function validateDeduplication(original, deduplicated) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    statistics: {
      originalCount: Array.isArray(original) ? original.length : 0,
      deduplicatedCount: Array.isArray(deduplicated) ? deduplicated.length : 0,
      reductionRate: 0
    }
  };

  try {
    if (!Array.isArray(original)) {
      validation.errors.push('Original items must be an array');
      validation.isValid = false;
    }

    if (!Array.isArray(deduplicated)) {
      validation.errors.push('Deduplicated items must be an array');
      validation.isValid = false;
    }

    if (validation.isValid) {
      const originalCount = original.length;
      const deduplicatedCount = deduplicated.length;
      
      validation.statistics.reductionRate = originalCount > 0 ? 
        ((originalCount - deduplicatedCount) / originalCount) : 0;

      if (deduplicatedCount > originalCount) {
        validation.errors.push('Deduplicated count cannot exceed original count');
        validation.isValid = false;
      }

      if (deduplicatedCount === 0 && originalCount > 0) {
        validation.warnings.push('All items were removed during deduplication');
      }

      if (deduplicatedCount === originalCount) {
        validation.warnings.push('No duplicates were found');
      }
    }
  } catch (error) {
    validation.errors.push(`Validation error: ${error.message}`);
    validation.isValid = false;
  }

  return validation;
}

export default {
  deduplicateScholarships,
  deduplicateWithAI,
  deduplicateWithRules,
  validateDeduplication
};
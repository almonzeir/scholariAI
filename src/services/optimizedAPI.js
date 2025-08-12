/**
 * 🚀 Optimized ScholarSeeker API Service
 * 
 * This service implements the Phase 3.1 optimization strategy:
 * - Vector search for candidate filtering
 * - Gemini refinement for final ranking
 * - Intelligent caching for performance
 * - Reduced token usage and faster responses
 */

import { supabase } from './supabase.js';
import geminiService from './geminiService.js';

// Mock services for now - will be implemented in Phase 3.1B
class MockVectorSearchService {
  static async findCandidateScholarships(profile, limit = 100) {
    // Simulate vector search with basic filtering
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('is_active', true)
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }
  
  static profileToSearchText(profile) {
    const searchParts = [
      profile.fieldOfStudy || '',
      profile.degree || '',
      profile.country || '',
      profile.targetCountry || '',
      (profile.skills || []).join(' '),
      (profile.interests || []).join(' '),
      profile.careerGoals || ''
    ].filter(Boolean);
    
    return searchParts.join(' ');
  }
}

class MockCacheService {
  static generateProfileHash(profile) {
    // Simple hash function for profile caching
    const relevantFields = {
      degree: profile.degree,
      field: profile.fieldOfStudy,
      country: profile.country,
      gpa: profile.gpa ? Math.floor(profile.gpa * 10) / 10 : null,
      graduationYear: profile.graduationYear,
      targetCountries: profile.targetCountries?.sort()
    };
    
    const str = JSON.stringify(relevantFields);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  static async getCachedResults(profileHash) {
    // Mock cache check - will implement with Redis/Supabase
    const cacheKey = `scholarship_results_${profileHash}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const data = JSON.parse(cached);
      if (data.expiresAt > Date.now()) {
        return data.results;
      }
      localStorage.removeItem(cacheKey);
    }
    
    return null;
  }
  
  static async cacheResults(profileHash, profileData, results, ttlHours = 24) {
    // Mock cache storage
    const cacheKey = `scholarship_results_${profileHash}`;
    const expiresAt = Date.now() + (ttlHours * 60 * 60 * 1000);
    
    localStorage.setItem(cacheKey, JSON.stringify({
      results,
      expiresAt,
      profileData
    }));
    
    return true;
  }
}

class EnhancedGeminiService {
  /**
   * Refine scholarship candidates using optimized Gemini prompts
   */
  static async refineScholarshipMatches(profile, candidates, limit = 25) {
    try {
      if (candidates.length === 0) {
        return {
          matches: [],
          total_analyzed: 0,
          processing_notes: 'No candidates to analyze'
        };
      }
      
      // Use existing geminiService with optimized prompt
      const prompt = this.buildRefinementPrompt(profile, candidates, limit);
      const response = await geminiService.generateContent(prompt);
      
      // Parse the response
      let parsedResponse;
      try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[1]);
        } else {
          parsedResponse = JSON.parse(response);
        }
      } catch (parseError) {
        console.warn('Failed to parse Gemini response, using fallback:', parseError);
        return this.fallbackRanking(profile, candidates, limit);
      }
      
      return parsedResponse;
      
    } catch (error) {
      console.error('Gemini refinement failed:', error);
      return this.fallbackRanking(profile, candidates, limit);
    }
  }
  
  /**
   * Build optimized prompt for scholarship refinement
   */
  static buildRefinementPrompt(profile, candidates, limit) {
    // Limit candidates to prevent token overflow
    const limitedCandidates = candidates.slice(0, 50);
    
    return `You are an expert scholarship advisor. Analyze the student profile and rank the most suitable scholarships.

STUDENT PROFILE:
- Field of Study: ${profile.fieldOfStudy || 'Not specified'}
- Degree Level: ${profile.degree || 'Not specified'}
- Country: ${profile.country || 'Not specified'}
- Target Country: ${profile.targetCountry || 'Not specified'}
- GPA: ${profile.gpa || 'Not specified'}
- Graduation Year: ${profile.graduationYear || 'Not specified'}
- Skills: ${(profile.skills || []).join(', ') || 'Not specified'}
- Career Goals: ${profile.careerGoals || 'Not specified'}

SCHOLARSHIP CANDIDATES (${limitedCandidates.length} total):
${JSON.stringify(limitedCandidates.map(s => ({
  id: s.id,
  name: s.name,
  provider: s.provider,
  description: s.description?.substring(0, 200) + '...',
  eligibility: s.eligibility,
  financial: s.financial,
  deadlines: s.deadlines,
  tags: s.tags
})), null, 2)}

TASK:
1. Evaluate each scholarship against the student's profile
2. Consider: academic fit, eligibility requirements, field alignment, geographic match, deadline feasibility
3. Rank by compatibility score (0-100)
4. Return the TOP ${limit} matches in JSON format
5. Include specific reasons for each match

RETURN EXACTLY THIS JSON STRUCTURE:
\`\`\`json
{
  "matches": [
    {
      "scholarship_id": "uuid",
      "name": "scholarship name",
      "provider": "organization",
      "match_score": 95,
      "match_reasons": ["Strong field alignment", "Geographic eligibility"],
      "eligibility_status": "eligible",
      "deadline": "2024-03-15",
      "amount": 50000,
      "currency": "USD",
      "application_url": "https://...",
      "key_requirements": ["CV", "Statement of Purpose"]
    }
  ],
  "total_analyzed": ${limitedCandidates.length},
  "processing_notes": "Analysis summary"
}
\`\`\`

Focus on quality over quantity. Only include scholarships the student is likely eligible for.`;
  }
  
  /**
   * Fallback ranking when Gemini fails
   */
  static fallbackRanking(profile, candidates, limit) {
    const scored = candidates.map(scholarship => {
      let score = 0;
      const reasons = [];
      
      // Field alignment (30 points)
      if (scholarship.eligibility?.fields?.includes(profile.fieldOfStudy)) {
        score += 30;
        reasons.push('Field alignment');
      }
      
      // Degree level match (25 points)
      if (scholarship.eligibility?.degrees?.includes(profile.degree)) {
        score += 25;
        reasons.push('Degree level match');
      }
      
      // Country eligibility (20 points)
      if (scholarship.eligibility?.countries?.includes(profile.country)) {
        score += 20;
        reasons.push('Country eligibility');
      }
      
      // GPA requirement (15 points)
      if (!scholarship.eligibility?.gpa_min || profile.gpa >= scholarship.eligibility.gpa_min) {
        score += 15;
        reasons.push('GPA requirement met');
      }
      
      // Deadline check (10 points)
      const deadline = new Date(scholarship.deadlines?.application);
      if (deadline > new Date()) {
        score += 10;
        reasons.push('Application deadline open');
      }
      
      return {
        scholarship_id: scholarship.id,
        name: scholarship.name,
        provider: scholarship.provider,
        match_score: score,
        match_reasons: reasons,
        eligibility_status: score > 50 ? 'eligible' : 'conditional',
        deadline: scholarship.deadlines?.application,
        amount: scholarship.financial?.amount,
        currency: scholarship.financial?.currency || 'USD',
        application_url: scholarship.source_url,
        key_requirements: scholarship.application?.requirements || []
      };
    });
    
    return {
      matches: scored
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, limit),
      total_analyzed: candidates.length,
      processing_notes: 'Fallback ranking used due to AI service unavailability'
    };
  }
}

/**
 * Main Optimized API Class
 */
export class OptimizedScholarSeekerAPI {
  /**
   * Find scholarships with optimized pipeline
   * Phase 3.1 Implementation: Vector Search + Gemini Refinement + Caching
   */
  static async findScholarshipsOptimized(profile, filters = {}) {
    try {
      const startTime = Date.now();
      
      // Step 1: Generate profile hash for caching
      const profileHash = MockCacheService.generateProfileHash(profile);
      
      // Step 2: Check cache first
      const cachedResults = await MockCacheService.getCachedResults(profileHash);
      if (cachedResults) {
        return {
          ...cachedResults,
          cached: true,
          processingTime: Date.now() - startTime
        };
      }
      
      // Step 3: Vector search for candidates (mock implementation)
      console.log('🔍 Searching for candidate scholarships...');
      const candidates = await MockVectorSearchService.findCandidateScholarships(
        profile, 
        100 // Get top 100 candidates
      );
      
      if (candidates.length === 0) {
        const result = {
          success: true,
          scholarships: [],
          totalFound: 0,
          totalAnalyzed: 0,
          processingTime: Date.now() - startTime,
          message: 'No scholarships found matching your profile',
          cached: false
        };
        
        // Cache empty results too
        await MockCacheService.cacheResults(profileHash, profile, result, 6); // 6 hour TTL for empty results
        return result;
      }
      
      // Step 4: Gemini refinement
      console.log(`🤖 Refining ${candidates.length} candidates with AI...`);
      const refinedResults = await EnhancedGeminiService.refineScholarshipMatches(
        profile,
        candidates,
        25 // Return top 25 matches
      );
      
      const result = {
        success: true,
        scholarships: refinedResults.matches || [],
        totalFound: refinedResults.matches?.length || 0,
        totalAnalyzed: refinedResults.total_analyzed || candidates.length,
        processingTime: Date.now() - startTime,
        processingNotes: refinedResults.processing_notes,
        cached: false,
        optimization: {
          vectorSearchCandidates: candidates.length,
          geminiRefinedResults: refinedResults.matches?.length || 0,
          cacheHit: false
        }
      };
      
      // Step 5: Cache the results
      await MockCacheService.cacheResults(profileHash, profile, result);
      
      return result;
      
    } catch (error) {
      console.error('Optimized scholarship search failed:', error);
      throw new Error(`Failed to find scholarships: ${error.message}`);
    }
  }
  
  /**
   * Get scholarship statistics
   */
  static async getScholarshipStats() {
    try {
      const { data, error } = await supabase
        .from('scholarships')
        .select('provider, financial, deadlines, tags, eligibility')
        .eq('is_active', true);
        
      if (error) throw error;
      
      const stats = {
        total: data.length,
        byProvider: {},
        byAmount: { under10k: 0, '10k-50k': 0, over50k: 0, unspecified: 0 },
        byDeadline: { thisMonth: 0, next3Months: 0, later: 0, noDeadline: 0 },
        topTags: {},
        byField: {},
        byCountry: {}
      };
      
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const next3Months = new Date(now.getFullYear(), now.getMonth() + 4, 0);
      
      data.forEach(scholarship => {
        // Provider stats
        stats.byProvider[scholarship.provider] = 
          (stats.byProvider[scholarship.provider] || 0) + 1;
          
        // Amount stats
        const amount = scholarship.financial?.amount || 0;
        if (amount === 0) stats.byAmount.unspecified++;
        else if (amount < 10000) stats.byAmount.under10k++;
        else if (amount <= 50000) stats.byAmount['10k-50k']++;
        else stats.byAmount.over50k++;
        
        // Deadline stats
        if (scholarship.deadlines?.application) {
          const deadline = new Date(scholarship.deadlines.application);
          if (deadline <= thisMonth) stats.byDeadline.thisMonth++;
          else if (deadline <= next3Months) stats.byDeadline.next3Months++;
          else stats.byDeadline.later++;
        } else {
          stats.byDeadline.noDeadline++;
        }
        
        // Tag stats
        scholarship.tags?.forEach(tag => {
          stats.topTags[tag] = (stats.topTags[tag] || 0) + 1;
        });
        
        // Field stats
        scholarship.eligibility?.fields?.forEach(field => {
          stats.byField[field] = (stats.byField[field] || 0) + 1;
        });
        
        // Country stats
        scholarship.eligibility?.countries?.forEach(country => {
          stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
        });
      });
      
      // Sort top tags
      stats.topTags = Object.entries(stats.topTags)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
      
      return stats;
    } catch (error) {
      console.error('Failed to get scholarship stats:', error);
      return null;
    }
  }
  
  /**
   * Clear expired cache entries
   */
  static async clearExpiredCache() {
    try {
      // Mock implementation - clear localStorage cache
      const keys = Object.keys(localStorage);
      const scholarshipKeys = keys.filter(key => key.startsWith('scholarship_results_'));
      
      let cleared = 0;
      scholarshipKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.expiresAt <= Date.now()) {
            localStorage.removeItem(key);
            cleared++;
          }
        } catch (e) {
          // Invalid data, remove it
          localStorage.removeItem(key);
          cleared++;
        }
      });
      
      console.log(`Cleared ${cleared} expired cache entries`);
      return cleared;
    } catch (error) {
      console.error('Cache cleanup failed:', error);
      return 0;
    }
  }
}

export default OptimizedScholarSeekerAPI;
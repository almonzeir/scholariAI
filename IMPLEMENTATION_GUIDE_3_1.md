# 🚀 Phase 3.1 Implementation Guide

## Quick Start Checklist

### Prerequisites
- [ ] Python 3.9+ installed
- [ ] Redis server running
- [ ] Supabase project with vector extension
- [ ] OpenAI API key for embeddings
- [ ] Updated environment variables

---

## 1. Environment Setup

### 📝 Updated .env Variables

```bash
# Add to existing .env file

# ===========================================
# 🕷️ SCRAPING SERVICE
# ===========================================
SCRAPER_SERVICE_URL=http://localhost:8000
SCRAPER_API_KEY=your_scraper_api_key_here
SCRAPE_SCHEDULE_ENABLED=true
SCRAPE_INTERVAL_HOURS=24

# ===========================================
# 🔍 VECTOR SEARCH
# ===========================================
OPENAI_API_KEY=your_openai_api_key_here
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
VECTOR_SEARCH_LIMIT=100

# ===========================================
# 📦 CACHING
# ===========================================
REDIS_URL=redis://localhost:6379
CACHE_TTL_HOURS=24
CACHE_ENABLED=true

# ===========================================
# 🤖 GEMINI OPTIMIZATION
# ===========================================
GEMINI_MAX_CANDIDATES=100
GEMINI_RESULT_LIMIT=25
GEMINI_FUNCTION_CALLING=true
```

---

## 2. Database Schema Updates

### 🗄️ Supabase Tables

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Scholarships table with vector embeddings
CREATE TABLE scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  eligibility JSONB,
  financial JSONB,
  deadlines JSONB,
  application JSONB,
  tags TEXT[],
  embedding vector(1536), -- OpenAI embedding dimensions
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_url TEXT,
  quality_score FLOAT DEFAULT 0.0,
  is_active BOOLEAN DEFAULT true
);

-- Create vector similarity search index
CREATE INDEX ON scholarships USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create indexes for filtering
CREATE INDEX idx_scholarships_tags ON scholarships USING GIN(tags);
CREATE INDEX idx_scholarships_deadlines ON scholarships USING GIN(deadlines);
CREATE INDEX idx_scholarships_active ON scholarships(is_active) WHERE is_active = true;

-- Profile cache table
CREATE TABLE profile_cache (
  profile_hash TEXT PRIMARY KEY,
  profile_data JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER DEFAULT 0
);

-- Create TTL index for automatic cleanup
CREATE INDEX idx_profile_cache_expires ON profile_cache(expires_at);

-- Scraping logs table
CREATE TABLE scraping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  items_scraped INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER
);
```

---

## 3. New Service Files

### 🔍 Vector Search Service

```javascript
// src/services/vectorSearch.js
import OpenAI from 'openai';
import { supabase } from './supabase.js';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development
});

export class VectorSearchService {
  /**
   * Generate embedding for profile text
   */
  static async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error('Failed to generate profile embedding');
    }
  }

  /**
   * Convert profile to searchable text
   */
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

  /**
   * Search for similar scholarships using vector similarity
   */
  static async searchSimilarScholarships(profileEmbedding, limit = 100) {
    try {
      const { data, error } = await supabase.rpc('search_scholarships', {
        query_embedding: profileEmbedding,
        match_threshold: 0.7,
        match_count: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Vector search failed:', error);
      throw new Error('Failed to search scholarships');
    }
  }

  /**
   * Full pipeline: profile -> embedding -> search
   */
  static async findCandidateScholarships(profile, limit = 100) {
    const searchText = this.profileToSearchText(profile);
    const embedding = await this.generateEmbedding(searchText);
    return await this.searchSimilarScholarships(embedding, limit);
  }
}

export default VectorSearchService;
```

### 📦 Cache Service

```javascript
// src/services/cacheService.js
import { supabase } from './supabase.js';

export class CacheService {
  /**
   * Generate cache key from profile
   */
  static generateProfileHash(profile) {
    const relevantFields = {
      degree: profile.degree,
      field: profile.fieldOfStudy,
      country: profile.country,
      gpa: profile.gpa ? Math.floor(profile.gpa * 10) / 10 : null,
      graduationYear: profile.graduationYear,
      targetCountries: profile.targetCountries?.sort()
    };
    
    // Simple hash function (in production, use crypto.subtle)
    const str = JSON.stringify(relevantFields);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get cached results for profile
   */
  static async getCachedResults(profileHash) {
    try {
      const { data, error } = await supabase
        .from('profile_cache')
        .select('results, created_at')
        .eq('profile_hash', profileHash)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      // Update hit count
      await supabase
        .from('profile_cache')
        .update({ hit_count: supabase.raw('hit_count + 1') })
        .eq('profile_hash', profileHash);

      return data.results;
    } catch (error) {
      console.error('Cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Store results in cache
   */
  static async cacheResults(profileHash, profileData, results, ttlHours = 24) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + ttlHours);

      const { error } = await supabase
        .from('profile_cache')
        .upsert({
          profile_hash: profileHash,
          profile_data: profileData,
          results: results,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Cache storage failed:', error);
      return false;
    }
  }

  /**
   * Clear expired cache entries
   */
  static async clearExpiredCache() {
    try {
      const { error } = await supabase
        .from('profile_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Cache cleanup failed:', error);
      return false;
    }
  }
}

export default CacheService;
```

### 🤖 Enhanced Gemini Service

```javascript
// src/services/enhancedGeminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export class EnhancedGeminiService {
  /**
   * Refine scholarship candidates using Gemini with function calling
   */
  static async refineScholarshipMatches(profile, candidates, limit = 25) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent results
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 4096
        }
      });

      const prompt = this.buildRefinementPrompt(profile, candidates, limit);
      const result = await model.generateContent(prompt);
      
      const response = result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Fallback: try to parse the entire response as JSON
      return JSON.parse(text);
      
    } catch (error) {
      console.error('Gemini refinement failed:', error);
      
      // Fallback: return top candidates with basic scoring
      return this.fallbackRanking(profile, candidates, limit);
    }
  }

  /**
   * Build optimized prompt for scholarship refinement
   */
  static buildRefinementPrompt(profile, candidates, limit) {
    return `You are an expert scholarship advisor. Analyze the student profile and rank the most suitable scholarships.

STUDENT PROFILE:
${JSON.stringify(profile, null, 2)}

SCHOLARSHIP CANDIDATES (${candidates.length} total):
${JSON.stringify(candidates.slice(0, 50), null, 2)} // Limit to prevent token overflow

TASK:
1. Evaluate each scholarship against the student's profile
2. Consider: academic fit, eligibility requirements, field alignment, geographic match
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
  "total_analyzed": ${candidates.length},
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
      
      // Field alignment
      if (scholarship.eligibility?.fields?.includes(profile.fieldOfStudy)) {
        score += 30;
      }
      
      // Degree level match
      if (scholarship.eligibility?.degrees?.includes(profile.degree)) {
        score += 25;
      }
      
      // Country eligibility
      if (scholarship.eligibility?.countries?.includes(profile.country)) {
        score += 20;
      }
      
      // GPA requirement
      if (!scholarship.eligibility?.gpa_min || profile.gpa >= scholarship.eligibility.gpa_min) {
        score += 15;
      }
      
      // Deadline check (future deadlines get higher scores)
      const deadline = new Date(scholarship.deadlines?.application);
      if (deadline > new Date()) {
        score += 10;
      }
      
      return {
        ...scholarship,
        match_score: score,
        match_reasons: ['Automated matching'],
        eligibility_status: score > 50 ? 'eligible' : 'conditional'
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

export default EnhancedGeminiService;
```

---

## 4. Updated Main API Service

```javascript
// src/services/optimizedAPI.js
import { VectorSearchService } from './vectorSearch.js';
import { CacheService } from './cacheService.js';
import { EnhancedGeminiService } from './enhancedGeminiService.js';
import { supabase } from './supabase.js';

export class OptimizedScholarSeekerAPI {
  /**
   * Find scholarships with optimized pipeline
   */
  static async findScholarshipsOptimized(profile, filters = {}) {
    try {
      // Generate profile hash for caching
      const profileHash = CacheService.generateProfileHash(profile);
      
      // Check cache first
      const cachedResults = await CacheService.getCachedResults(profileHash);
      if (cachedResults) {
        return {
          ...cachedResults,
          cached: true,
          processingTime: 0
        };
      }
      
      const startTime = Date.now();
      
      // Step 1: Vector search for candidates
      console.log('🔍 Searching for candidate scholarships...');
      const candidates = await VectorSearchService.findCandidateScholarships(
        profile, 
        100 // Get top 100 candidates
      );
      
      if (candidates.length === 0) {
        return {
          success: true,
          scholarships: [],
          totalFound: 0,
          processingTime: Date.now() - startTime,
          message: 'No scholarships found matching your profile'
        };
      }
      
      // Step 2: Gemini refinement
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
        cached: false
      };
      
      // Cache the results
      await CacheService.cacheResults(profileHash, profile, result);
      
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
        .select('provider, financial, deadlines, tags')
        .eq('is_active', true);
        
      if (error) throw error;
      
      const stats = {
        total: data.length,
        byProvider: {},
        byAmount: { under10k: 0, '10k-50k': 0, over50k: 0 },
        byDeadline: { thisMonth: 0, next3Months: 0, later: 0 },
        topTags: {}
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
        if (amount < 10000) stats.byAmount.under10k++;
        else if (amount <= 50000) stats.byAmount['10k-50k']++;
        else stats.byAmount.over50k++;
        
        // Deadline stats
        const deadline = new Date(scholarship.deadlines?.application);
        if (deadline <= thisMonth) stats.byDeadline.thisMonth++;
        else if (deadline <= next3Months) stats.byDeadline.next3Months++;
        else stats.byDeadline.later++;
        
        // Tag stats
        scholarship.tags?.forEach(tag => {
          stats.topTags[tag] = (stats.topTags[tag] || 0) + 1;
        });
      });
      
      return stats;
    } catch (error) {
      console.error('Failed to get scholarship stats:', error);
      return null;
    }
  }
}

export default OptimizedScholarSeekerAPI;
```

---

## 5. Required SQL Functions

```sql
-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_scholarships(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  name text,
  provider text,
  description text,
  eligibility jsonb,
  financial jsonb,
  deadlines jsonb,
  application jsonb,
  tags text[],
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    s.id,
    s.name,
    s.provider,
    s.description,
    s.eligibility,
    s.financial,
    s.deadlines,
    s.application,
    s.tags,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM scholarships s
  WHERE 
    s.is_active = true
    AND s.embedding IS NOT NULL
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 6. Installation Commands

```bash
# Install new dependencies
npm install openai redis

# Install Python scraper dependencies (separate service)
pip install scrapy selenium beautifulsoup4 requests schedule psycopg2 redis openai

# Start Redis (if not running)
# Windows: Download and run Redis
# macOS: brew install redis && brew services start redis
# Linux: sudo apt install redis-server && sudo systemctl start redis
```

---

## 7. Testing the Implementation

### 🧪 Test Vector Search

```javascript
// Test in browser console
import { VectorSearchService } from './services/vectorSearch.js';

const testProfile = {
  fieldOfStudy: 'Computer Science',
  degree: 'Master',
  country: 'India',
  targetCountry: 'Germany'
};

const candidates = await VectorSearchService.findCandidateScholarships(testProfile);
console.log(`Found ${candidates.length} candidates`);
```

### 🧪 Test Cache Service

```javascript
import { CacheService } from './services/cacheService.js';

const hash = CacheService.generateProfileHash(testProfile);
console.log('Profile hash:', hash);

const cached = await CacheService.getCachedResults(hash);
console.log('Cached results:', cached);
```

---

## 8. Monitoring & Debugging

### 📊 Performance Monitoring

```javascript
// Add to your API service
const performanceMetrics = {
  vectorSearchTime: 0,
  geminiProcessingTime: 0,
  cacheHitRate: 0,
  totalRequests: 0
};

// Track metrics in your API calls
const vectorStart = Date.now();
const candidates = await VectorSearchService.findCandidateScholarships(profile);
performanceMetrics.vectorSearchTime = Date.now() - vectorStart;
```

### 🐛 Debug Logging

```javascript
// Enable debug mode
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

function debugLog(message, data) {
  if (DEBUG) {
    console.log(`[ScholarSeeker Debug] ${message}`, data);
  }
}
```

---

## ✅ Implementation Checklist

### Phase 3.1A: Core Services
- [ ] Set up vector search service
- [ ] Implement cache service
- [ ] Update Gemini service with refinement
- [ ] Create optimized API service
- [ ] Add required SQL functions

### Phase 3.1B: Integration
- [ ] Update React hooks to use new API
- [ ] Add performance monitoring
- [ ] Implement error handling
- [ ] Add debug logging
- [ ] Test end-to-end pipeline

### Phase 3.1C: Optimization
- [ ] Fine-tune vector search parameters
- [ ] Optimize Gemini prompts
- [ ] Implement cache warming
- [ ] Add performance dashboards
- [ ] Load test the system

---

**Ready to implement Phase 3.1? This guide provides everything needed to build the optimized scholarship matching pipeline!**
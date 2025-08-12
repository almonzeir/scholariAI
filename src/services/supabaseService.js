/**
 * Supabase Service for Scholarship Database Management
 * Handles real scholarship data storage, retrieval, and search
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Using fallback mode.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export class SupabaseService {
  /**
   * Initialize the SupabaseService
   * @returns {Promise<boolean>} - Success status
   */
  static async initialize() {
    try {
      const result = await this.initializeDatabase();
      console.log('SupabaseService initialized successfully');
      return result;
    } catch (error) {
      console.error('Error initializing SupabaseService:', error);
      return false;
    }
  }

  /**
   * Initialize scholarship database with sample data
   */
  static async initializeDatabase() {
    if (!supabase) {
      console.warn('Supabase not configured. Skipping database initialization.');
      return false;
    }

    try {
      // Check if scholarships table exists and has data
      const { data: existingData, error } = await supabase
        .from('scholarships')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        // Table doesn't exist, create it
        await this.createScholarshipTable();
      }

      if (!existingData || existingData.length === 0) {
        // Insert sample scholarship data
        await this.insertSampleScholarships();
      }

      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      return false;
    }
  }

  /**
   * Create scholarships table
   */
  static async createScholarshipTable() {
    if (!supabase) {
      console.warn('Supabase not configured. Cannot create table.');
      return;
    }

    try {
      // Create the scholarships table using direct SQL
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.scholarships (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            provider VARCHAR(255),
            amount INTEGER,
            deadline DATE,
            description TEXT,
            eligibility TEXT,
            field_of_study VARCHAR(255),
            academic_level VARCHAR(255),
            location VARCHAR(255),
            application_url TEXT,
            requirements TEXT,
            tags TEXT,
            match_score INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create indexes for better query performance
          CREATE INDEX IF NOT EXISTS idx_scholarships_field_of_study ON public.scholarships(field_of_study);
          CREATE INDEX IF NOT EXISTS idx_scholarships_academic_level ON public.scholarships(academic_level);
          CREATE INDEX IF NOT EXISTS idx_scholarships_deadline ON public.scholarships(deadline);
          CREATE INDEX IF NOT EXISTS idx_scholarships_amount ON public.scholarships(amount);
        `
      });

      if (error) {
        console.error('Error creating scholarships table:', error);
        throw error;
      }
      
      console.log('Scholarships table created successfully');
    } catch (error) {
      console.error('Error in createScholarshipTable:', error);
      // If RPC doesn't work, fall back to direct table creation (this might not work without proper permissions)
      throw error;
    }
  }

  /**
   * Insert sample scholarship data
   */
  static async insertSampleScholarships() {
    const sampleScholarships = [
      {
        title: "Google Computer Science Scholarship",
        provider: "Google",
        amount: 10000,
        deadline: "2024-12-01",
        description: "Supporting underrepresented students in computer science and technology fields.",
        eligibility: "Undergraduate or graduate students in computer science, computer engineering, or related fields",
        field_of_study: "Computer Science",
        academic_level: "Undergraduate,Graduate",
        location: "United States",
        application_url: "https://buildyourfuture.withgoogle.com/scholarships",
        requirements: "Minimum 3.5 GPA, demonstrated leadership, financial need",
        tags: "technology,diversity,computer-science,google",
        match_score: 95
      },
      {
        title: "Microsoft Diversity in Technology Scholarship",
        provider: "Microsoft",
        amount: 5000,
        deadline: "2024-11-15",
        description: "Empowering students from underrepresented communities in technology.",
        eligibility: "Students from underrepresented communities pursuing technology degrees",
        field_of_study: "Technology",
        academic_level: "Undergraduate,Graduate",
        location: "Global",
        application_url: "https://careers.microsoft.com/students/us/en/usscholarshipprogram",
        requirements: "Demonstrated academic excellence, leadership potential",
        tags: "technology,diversity,microsoft,global",
        match_score: 90
      },
      {
        title: "Amazon Future Engineer Scholarship",
        provider: "Amazon",
        amount: 40000,
        deadline: "2024-10-30",
        description: "Four-year scholarship for students pursuing computer science degrees.",
        eligibility: "High school seniors planning to study computer science",
        field_of_study: "Computer Science",
        academic_level: "Undergraduate",
        location: "United States",
        application_url: "https://www.amazonfutureengineer.com/scholarships",
        requirements: "High school senior, plan to study CS, demonstrate need",
        tags: "computer-science,amazon,undergraduate,high-value",
        match_score: 88
      },
      {
        title: "Adobe Digital Academy Scholarship",
        provider: "Adobe",
        amount: 25000,
        deadline: "2024-09-15",
        description: "Supporting students in digital media and creative technology programs.",
        eligibility: "Students in digital media, design, or creative technology programs",
        field_of_study: "Digital Media",
        academic_level: "Undergraduate,Graduate",
        location: "United States",
        application_url: "https://www.adobe.com/corporate-responsibility/education/digital-academy.html",
        requirements: "Portfolio submission, academic excellence, creative potential",
        tags: "digital-media,creative,adobe,portfolio",
        match_score: 85
      },
      {
        title: "IBM AI Ethics Global Scholarship",
        provider: "IBM",
        amount: 15000,
        deadline: "2024-08-20",
        description: "Advancing ethical AI research and development through education.",
        eligibility: "Graduate students researching AI ethics and responsible technology",
        field_of_study: "Artificial Intelligence",
        academic_level: "Graduate",
        location: "Global",
        application_url: "https://www.ibm.com/academic/scholarships",
        requirements: "Research proposal, academic excellence, ethics focus",
        tags: "ai,ethics,research,ibm,graduate",
        match_score: 82
      },
      {
        title: "Salesforce Technology Innovation Scholarship",
        provider: "Salesforce",
        amount: 20000,
        deadline: "2024-07-10",
        description: "Supporting innovation in cloud computing and enterprise technology.",
        eligibility: "Students in computer science, information systems, or related fields",
        field_of_study: "Information Systems",
        academic_level: "Undergraduate,Graduate",
        location: "United States,Canada",
        application_url: "https://trailhead.salesforce.com/en/careers/university-recruiting",
        requirements: "Technical project portfolio, leadership experience",
        tags: "cloud-computing,enterprise,salesforce,innovation",
        match_score: 80
      },
      {
        title: "Tesla STEM Education Scholarship",
        provider: "Tesla",
        amount: 30000,
        deadline: "2024-06-30",
        description: "Advancing sustainable technology through STEM education support.",
        eligibility: "Students in engineering, physics, or sustainable technology programs",
        field_of_study: "Engineering",
        academic_level: "Undergraduate,Graduate",
        location: "United States",
        application_url: "https://www.tesla.com/careers/students",
        requirements: "STEM focus, sustainability interest, academic merit",
        tags: "engineering,sustainability,tesla,stem",
        match_score: 78
      },
      {
        title: "Netflix Creative Technology Scholarship",
        provider: "Netflix",
        amount: 12000,
        deadline: "2024-05-15",
        description: "Supporting students at the intersection of technology and entertainment.",
        eligibility: "Students in computer graphics, media technology, or entertainment tech",
        field_of_study: "Media Technology",
        academic_level: "Undergraduate,Graduate",
        location: "United States",
        application_url: "https://jobs.netflix.com/students",
        requirements: "Creative portfolio, technical skills, entertainment industry interest",
        tags: "entertainment,media-tech,netflix,creative",
        match_score: 75
      },
      {
        title: "Spotify Audio Technology Scholarship",
        provider: "Spotify",
        amount: 18000,
        deadline: "2024-04-20",
        description: "Advancing audio technology and music streaming innovation.",
        eligibility: "Students in audio engineering, computer science, or music technology",
        field_of_study: "Audio Engineering",
        academic_level: "Undergraduate,Graduate",
        location: "Global",
        application_url: "https://www.spotifyforartists.com/education",
        requirements: "Audio technology project, technical proficiency",
        tags: "audio,music-tech,spotify,innovation",
        match_score: 72
      },
      {
        title: "Uber Mobility Innovation Scholarship",
        provider: "Uber",
        amount: 22000,
        deadline: "2024-03-10",
        description: "Supporting students working on transportation and mobility solutions.",
        eligibility: "Students in transportation engineering, urban planning, or related fields",
        field_of_study: "Transportation Engineering",
        academic_level: "Graduate",
        location: "United States,Europe",
        application_url: "https://www.uber.com/careers/students",
        requirements: "Research in mobility, urban planning focus, innovation potential",
        tags: "transportation,mobility,uber,urban-planning",
        match_score: 70
      }
    ];

    const { error } = await supabase
      .from('scholarships')
      .insert(sampleScholarships);

    if (error) {
      console.error('Error inserting sample scholarships:', error);
      throw error;
    }

    console.log('Sample scholarships inserted successfully');
  }

  /**
   * Search scholarships based on filters
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} - Matching scholarships
   */
  static async searchScholarships(filters = {}) {
    if (!supabase) {
      return [];
    }

    let query = supabase.from('scholarships').select('*');

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,provider.ilike.%${filters.search}%`);
    }

    if (filters.fieldOfStudy) {
      query = query.eq('field_of_study', filters.fieldOfStudy);
    }

    if (filters.academicLevel) {
      query = query.eq('academic_level', filters.academicLevel);
    }

    if (filters.minAmount) {
      query = query.gte('amount', filters.minAmount);
    }

    if (filters.maxAmount) {
      query = query.lte('amount', filters.maxAmount);
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    // Sort by deadline (closest first) or amount (highest first)
    if (filters.sortBy === 'deadline') {
      query = query.order('deadline', { ascending: true });
    } else if (filters.sortBy === 'amount') {
      query = query.order('amount', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Calculate match score between scholarship and user profile
   * @param {Object} scholarship - Scholarship data
   * @param {Object} profile - User profile
   * @returns {number} - Match score (0-100)
   */
  static calculateMatchScore(scholarship, profile) {
    let score = scholarship.match_score || 50; // Base score

    if (!profile || Object.keys(profile).length === 0) {
      return score;
    }

    // Field of study match
    if (profile.education && profile.education.length > 0) {
      const userFields = profile.education.map(edu => edu.field?.toLowerCase() || '');
      const scholarshipField = scholarship.field_of_study?.toLowerCase() || '';
      
      if (userFields.some(field => 
        field.includes(scholarshipField) || 
        scholarshipField.includes(field) ||
        this.areRelatedFields(field, scholarshipField)
      )) {
        score += 15;
      }
    }

    // Skills match
    if (profile.skills && profile.skills.length > 0) {
      const userSkills = profile.skills.map(skill => skill.toLowerCase());
      const scholarshipTags = scholarship.tags?.toLowerCase().split(',') || [];
      
      const skillMatches = userSkills.filter(skill => 
        scholarshipTags.some(tag => tag.includes(skill) || skill.includes(tag))
      ).length;
      
      score += Math.min(skillMatches * 5, 20); // Max 20 points for skills
    }

    // Academic level match
    if (profile.academicLevel) {
      const scholarshipLevels = scholarship.academic_level?.toLowerCase().split(',') || [];
      if (scholarshipLevels.some(level => level.includes(profile.academicLevel.toLowerCase()))) {
        score += 10;
      }
    }

    // Location preference (if available)
    if (profile.location && scholarship.location) {
      if (scholarship.location.toLowerCase() === 'global' || 
          scholarship.location.toLowerCase().includes(profile.location.toLowerCase())) {
        score += 5;
      }
    }

    return Math.min(Math.max(score, 0), 100); // Ensure score is between 0-100
  }

  /**
   * Check if two fields of study are related
   * @param {string} field1 - First field
   * @param {string} field2 - Second field
   * @returns {boolean} - Whether fields are related
   */
  static areRelatedFields(field1, field2) {
    const relatedFields = {
      'computer science': ['software engineering', 'information technology', 'data science', 'artificial intelligence'],
      'engineering': ['computer engineering', 'electrical engineering', 'mechanical engineering', 'civil engineering'],
      'business': ['management', 'finance', 'marketing', 'economics'],
      'science': ['biology', 'chemistry', 'physics', 'mathematics'],
      'arts': ['design', 'media', 'communications', 'literature']
    };

    for (const [category, related] of Object.entries(relatedFields)) {
      if ((field1.includes(category) && related.some(r => field2.includes(r))) ||
          (field2.includes(category) && related.some(r => field1.includes(r)))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get fallback scholarships when Supabase is not available
   * @returns {Array} - Fallback scholarship data
   */
  static getFallbackScholarships() {
    return [
      {
        id: 1,
        title: "Tech Innovation Scholarship",
        provider: "TechCorp Foundation",
        amount: 15000,
        deadline: "2024-12-31",
        description: "Supporting the next generation of technology innovators.",
        eligibility: "Undergraduate students in STEM fields",
        field_of_study: "Technology",
        academic_level: "Undergraduate",
        location: "United States",
        application_url: "https://example.com/apply",
        requirements: "3.0+ GPA, demonstrated interest in technology",
        tags: "technology,innovation,stem",
        matchScore: 85
      },
      {
        id: 2,
        title: "Future Leaders Scholarship",
        provider: "Leadership Institute",
        amount: 10000,
        deadline: "2024-11-30",
        description: "Developing tomorrow's leaders through education support.",
        eligibility: "Graduate students with leadership experience",
        field_of_study: "Business",
        academic_level: "Graduate",
        location: "Global",
        application_url: "https://example.com/apply",
        requirements: "Leadership experience, community involvement",
        tags: "leadership,business,global",
        matchScore: 80
      },
      {
        id: 3,
        title: "STEM Excellence Award",
        provider: "Science Foundation",
        amount: 20000,
        deadline: "2024-10-15",
        description: "Recognizing excellence in science, technology, engineering, and mathematics.",
        eligibility: "High-achieving STEM students",
        field_of_study: "STEM",
        academic_level: "Undergraduate,Graduate",
        location: "United States,Canada",
        application_url: "https://example.com/apply",
        requirements: "3.5+ GPA, STEM major, research experience",
        tags: "stem,science,research,excellence",
        matchScore: 90
      }
    ];
  }

  /**
   * Add a new scholarship to the database
   * @param {Object} scholarshipData - Scholarship information
   * @returns {Promise<Object>} - Created scholarship
   */
  static async addScholarship(scholarshipData) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('scholarships')
      .insert([scholarshipData])
      .select()
      .single();

    if (error) {
      console.error('Error adding scholarship:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update scholarship information
   * @param {number} id - Scholarship ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated scholarship
   */
  static async updateScholarship(id, updates) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('scholarships')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating scholarship:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a scholarship
   * @param {number} id - Scholarship ID
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteScholarship(id) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('scholarships')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting scholarship:', error);
      throw error;
    }

    return true;
  }

  /**
   * Get scholarship statistics
   * @returns {Promise<Object>} - Statistics
   */
  static async getStatistics() {
    if (!supabase) {
      return {
        totalScholarships: 0,
        totalAmount: 0,
        averageAmount: 0,
        topProviders: []
      };
    }

    try {
      const { data: scholarships, error } = await supabase
        .from('scholarships')
        .select('amount, provider');

      if (error) throw error;

      const totalScholarships = scholarships.length;
      const totalAmount = scholarships.reduce((sum, s) => sum + (s.amount || 0), 0);
      const averageAmount = totalAmount / totalScholarships;

      const providerCounts = scholarships.reduce((acc, s) => {
        acc[s.provider] = (acc[s.provider] || 0) + 1;
        return acc;
      }, {});

      const topProviders = Object.entries(providerCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([provider, count]) => ({ provider, count }));

      return {
        totalScholarships,
        totalAmount,
        averageAmount: Math.round(averageAmount),
        topProviders
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        totalScholarships: 0,
        totalAmount: 0,
        averageAmount: 0,
        topProviders: []
      };
    }
  }
}

export default SupabaseService;
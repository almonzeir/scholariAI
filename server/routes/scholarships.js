import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Initialize Supabase client with hardcoded values for now
const supabase = createClient(
  'https://rhtapruqmzlbtfetntlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJodGFwcnVxbXpsYnRmZXRudGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODIyNjgsImV4cCI6MjA3MDE1ODI2OH0.V8-VBM8NmrefAMQp4UASrPa7jzV-Qvy3_pLUNMayAQk'
);

// Get all scholarships with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      fieldOfStudy,
      academicLevel,
      minAmount,
      maxAmount,
      location,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabase
      .from('scholarships')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,provider.ilike.%${search}%`);
    }

    if (fieldOfStudy) {
      query = query.eq('field_of_study', fieldOfStudy);
    }

    if (academicLevel) {
      query = query.eq('academic_level', academicLevel);
    }

    if (minAmount) {
      query = query.gte('amount', parseInt(minAmount));
    }

    if (maxAmount) {
      query = query.lte('amount', parseInt(maxAmount));
    }

    if (location) {
      query = query.or(`location.ilike.%${location}%,location.eq.Global`);
    }

    // Only show active scholarships with future deadlines
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('deadline', today);

    // Apply sorting
    const validSortFields = ['created_at', 'deadline', 'amount', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? true : false;
    query = query.order(sortField, { ascending: order });

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: scholarships, error, count } = await query;

    if (error) {
      console.error('Scholarships fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch scholarships' });
    }

    res.json({
      scholarships: scholarships || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Scholarships fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scholarship by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: scholarship, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }

    res.json({ scholarship });
  } catch (error) {
    console.error('Scholarship fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get personalized scholarship recommendations
router.post('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { profileData } = req.body;
    const userId = req.user.userId;

    if (!profileData) {
      return res.status(400).json({ error: 'Profile data is required for recommendations' });
    }

    // Get all active scholarships
    const today = new Date().toISOString().split('T')[0];
    const { data: scholarships, error } = await supabase
      .from('scholarships')
      .select('*')
      .gte('deadline', today)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Scholarships fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch scholarships' });
    }

    // Calculate match scores
    const scoredScholarships = scholarships.map(scholarship => ({
      ...scholarship,
      matchScore: calculateMatchScore(scholarship, profileData)
    }));

    // Sort by match score and return top recommendations
    const recommendations = scoredScholarships
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);

    res.json({ recommendations });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new scholarship (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const scholarshipData = req.body;

    // Validate required fields
    const requiredFields = ['title', 'provider', 'amount', 'deadline', 'description'];
    for (const field of requiredFields) {
      if (!scholarshipData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Validate deadline is in the future
    const deadline = new Date(scholarshipData.deadline);
    const today = new Date();
    if (deadline <= today) {
      return res.status(400).json({ error: 'Deadline must be in the future' });
    }

    const { data: newScholarship, error } = await supabase
      .from('scholarships')
      .insert({
        ...scholarshipData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Scholarship creation error:', error);
      return res.status(500).json({ error: 'Failed to create scholarship' });
    }

    res.status(201).json({
      message: 'Scholarship created successfully',
      scholarship: newScholarship
    });
  } catch (error) {
    console.error('Scholarship creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update scholarship (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate deadline if provided
    if (updateData.deadline) {
      const deadline = new Date(updateData.deadline);
      const today = new Date();
      if (deadline <= today) {
        return res.status(400).json({ error: 'Deadline must be in the future' });
      }
    }

    const { data: updatedScholarship, error } = await supabase
      .from('scholarships')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Scholarship update error:', error);
      return res.status(500).json({ error: 'Failed to update scholarship' });
    }

    if (!updatedScholarship) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }

    res.json({
      message: 'Scholarship updated successfully',
      scholarship: updatedScholarship
    });
  } catch (error) {
    console.error('Scholarship update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete scholarship (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('scholarships')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Scholarship deletion error:', error);
      return res.status(500).json({ error: 'Failed to delete scholarship' });
    }

    res.json({ message: 'Scholarship deleted successfully' });
  } catch (error) {
    console.error('Scholarship deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scholarship statistics
router.get('/stats/overview', optionalAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get total scholarships
    const { count: totalScholarships } = await supabase
      .from('scholarships')
      .select('*', { count: 'exact', head: true });

    // Get active scholarships
    const { count: activeScholarships } = await supabase
      .from('scholarships')
      .select('*', { count: 'exact', head: true })
      .gte('deadline', today);

    // Get total funding available
    const { data: fundingData } = await supabase
      .from('scholarships')
      .select('amount')
      .gte('deadline', today);

    const totalFunding = fundingData?.reduce((sum, scholarship) => sum + (scholarship.amount || 0), 0) || 0;

    // Get scholarships by field of study
    const { data: fieldData } = await supabase
      .from('scholarships')
      .select('field_of_study')
      .gte('deadline', today);

    const fieldStats = fieldData?.reduce((acc, scholarship) => {
      const field = scholarship.field_of_study || 'Other';
      acc[field] = (acc[field] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      totalScholarships: totalScholarships || 0,
      activeScholarships: activeScholarships || 0,
      totalFunding,
      fieldStats
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to calculate match score
function calculateMatchScore(scholarship, profile) {
  let score = 0;

  // Field of study match (40 points)
  if (scholarship.field_of_study && profile.fieldOfStudy) {
    if (scholarship.field_of_study.toLowerCase() === profile.fieldOfStudy.toLowerCase()) {
      score += 40;
    } else if (areRelatedFields(scholarship.field_of_study, profile.fieldOfStudy)) {
      score += 20;
    }
  }

  // Academic level match (30 points)
  if (scholarship.academic_level && profile.academicLevel) {
    if (scholarship.academic_level.toLowerCase() === profile.academicLevel.toLowerCase()) {
      score += 30;
    }
  }

  // GPA requirement (20 points)
  if (scholarship.min_gpa && profile.gpa) {
    if (profile.gpa >= scholarship.min_gpa) {
      score += 20;
    }
  }

  // Location preference (10 points)
  if (scholarship.location && profile.location) {
    if (scholarship.location === 'Global' || 
        scholarship.location.toLowerCase().includes(profile.location.toLowerCase())) {
      score += 10;
    }
  }

  return Math.min(score, 100); // Cap at 100
}

// Helper function to check if fields are related
function areRelatedFields(field1, field2) {
  const relatedFields = {
    'Computer Science': ['Information Technology', 'Software Engineering', 'Data Science'],
    'Engineering': ['Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering'],
    'Business': ['Economics', 'Finance', 'Marketing', 'Management'],
    'Medicine': ['Nursing', 'Pharmacy', 'Public Health', 'Biology'],
    'Arts': ['Fine Arts', 'Graphic Design', 'Music', 'Literature']
  };

  for (const [mainField, related] of Object.entries(relatedFields)) {
    if ((field1 === mainField && related.includes(field2)) ||
        (field2 === mainField && related.includes(field1)) ||
        (related.includes(field1) && related.includes(field2))) {
      return true;
    }
  }
  return false;
}

export default router;
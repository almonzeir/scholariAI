import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  'https://rhtapruqmzlbtfetntlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJodGFwcnVxbXpsYnRmZXRudGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODIyNjgsImV4cCI6MjA3MDE1ODI2OH0.V8-VBM8NmrefAMQp4UASrPa7jzV-Qvy3_pLUNMayAQk'
);

// Get user applications
router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    let query = supabase
      .from('applications')
      .select(`
        *,
        scholarships (
          id,
          title,
          provider,
          amount,
          deadline
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Applications fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    res.json({
      applications: applications || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply for scholarship
router.post('/applications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { scholarshipId, applicationData } = req.body;

    if (!scholarshipId) {
      return res.status(400).json({ error: 'Scholarship ID is required' });
    }

    // Check if scholarship exists and is still active
    const { data: scholarship, error: scholarshipError } = await supabase
      .from('scholarships')
      .select('id, title, deadline')
      .eq('id', scholarshipId)
      .single();

    if (scholarshipError || !scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }

    // Check if deadline has passed
    const deadline = new Date(scholarship.deadline);
    const today = new Date();
    if (deadline <= today) {
      return res.status(400).json({ error: 'Application deadline has passed' });
    }

    // Check if user has already applied
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .eq('scholarship_id', scholarshipId)
      .single();

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this scholarship' });
    }

    // Create application
    const { data: newApplication, error } = await supabase
      .from('applications')
      .insert({
        user_id: userId,
        scholarship_id: scholarshipId,
        application_data: applicationData,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        scholarships (
          id,
          title,
          provider,
          amount,
          deadline
        )
      `)
      .single();

    if (error) {
      console.error('Application creation error:', error);
      return res.status(500).json({ error: 'Failed to submit application' });
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application: newApplication
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update application status
router.put('/applications/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'submitted', 'under_review', 'accepted', 'rejected', 'withdrawn'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;

    const { data: updatedApplication, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only update their own applications
      .select(`
        *,
        scholarships (
          id,
          title,
          provider,
          amount,
          deadline
        )
      `)
      .single();

    if (error) {
      console.error('Application update error:', error);
      return res.status(500).json({ error: 'Failed to update application' });
    }

    if (!updatedApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      message: 'Application updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Application update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: favorites, error, count } = await supabase
      .from('favorites')
      .select(`
        *,
        scholarships (
          id,
          title,
          provider,
          amount,
          deadline,
          description,
          field_of_study,
          academic_level
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Favorites fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch favorites' });
    }

    res.json({
      favorites: favorites || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Favorites fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add scholarship to favorites
router.post('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { scholarshipId } = req.body;

    if (!scholarshipId) {
      return res.status(400).json({ error: 'Scholarship ID is required' });
    }

    // Check if scholarship exists
    const { data: scholarship, error: scholarshipError } = await supabase
      .from('scholarships')
      .select('id')
      .eq('id', scholarshipId)
      .single();

    if (scholarshipError || !scholarship) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }

    // Check if already favorited
    const { data: existingFavorite } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('scholarship_id', scholarshipId)
      .single();

    if (existingFavorite) {
      return res.status(400).json({ error: 'Scholarship already in favorites' });
    }

    // Add to favorites
    const { data: newFavorite, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        scholarship_id: scholarshipId,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        scholarships (
          id,
          title,
          provider,
          amount,
          deadline,
          description,
          field_of_study,
          academic_level
        )
      `)
      .single();

    if (error) {
      console.error('Favorite creation error:', error);
      return res.status(500).json({ error: 'Failed to add to favorites' });
    }

    res.status(201).json({
      message: 'Added to favorites successfully',
      favorite: newFavorite
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove scholarship from favorites
router.delete('/favorites/:scholarshipId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { scholarshipId } = req.params;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('scholarship_id', scholarshipId);

    if (error) {
      console.error('Favorite deletion error:', error);
      return res.status(500).json({ error: 'Failed to remove from favorites' });
    }

    res.json({ message: 'Removed from favorites successfully' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user dashboard statistics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get application counts by status
    const { data: applications } = await supabase
      .from('applications')
      .select('status')
      .eq('user_id', userId);

    const applicationStats = applications?.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get favorites count
    const { count: favoritesCount } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get recent applications
    const { data: recentApplications } = await supabase
      .from('applications')
      .select(`
        *,
        scholarships (
          id,
          title,
          provider,
          amount,
          deadline
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      applicationStats,
      favoritesCount: favoritesCount || 0,
      recentApplications: recentApplications || []
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
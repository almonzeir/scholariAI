import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  'https://rhtapruqmzlbtfetntlt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJodGFwcnVxbXpsYnRmZXRudGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODIyNjgsImV4cCI6MjA3MDE1ODI2OH0.V8-VBM8NmrefAMQp4UASrPa7jzV-Qvy3_pLUNMayAQk'
);

// Track user activity
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { event, data = {}, page, timestamp } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    const { error } = await supabase
      .from('user_analytics')
      .insert({
        user_id: userId,
        event_name: event,
        event_data: data,
        page: page,
        timestamp: timestamp || new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Analytics tracking error:', error);
      return res.status(500).json({ error: 'Failed to track event' });
    }

    res.json({ message: 'Event tracked successfully' });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user analytics (for the authenticated user)
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, event, limit = 100 } = req.query;

    let query = supabase
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    if (event) {
      query = query.eq('event_name', event);
    }

    query = query
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    const { data: analytics, error } = await query;

    if (error) {
      console.error('User analytics fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    res.json({ analytics: analytics || [] });
  } catch (error) {
    console.error('User analytics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get application statistics (admin only)
router.get('/applications', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Base query for applications
    let baseQuery = supabase.from('applications').select('*');

    if (startDate) {
      baseQuery = baseQuery.gte('created_at', startDate);
    }

    if (endDate) {
      baseQuery = baseQuery.lte('created_at', endDate);
    }

    // Get application counts by status
    const { data: applications } = await baseQuery;

    const statusCounts = applications?.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get applications over time (daily)
    const dailyApplications = applications?.reduce((acc, app) => {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get top scholarships by application count
    const scholarshipCounts = applications?.reduce((acc, app) => {
      acc[app.scholarship_id] = (acc[app.scholarship_id] || 0) + 1;
      return acc;
    }, {}) || {};

    const topScholarships = Object.entries(scholarshipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => ({ scholarship_id: id, application_count: count }));

    res.json({
      totalApplications: applications?.length || 0,
      statusCounts,
      dailyApplications,
      topScholarships
    });
  } catch (error) {
    console.error('Application analytics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics (admin only)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get user registrations
    let userQuery = supabase.from('users').select('created_at');

    if (startDate) {
      userQuery = userQuery.gte('created_at', startDate);
    }

    if (endDate) {
      userQuery = userQuery.lte('created_at', endDate);
    }

    const { data: users } = await userQuery;

    // Get daily registrations
    const dailyRegistrations = users?.reduce((acc, user) => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get active users (users who have logged in recently)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeUsers } = await supabase
      .from('user_analytics')
      .select('user_id')
      .eq('event_name', 'login')
      .gte('timestamp', thirtyDaysAgo.toISOString());

    const uniqueActiveUsers = new Set(activeUsers?.map(u => u.user_id) || []).size;

    res.json({
      totalUsers: users?.length || 0,
      dailyRegistrations,
      activeUsers: uniqueActiveUsers
    });
  } catch (error) {
    console.error('User analytics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scholarship statistics (admin only)
router.get('/scholarships', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get scholarship data
    let scholarshipQuery = supabase.from('scholarships').select('*');

    if (startDate) {
      scholarshipQuery = scholarshipQuery.gte('created_at', startDate);
    }

    if (endDate) {
      scholarshipQuery = scholarshipQuery.lte('created_at', endDate);
    }

    const { data: scholarships } = await scholarshipQuery;

    // Get scholarships by field of study
    const fieldCounts = scholarships?.reduce((acc, scholarship) => {
      const field = scholarship.field_of_study || 'Other';
      acc[field] = (acc[field] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get scholarships by academic level
    const levelCounts = scholarships?.reduce((acc, scholarship) => {
      const level = scholarship.academic_level || 'Other';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get average scholarship amount
    const amounts = scholarships?.map(s => parseFloat(s.amount) || 0).filter(a => a > 0) || [];
    const averageAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;

    res.json({
      totalScholarships: scholarships?.length || 0,
      fieldCounts,
      levelCounts,
      averageAmount: Math.round(averageAmount * 100) / 100
    });
  } catch (error) {
    console.error('Scholarship analytics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system overview (admin only)
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    // Get counts for all major entities
    const [usersResult, scholarshipsResult, applicationsResult, favoritesResult] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('scholarships').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true }),
      supabase.from('favorites').select('*', { count: 'exact', head: true })
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentActivity } = await supabase
      .from('user_analytics')
      .select('event_name')
      .gte('timestamp', sevenDaysAgo.toISOString());

    const activityCounts = recentActivity?.reduce((acc, activity) => {
      acc[activity.event_name] = (acc[activity.event_name] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      totalUsers: usersResult.count || 0,
      totalScholarships: scholarshipsResult.count || 0,
      totalApplications: applicationsResult.count || 0,
      totalFavorites: favoritesResult.count || 0,
      recentActivity: activityCounts
    });
  } catch (error) {
    console.error('System overview fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get popular searches
router.get('/searches', requireAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const { data: searches } = await supabase
      .from('user_analytics')
      .select('event_data')
      .eq('event_name', 'search')
      .order('created_at', { ascending: false })
      .limit(1000); // Get recent searches

    // Extract search terms and count them
    const searchTerms = searches?.map(s => s.event_data?.query).filter(Boolean) || [];
    const termCounts = searchTerms.reduce((acc, term) => {
      const normalizedTerm = term.toLowerCase().trim();
      acc[normalizedTerm] = (acc[normalizedTerm] || 0) + 1;
      return acc;
    }, {});

    const popularSearches = Object.entries(termCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, parseInt(limit))
      .map(([term, count]) => ({ term, count }));

    res.json({ popularSearches });
  } catch (error) {
    console.error('Popular searches fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
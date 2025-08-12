#!/usr/bin/env node

/**
 * 🗄️ Database Setup Script for ScholarSeeker AI
 * 
 * This script initializes all required Supabase tables for the application.
 * Run this once after setting up your Supabase project.
 * 
 * Usage: node setup-database.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Supabase client with service key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_KEY');
  console.error('\nPlease check your .env file.');
  process.exit(1);
}

/**
 * Main database setup function
 */
async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup...');
    console.log(`📍 Supabase URL: ${process.env.SUPABASE_URL}`);
    
    // Test connection first
    await testConnection();
    
    // Create all tables
    await createUsersTable();
    await createScholarshipsTable();
    await createApplicationsTable();
    await createFavoritesTable();
    await createUserFilesTable();
    await createUserAnalyticsTable();
    
    // Set up Row Level Security (RLS)
    await setupRLS();
    
    // Insert sample data (optional)
    const shouldInsertSample = process.argv.includes('--sample-data');
    if (shouldInsertSample) {
      await insertSampleData();
    }
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify tables in your Supabase dashboard');
    console.log('   2. Start your application: npm run dev');
    console.log('   3. Test authentication and data operations');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .limit(1);
    
  if (error) {
    throw new Error(`Connection failed: ${error.message}`);
  }
  
  console.log('✅ Database connection successful');
}

/**
 * Create users table
 */
async function createUsersTable() {
  console.log('📝 Creating users table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        date_of_birth DATE,
        phone VARCHAR(20),
        address TEXT,
        field_of_study VARCHAR(100),
        academic_level VARCHAR(50),
        gpa DECIMAL(3,2),
        graduation_year INTEGER,
        profile_picture_url TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
      CREATE INDEX IF NOT EXISTS idx_users_field_of_study ON public.users(field_of_study);
      CREATE INDEX IF NOT EXISTS idx_users_academic_level ON public.users(academic_level);
    `
  });
  
  if (error) {
    throw new Error(`Users table creation failed: ${error.message}`);
  }
  
  console.log('✅ Users table created');
}

/**
 * Create scholarships table
 */
async function createScholarshipsTable() {
  console.log('📝 Creating scholarships table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.scholarships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        deadline DATE NOT NULL,
        description TEXT,
        requirements TEXT,
        field_of_study VARCHAR(100),
        academic_level VARCHAR(50),
        eligibility_criteria TEXT,
        application_url TEXT,
        contact_email VARCHAR(255),
        location VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_scholarships_field_of_study ON public.scholarships(field_of_study);
      CREATE INDEX IF NOT EXISTS idx_scholarships_academic_level ON public.scholarships(academic_level);
      CREATE INDEX IF NOT EXISTS idx_scholarships_deadline ON public.scholarships(deadline);
      CREATE INDEX IF NOT EXISTS idx_scholarships_amount ON public.scholarships(amount);
      CREATE INDEX IF NOT EXISTS idx_scholarships_is_active ON public.scholarships(is_active);
    `
  });
  
  if (error) {
    throw new Error(`Scholarships table creation failed: ${error.message}`);
  }
  
  console.log('✅ Scholarships table created');
}

/**
 * Create applications table
 */
async function createApplicationsTable() {
  console.log('📝 Creating applications table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        notes TEXT,
        documents JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, scholarship_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
      CREATE INDEX IF NOT EXISTS idx_applications_scholarship_id ON public.applications(scholarship_id);
      CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
    `
  });
  
  if (error) {
    throw new Error(`Applications table creation failed: ${error.message}`);
  }
  
  console.log('✅ Applications table created');
}

/**
 * Create favorites table
 */
async function createFavoritesTable() {
  console.log('📝 Creating favorites table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, scholarship_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_scholarship_id ON public.favorites(scholarship_id);
    `
  });
  
  if (error) {
    throw new Error(`Favorites table creation failed: ${error.message}`);
  }
  
  console.log('✅ Favorites table created');
}

/**
 * Create user_files table
 */
async function createUserFilesTable() {
  console.log('📝 Creating user_files table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.user_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INTEGER NOT NULL,
        file_url TEXT NOT NULL,
        upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        metadata JSONB
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON public.user_files(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_files_file_type ON public.user_files(file_type);
    `
  });
  
  if (error) {
    throw new Error(`User files table creation failed: ${error.message}`);
  }
  
  console.log('✅ User files table created');
}

/**
 * Create user_analytics table
 */
async function createUserAnalyticsTable() {
  console.log('📝 Creating user_analytics table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.user_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        session_id VARCHAR(255),
        ip_address INET,
        user_agent TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON public.user_analytics(event_type);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_timestamp ON public.user_analytics(timestamp);
    `
  });
  
  if (error) {
    throw new Error(`User analytics table creation failed: ${error.message}`);
  }
  
  console.log('✅ User analytics table created');
}

/**
 * Set up Row Level Security (RLS)
 */
async function setupRLS() {
  console.log('🔒 Setting up Row Level Security...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Enable RLS on all tables
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
      
      -- Users can only see and modify their own data
      CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid() = id);
      
      -- Everyone can view active scholarships
      CREATE POLICY IF NOT EXISTS "Anyone can view active scholarships" ON public.scholarships
        FOR SELECT USING (is_active = true);
      
      -- Users can manage their own applications
      CREATE POLICY IF NOT EXISTS "Users can view own applications" ON public.applications
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can create own applications" ON public.applications
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can update own applications" ON public.applications
        FOR UPDATE USING (auth.uid() = user_id);
      
      -- Users can manage their own favorites
      CREATE POLICY IF NOT EXISTS "Users can view own favorites" ON public.favorites
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can create own favorites" ON public.favorites
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can delete own favorites" ON public.favorites
        FOR DELETE USING (auth.uid() = user_id);
      
      -- Users can manage their own files
      CREATE POLICY IF NOT EXISTS "Users can view own files" ON public.user_files
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can upload own files" ON public.user_files
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      -- Users can view their own analytics
      CREATE POLICY IF NOT EXISTS "Users can view own analytics" ON public.user_analytics
        FOR SELECT USING (auth.uid() = user_id);
    `
  });
  
  if (error) {
    console.warn('⚠️  RLS setup had some issues (this is normal if policies already exist):', error.message);
  } else {
    console.log('✅ Row Level Security configured');
  }
}

/**
 * Insert sample data
 */
async function insertSampleData() {
  console.log('📊 Inserting sample data...');
  
  // Sample scholarships
  const { error: scholarshipError } = await supabase
    .from('scholarships')
    .upsert([
      {
        title: 'Merit Excellence Scholarship',
        provider: 'Global Education Foundation',
        amount: 5000.00,
        deadline: '2024-12-31',
        description: 'A scholarship for outstanding academic achievement.',
        field_of_study: 'Computer Science',
        academic_level: 'Undergraduate',
        application_url: 'https://example.com/apply',
        location: 'United States'
      },
      {
        title: 'STEM Innovation Grant',
        provider: 'Tech Future Institute',
        amount: 7500.00,
        deadline: '2024-11-30',
        description: 'Supporting the next generation of STEM leaders.',
        field_of_study: 'Engineering',
        academic_level: 'Graduate',
        application_url: 'https://example.com/stem-apply',
        location: 'Canada'
      },
      {
        title: 'Global Health Research Fellowship',
        provider: 'World Health Organization',
        amount: 10000.00,
        deadline: '2024-10-15',
        description: 'Research fellowship in global health initiatives.',
        field_of_study: 'Medicine',
        academic_level: 'PhD',
        application_url: 'https://example.com/health-fellowship',
        location: 'International'
      }
    ], { onConflict: 'title' });
  
  if (scholarshipError) {
    console.warn('⚠️  Sample scholarship insertion had issues:', scholarshipError.message);
  } else {
    console.log('✅ Sample scholarships inserted');
  }
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase };
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Database initialization function
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database tables...');

    // Create users table
    await createUsersTable();
    
    // Create scholarships table
    await createScholarshipsTable();
    
    // Create applications table
    await createApplicationsTable();
    
    // Create favorites table
    await createFavoritesTable();
    
    // Create user_files table
    await createUserFilesTable();
    
    // Create user_analytics table
    await createUserAnalyticsTable();
    
    // Insert sample data
    await insertSampleData();
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Create users table
const createUsersTable = async () => {
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
    console.error('Error creating users table:', error);
    throw error;
  }
  console.log('Users table created successfully');
};

// Create scholarships table
const createScholarshipsTable = async () => {
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
    console.error('Error creating scholarships table:', error);
    throw error;
  }
  console.log('Scholarships table created successfully');
};

// Create applications table
const createApplicationsTable = async () => {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        application_data JSONB,
        notes TEXT,
        submitted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, scholarship_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
      CREATE INDEX IF NOT EXISTS idx_applications_scholarship_id ON public.applications(scholarship_id);
      CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
      CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at);
    `
  });
  
  if (error) {
    console.error('Error creating applications table:', error);
    throw error;
  }
  console.log('Applications table created successfully');
};

// Create favorites table
const createFavoritesTable = async () => {
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
    console.error('Error creating favorites table:', error);
    throw error;
  }
  console.log('Favorites table created successfully');
};

// Create user_files table
const createUserFilesTable = async () => {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.user_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON public.user_files(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_files_category ON public.user_files(category);
    `
  });
  
  if (error) {
    console.error('Error creating user_files table:', error);
    throw error;
  }
  console.log('User files table created successfully');
};

// Create user_analytics table
const createUserAnalyticsTable = async () => {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.user_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        event_name VARCHAR(100) NOT NULL,
        event_data JSONB,
        page VARCHAR(255),
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_event_name ON public.user_analytics(event_name);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_timestamp ON public.user_analytics(timestamp);
    `
  });
  
  if (error) {
    console.error('Error creating user_analytics table:', error);
    throw error;
  }
  console.log('User analytics table created successfully');
};

// Insert sample data
const insertSampleData = async () => {
  try {
    // Check if scholarships already exist
    const { data: existingScholarships } = await supabase
      .from('scholarships')
      .select('id')
      .limit(1);

    if (existingScholarships && existingScholarships.length > 0) {
      console.log('Sample data already exists, skipping insertion');
      return;
    }

    // Sample scholarships data
    const sampleScholarships = [
      {
        title: 'Merit Excellence Scholarship',
        provider: 'Academic Foundation',
        amount: 5000.00,
        deadline: '2024-12-31',
        description: 'A prestigious scholarship for outstanding academic achievement.',
        requirements: 'Minimum GPA of 3.5, full-time enrollment, essay submission',
        field_of_study: 'Any',
        academic_level: 'Undergraduate',
        eligibility_criteria: 'Must be enrolled in an accredited institution',
        application_url: 'https://example.com/apply',
        contact_email: 'scholarships@academicfoundation.org',
        location: 'United States'
      },
      {
        title: 'STEM Innovation Grant',
        provider: 'Tech Future Foundation',
        amount: 7500.00,
        deadline: '2024-11-15',
        description: 'Supporting the next generation of STEM innovators.',
        requirements: 'STEM major, research project proposal, recommendation letters',
        field_of_study: 'Engineering',
        academic_level: 'Graduate',
        eligibility_criteria: 'Must be pursuing a degree in STEM field',
        application_url: 'https://example.com/stem-apply',
        contact_email: 'grants@techfuture.org',
        location: 'International'
      },
      {
        title: 'Community Service Leadership Award',
        provider: 'Civic Engagement Institute',
        amount: 3000.00,
        deadline: '2024-10-30',
        description: 'Recognizing students who make a difference in their communities.',
        requirements: 'Demonstrated community service, leadership experience, personal statement',
        field_of_study: 'Social Sciences',
        academic_level: 'Undergraduate',
        eligibility_criteria: 'Minimum 100 hours of community service',
        application_url: 'https://example.com/community-apply',
        contact_email: 'awards@civicengagement.org',
        location: 'United States'
      },
      {
        title: 'Creative Arts Excellence Scholarship',
        provider: 'Arts & Culture Foundation',
        amount: 4000.00,
        deadline: '2024-12-15',
        description: 'Supporting talented artists and creative professionals.',
        requirements: 'Portfolio submission, artistic statement, academic transcript',
        field_of_study: 'Arts',
        academic_level: 'Undergraduate',
        eligibility_criteria: 'Must be pursuing a degree in creative arts',
        application_url: 'https://example.com/arts-apply',
        contact_email: 'scholarships@artsculture.org',
        location: 'United States'
      },
      {
        title: 'Business Leadership Scholarship',
        provider: 'Entrepreneurship Network',
        amount: 6000.00,
        deadline: '2024-11-30',
        description: 'Developing the next generation of business leaders.',
        requirements: 'Business plan, leadership experience, academic excellence',
        field_of_study: 'Business',
        academic_level: 'Graduate',
        eligibility_criteria: 'Must be enrolled in a business program',
        application_url: 'https://example.com/business-apply',
        contact_email: 'scholarships@entrepreneurship.net',
        location: 'International'
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
  } catch (error) {
    console.error('Error inserting sample data:', error);
    throw error;
  }
};

export default supabase;
# 🗄️ Database Setup Guide

## Overview

ScholarSeeker AI uses **Supabase** as its backend database and authentication provider. This guide will help you set up the database tables and configure authentication properly.

## ✅ Current Integration Status

**Good news!** Your application is already fully integrated with Supabase:

- ✅ **Frontend Authentication**: Configured in `src/contexts/AuthContext.jsx`
- ✅ **Backend Authentication**: Implemented in `server/auth.js`
- ✅ **Database Client**: Set up in `src/lib/supabase.js`
- ✅ **Environment Variables**: Configured in `.env`
- ✅ **API Routes**: All 12 endpoints connected to Supabase

## 🚀 Quick Setup

### 1. Verify Environment Variables

Make sure your `.env` file contains:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Client-side (Vite)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Run Database Setup

**Option A: Basic Setup (Recommended)**
```bash
npm run setup-db
```

**Option B: Setup with Sample Data**
```bash
npm run setup-db-with-sample
```

### 3. Verify Setup

1. Check your Supabase dashboard
2. Verify all 6 tables are created
3. Test authentication by registering a new user

## 📊 Database Schema

The setup script creates these tables:

### 👤 Users Table
- **Purpose**: Store user profiles and authentication data
- **Key Fields**: email, password_hash, academic info, profile data
- **Indexes**: email, field_of_study, academic_level

### 🎓 Scholarships Table
- **Purpose**: Store scholarship opportunities
- **Key Fields**: title, provider, amount, deadline, requirements
- **Indexes**: field_of_study, academic_level, deadline, amount

### 📝 Applications Table
- **Purpose**: Track scholarship applications
- **Key Fields**: user_id, scholarship_id, status, documents
- **Relationships**: Links users to scholarships

### ❤️ Favorites Table
- **Purpose**: Store user's favorite scholarships
- **Key Fields**: user_id, scholarship_id
- **Relationships**: Many-to-many between users and scholarships

### 📁 User Files Table
- **Purpose**: Manage uploaded documents
- **Key Fields**: user_id, file_name, file_url, metadata
- **Features**: File type tracking, size limits

### 📈 User Analytics Table
- **Purpose**: Track user behavior and engagement
- **Key Fields**: user_id, event_type, event_data, timestamp
- **Features**: Session tracking, IP logging

## 🔒 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can only access their own data
- Scholarships are publicly readable
- Applications and favorites are user-specific
- Files and analytics are private to each user

### Authentication Flow
1. **Registration**: Creates user in Supabase Auth + custom users table
2. **Login**: JWT token generation with Supabase integration
3. **Authorization**: Token validation on all API endpoints
4. **Profile Management**: Secure profile updates with validation

## 🛠️ Manual Setup (Alternative)

If you prefer to set up tables manually in Supabase SQL Editor:

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Run the SQL commands from `setup-database.js`
4. Enable RLS and create policies

## 🔧 Troubleshooting

### Common Issues

**Connection Errors**
- Verify SUPABASE_URL and keys in `.env`
- Check Supabase project status
- Ensure service key has admin privileges

**Table Creation Fails**
- Check if tables already exist
- Verify SQL syntax in Supabase SQL Editor
- Review error messages for specific issues

**Authentication Issues**
- Confirm both client and server environment variables
- Test with Supabase Auth UI first
- Check JWT token generation in browser dev tools

### Debug Commands

```bash
# Test database connection
node -e "import('./setup-database.js').then(m => m.setupDatabase())"

# Check environment variables
node -e "console.log(process.env.SUPABASE_URL)"

# Verify Supabase client
node -e "import('./src/lib/supabase.js').then(m => console.log('Client OK'))"
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth with React](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)

## 🎯 Next Steps

After database setup:

1. **Test Authentication**: Register and login
2. **Verify API Endpoints**: Check all 12 routes work
3. **Upload Test Files**: Test document management
4. **Create Sample Scholarships**: Add test data
5. **Test Matching Algorithm**: Verify AI recommendations

---

**Need Help?** Check the console output from `npm run setup-db` for detailed error messages and troubleshooting steps.
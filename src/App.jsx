// 🎯 Main App Component - ScholarAI Full-Stack
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/DashboardPage';
import ScholarshipsPage from './pages/ScholarshipsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import { Phase4Demo } from './pages/Phase4Demo';
import Phase5Demo from './pages/Phase5Demo';
import CanonicalizationDemo from './pages/CanonicalizationDemo';
import PIIScrubDemo from './pages/PIIScrubDemo';
import ScholarshipDemo from './pages/ScholarshipDemo';
import FundingDemo from './pages/FundingDemo';
import DeadlineDemo from './pages/DeadlineDemo.jsx';
import DeduplicationDemo from './pages/DeduplicationDemo';
import Phase8to10Demo from './pages/Phase8to10Demo';
import './App.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user || !user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Guest Route Component (accessible without authentication)
const GuestRoute = ({ children }) => {
  return children;
};

// Main App Layout
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/" 
                element={
                  <PublicRoute>
                    <AppLayout>
                      <HomePage />
                    </AppLayout>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                } 
              />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DashboardPage />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/scholarships" 
                element={
                  <GuestRoute>
                    <AppLayout>
                      <ScholarshipsPage />
                    </AppLayout>
                  </GuestRoute>
                } 
              />
              <Route 
                path="/phase4-demo" 
                element={
                  <GuestRoute>
                    <Phase4Demo />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/phase5-demo" 
                element={
                  <GuestRoute>
                    <Phase5Demo />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/canonicalization-demo" 
                element={
                  <GuestRoute>
                    <CanonicalizationDemo />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/pii-scrub-demo" 
                element={
                  <GuestRoute>
                    <PIIScrubDemo />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/scholarship-demo" 
                element={
                  <GuestRoute>
                    <ScholarshipDemo />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/funding-demo" 
                element={
                  <GuestRoute>
                    <FundingDemo />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/deadline-demo" 
                element={
                  <GuestRoute>
                    <DeadlineDemo />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/deduplication-demo" 
                element={
                  <GuestRoute>
                    <DeduplicationDemo />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/phase8to10-demo" 
                element={
                  <GuestRoute>
                    <Phase8to10Demo />
                  </GuestRoute>
                } 
              />
              <Route 
                path="/applications" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ApplicationsPage />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ProfilePage />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/uploads" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <UploadPage />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SettingsPage />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AppLayout>
                      <AdminPage />
                    </AppLayout>
                  </AdminRoute>
                } 
              />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Toast notifications */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  theme: {
                    primary: '#4aed88',
                  },
                },
              }}
            />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default App;
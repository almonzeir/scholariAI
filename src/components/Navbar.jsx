import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, User, LogOut, Settings, BookOpen, FileText, Upload, BarChart3 } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsProfileOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const authenticatedNavLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/scholarships', label: 'Scholarships', icon: BookOpen },
    { path: '/applications', label: 'Applications', icon: FileText },
    { path: '/uploads', label: 'Documents', icon: Upload },
  ];

  const guestNavLinks = [
    { path: '/', label: 'Home', icon: BookOpen },
    { path: '/scholarships', label: 'Browse Scholarships', icon: BookOpen },
  ];

  const navLinks = isAuthenticated() ? authenticatedNavLinks : guestNavLinks;

  // Hide navbar only on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={isAuthenticated() ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-grad-primary rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
              <span className="text-white font-bold text-lg">🎓</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-heading font-bold text-text-hi">ScholarAI</span>
              <div className="text-xs text-text-lo font-medium">AI-Powered Platform</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-[cubic-bezier(.2,.7,.2,1)] ${
                  isActive(path)
                    ? 'text-primary bg-primary/10 shadow-sm'
                    : 'text-text-lo hover:text-text-hi hover:bg-elevated/50'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Profile Dropdown or Auth Buttons */}
          {isAuthenticated() ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 text-sm rounded-xl p-2 focus:outline-none focus:ring-4 focus:ring-primary/20 hover:bg-elevated/50 transition-all duration-300"
              >
                <div className="w-8 h-8 bg-grad-primary rounded-full flex items-center justify-center shadow-md">
                  <User size={16} className="text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-text-hi">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-text-lo">{user?.email}</div>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-elevated/90 backdrop-blur-md rounded-2xl shadow-xl py-2 z-50 border border-border">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-text-hi hover:bg-surface/50 hover:text-primary transition-all duration-200 rounded-xl mx-2"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User size={16} className="mr-3" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-text-hi hover:bg-surface/50 hover:text-primary transition-all duration-200 rounded-xl mx-2"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings size={16} className="mr-3" />
                    Settings
                  </Link>
                  {user?.isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center px-4 py-2 text-sm text-text-hi hover:bg-surface/50 hover:text-primary transition-all duration-200 rounded-xl mx-2"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <BarChart3 size={16} className="mr-3" />
                      Admin Panel
                    </Link>
                  )}
                  <hr className="my-2 border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-warning hover:bg-warning/10 hover:text-warning transition-all duration-200 rounded-xl mx-2"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-text-hi hover:text-primary transition-all duration-300"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-grad-primary text-white rounded-xl hover:shadow-lg transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-lo hover:text-text-hi focus:outline-none focus:ring-4 focus:ring-primary/20 rounded-xl p-2 transition-all duration-300"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden bg-surface/95 backdrop-blur-md border-t border-border">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                  isActive(path)
                    ? 'text-primary bg-primary/10 shadow-sm'
                    : 'text-text-lo hover:text-text-hi hover:bg-elevated/50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
            
            {/* Mobile Profile Links or Auth Links */}
            <hr className="my-4 border-border" />
            {isAuthenticated() ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-text-lo hover:text-text-hi hover:bg-elevated/50 transition-all duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  <User size={20} />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-text-lo hover:text-text-hi hover:bg-elevated/50 transition-all duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings size={20} />
                  <span>Settings</span>
                </Link>
                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-text-lo hover:text-text-hi hover:bg-elevated/50 transition-all duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    <BarChart3 size={20} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-base font-medium text-warning hover:bg-warning/10 hover:text-warning transition-all duration-300"
                >
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-text-lo hover:text-text-hi hover:bg-elevated/50 transition-all duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  <User size={20} />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium bg-grad-primary text-white hover:shadow-lg transition-all duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  <User size={20} />
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Overlay for profile dropdown */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
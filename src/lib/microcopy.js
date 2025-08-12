/**
 * Frontend Microcopy System
 * Consistent, friendly, premium tone for scholarship app
 * Tone: Calm, confident, helpful. Short sentences.
 */

// 8.1 Primary CTAs & Labels
export const MICROCOPY = {
  // Primary Buttons (≤ 3 words each)
  buttons: {
    uploadCV: "Upload CV",
    answerQuestions: "Answer Questions",
    findScholarships: "Find Scholarships",
    openLink: "Open Link",
    copyAll: "Copy All",
    resetFilters: "Reset Filters",
    startMatching: "Start Matching",
    viewResults: "View Results",
    saveProfile: "Save Profile",
    exportData: "Export Data",
    refreshData: "Refresh",
    applyNow: "Apply Now"
  },

  // Empty States (≤ 14 words)
  emptyStates: {
    noScholarships: "No scholarships match your profile yet. Try adjusting your filters.",
    noCV: "Upload your CV to get personalized scholarship recommendations.",
    noProfile: "Complete your profile to unlock tailored scholarship matches.",
    noResults: "No results found. Try different search criteria or keywords.",
    noApplications: "You haven't applied to any scholarships yet. Start exploring!",
    noNotifications: "All caught up! No new notifications at this time.",
    noHistory: "Your search history will appear here once you start exploring.",
    noFavorites: "Save scholarships you're interested in to see them here."
  },

  // Error Hints (≤ 14 words)
  errorHints: {
    uploadFailed: "Upload failed. Please check your file format and try again.",
    networkError: "Connection lost. Please check your internet and retry.",
    invalidFile: "Invalid file type. Please upload PDF, DOC, or DOCX files.",
    fileTooLarge: "File too large. Please upload files smaller than 10MB.",
    profileIncomplete: "Complete all required fields to continue matching scholarships.",
    sessionExpired: "Your session expired. Please log in again to continue.",
    serverError: "Something went wrong. Our team has been notified automatically.",
    validationError: "Please check your input and fix any highlighted errors."
  },

  // Form Labels & Placeholders
  forms: {
    email: "Email address",
    password: "Password",
    confirmPassword: "Confirm password",
    firstName: "First name",
    lastName: "Last name",
    university: "Current university",
    major: "Field of study",
    gpa: "GPA (optional)",
    graduationYear: "Expected graduation",
    nationality: "Nationality",
    searchPlaceholder: "Search scholarships, universities, or fields...",
    filterPlaceholder: "Filter by amount, deadline, or location..."
  },

  // Status Messages
  status: {
    processing: "Processing your request...",
    analyzing: "Analyzing your profile...",
    matching: "Finding perfect matches...",
    complete: "Analysis complete!",
    saved: "Changes saved successfully",
    copied: "Copied to clipboard",
    updated: "Profile updated",
    deleted: "Item removed"
  }
};

// 8.2 Loading & Success Toasts (≤ 9 words each)
export const TOASTS = {
  parsingStart: "Analyzing your CV...",
  parsingDone: "CV analysis complete!",
  matchStart: "Finding your perfect scholarships...",
  matchDone: "Scholarship matches ready!",
  copyDone: "Summary copied to clipboard",
  uploadStart: "Uploading your document...",
  uploadDone: "Upload successful!",
  saveStart: "Saving your profile...",
  saveDone: "Profile saved successfully!",
  exportStart: "Preparing your export...",
  exportDone: "Export ready for download!",
  refreshStart: "Refreshing scholarship data...",
  refreshDone: "Data updated successfully!"
};

// Helper functions for consistent messaging
export const getMicrocopy = (category, key) => {
  return MICROCOPY[category]?.[key] || key;
};

export const getToast = (key) => {
  return TOASTS[key] || 'Processing...';
};

// Validation messages
export const VALIDATION = {
  required: "This field is required",
  email: "Please enter a valid email address",
  password: "Password must be at least 8 characters",
  match: "Passwords don't match",
  fileType: "Please upload a PDF, DOC, or DOCX file",
  fileSize: "File must be smaller than 10MB",
  gpa: "GPA must be between 0.0 and 4.0",
  year: "Please select a valid graduation year"
};

// Success messages
export const SUCCESS = {
  login: "Welcome back!",
  register: "Account created successfully!",
  profileUpdate: "Profile updated successfully!",
  applicationSubmit: "Application submitted successfully!",
  passwordReset: "Password reset email sent!",
  emailVerified: "Email verified successfully!"
};

export default MICROCOPY;
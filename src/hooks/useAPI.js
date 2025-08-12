// 🪝 React Query Hooks for API Management - ScholarSeeker AI
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScholarSeekerAPI } from '../services/api.js';
import { OptimizedScholarSeekerAPI } from '../services/optimizedAPI.js';
import { toast } from 'react-hot-toast';

// Query Keys
export const QUERY_KEYS = {
  CONNECTION_TEST: 'connectionTest',
  PROFILE: 'profile',
  SCHOLARSHIPS: 'scholarships',
  TEMP_PROFILE: 'tempProfile'
};

/**
 * Hook for testing API connections
 */
export const useConnectionTest = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.CONNECTION_TEST],
    queryFn: ScholarSeekerAPI.testConnections,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    onError: (error) => {
      console.error('Connection test failed:', error);
      toast.error('Failed to test API connections');
    }
  });
};

/**
 * Hook for parsing CV files
 */
export const useCVParser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (cvFile) => ScholarSeekerAPI.parseCVFile(cvFile),
    onSuccess: (data) => {
      // Cache the parsed profile
      queryClient.setQueryData(
        [QUERY_KEYS.PROFILE, data.profileId], 
        data.profile
      );
      
      toast.success('CV parsed successfully!');
    },
    onError: (error) => {
      console.error('CV parsing failed:', error);
      toast.error(error.message || 'Failed to parse CV');
    }
  });
};

/**
 * Hook for processing questionnaire
 */
export const useQuestionnaire = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (responses) => ScholarSeekerAPI.processQuestionnaire(responses),
    onSuccess: (data) => {
      // Cache the processed profile
      queryClient.setQueryData(
        [QUERY_KEYS.PROFILE, data.profileId], 
        data.profile
      );
      
      toast.success('Profile created successfully!');
    },
    onError: (error) => {
      console.error('Questionnaire processing failed:', error);
      toast.error(error.message || 'Failed to process questionnaire');
    }
  });
};

/**
 * Hook for finding scholarships with optimization
 */
export const useScholarshipSearch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ profile, preferences = {} }) => {
      if (!profile) {
        throw new Error('Profile is required for scholarship search');
      }

      // Use optimized API with vector search + Gemini refinement
      const response = await OptimizedScholarSeekerAPI.findScholarshipsOptimized(profile, preferences);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to find scholarships');
      }

      return response;
    },
    onSuccess: (data, variables) => {
      // Cache scholarship results
      queryClient.setQueryData(
        [QUERY_KEYS.SCHOLARSHIPS, variables.profile?.id, variables.preferences], 
        data
      );
      
      const message = data.cached 
        ? `Found ${data.scholarships?.length || 0} scholarships (cached results)`
        : `Found ${data.scholarships?.length || 0} scholarships in ${data.processingTime}ms`;
      toast.success(message);
    },
    onError: (error) => {
      console.error('Scholarship search failed:', error);
      toast.error(error.message || 'Failed to find scholarships');
    }
  });
};

/**
 * Hook for getting cached profile data
 */
export const useProfile = (profileId, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFILE, profileId],
    queryFn: () => ScholarSeekerAPI.getTemporaryProfile(profileId),
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    ...options
  });
};

/**
 * Hook for getting cached scholarship results
 */
export const useScholarships = (profileId, filters = {}, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SCHOLARSHIPS, profileId, filters],
    queryFn: () => ScholarSeekerAPI.findScholarships(profileId, filters),
    enabled: !!profileId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    ...options
  });
};

/**
 * Hook for scholarship statistics
 */
export const useScholarshipStats = () => {
  return useQuery({
    queryKey: ['scholarship-stats'],
    queryFn: async () => {
      return await OptimizedScholarSeekerAPI.getScholarshipStats();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Custom hook for managing upload state
 */
export const useUploadState = () => {
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    file: null,
    error: null
  });

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      file: null,
      error: null
    });
  };

  const startUpload = (file) => {
    setUploadState({
      isUploading: true,
      progress: 0,
      file,
      error: null
    });
  };

  const updateProgress = (progress) => {
    setUploadState(prev => ({ ...prev, progress }));
  };

  const setError = (error) => {
    setUploadState(prev => ({ 
      ...prev, 
      isUploading: false, 
      error 
    }));
  };

  const completeUpload = () => {
    setUploadState(prev => ({ 
      ...prev, 
      isUploading: false, 
      progress: 100 
    }));
  };

  return {
    uploadState,
    resetUpload,
    startUpload,
    updateProgress,
    setError,
    completeUpload
  };
};

/**
 * Custom hook for managing search filters
 */
export const useSearchFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState({
    country: '',
    fieldOfStudy: '',
    degreeLevel: '',
    minAmount: '',
    maxAmount: '',
    deadline: '',
    ...initialFilters
  });

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value && value !== '');
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters
  };
};

/**
 * Custom hook for managing pagination
 */
export const usePagination = (totalItems, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const reset = () => {
    setCurrentPage(1);
  };
  
  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToNext,
    goToPrevious,
    reset,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1
  };
};

// Export all hooks as default
export default {
  useConnectionTest,
  useCVParser,
  useQuestionnaire,
  useScholarshipSearch,
  useProfile,
  useScholarships,
  useUploadState,
  useSearchFilters,
  usePagination
};
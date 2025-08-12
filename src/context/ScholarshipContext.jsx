import React, { createContext, useContext, useReducer } from 'react'

// Initial state
const initialState = {
  userProfile: {
    cvFile: null,
    cvText: '',
    fieldOfStudy: '',
    degreeLevel: '',
    gpa: '',
    nationality: '',
    targetCountries: [],
    financialNeed: '',
    extracurriculars: '',
    workExperience: '',
    languageSkills: [],
    researchInterests: '',
    careerGoals: ''
  },
  scholarships: [],
  isProcessing: false,
  processingStep: 0,
  error: null,
  currentStep: 0
}

// Action types
const ActionTypes = {
  SET_CV_FILE: 'SET_CV_FILE',
  SET_CV_TEXT: 'SET_CV_TEXT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_SCHOLARSHIPS: 'SET_SCHOLARSHIPS',
  SET_PROCESSING: 'SET_PROCESSING',
  SET_PROCESSING_STEP: 'SET_PROCESSING_STEP',
  SET_ERROR: 'SET_ERROR',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  RESET_STATE: 'RESET_STATE'
}

// Reducer function
function scholarshipReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_CV_FILE:
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          cvFile: action.payload
        }
      }
    
    case ActionTypes.SET_CV_TEXT:
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          cvText: action.payload
        }
      }
    
    case ActionTypes.UPDATE_PROFILE:
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          ...action.payload
        }
      }
    
    case ActionTypes.SET_SCHOLARSHIPS:
      return {
        ...state,
        scholarships: action.payload
      }
    
    case ActionTypes.SET_PROCESSING:
      return {
        ...state,
        isProcessing: action.payload
      }
    
    case ActionTypes.SET_PROCESSING_STEP:
      return {
        ...state,
        processingStep: action.payload
      }
    
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload
      }
    
    case ActionTypes.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload
      }
    
    case ActionTypes.RESET_STATE:
      return initialState
    
    default:
      return state
  }
}

// Create context
const ScholarshipContext = createContext()

// Provider component
export function ScholarshipProvider({ children }) {
  const [state, dispatch] = useReducer(scholarshipReducer, initialState)
  
  // Action creators
  const actions = {
    setCvFile: (file) => {
      dispatch({ type: ActionTypes.SET_CV_FILE, payload: file })
    },
    
    setCvText: (text) => {
      dispatch({ type: ActionTypes.SET_CV_TEXT, payload: text })
    },
    
    updateProfile: (profileData) => {
      dispatch({ type: ActionTypes.UPDATE_PROFILE, payload: profileData })
    },
    
    setScholarships: (scholarships) => {
      dispatch({ type: ActionTypes.SET_SCHOLARSHIPS, payload: scholarships })
    },
    
    setProcessing: (isProcessing) => {
      dispatch({ type: ActionTypes.SET_PROCESSING, payload: isProcessing })
    },
    
    setProcessingStep: (step) => {
      dispatch({ type: ActionTypes.SET_PROCESSING_STEP, payload: step })
    },
    
    setError: (error) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error })
    },
    
    setCurrentStep: (step) => {
      dispatch({ type: ActionTypes.SET_CURRENT_STEP, payload: step })
    },
    
    resetState: () => {
      dispatch({ type: ActionTypes.RESET_STATE })
    }
  }
  
  const value = {
    ...state,
    ...actions
  }
  
  return (
    <ScholarshipContext.Provider value={value}>
      {children}
    </ScholarshipContext.Provider>
  )
}

// Custom hook to use the context
export function useScholarship() {
  const context = useContext(ScholarshipContext)
  if (!context) {
    throw new Error('useScholarship must be used within a ScholarshipProvider')
  }
  return context
}

export default ScholarshipContext
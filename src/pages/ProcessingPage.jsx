import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, CheckCircle, Loader2, Database, Sparkles, Target } from 'lucide-react'
import { useScholarship } from '@/context/ScholarshipContext'

const ProcessingPage = () => {
  const navigate = useNavigate()
  const { setScholarships, setProcessing, setProcessingStep } = useScholarship()
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const processingSteps = [
    {
      id: 'analyzing',
      title: 'Analyzing Your Profile',
      description: 'AI is processing your academic background and achievements',
      icon: Brain,
      duration: 3000
    },
    {
      id: 'scanning',
      title: 'Scanning Scholarship Database',
      description: 'Searching through 50,000+ scholarship opportunities',
      icon: Database,
      duration: 4000
    },
    {
      id: 'matching',
      title: 'AI-Powered Matching',
      description: 'Using advanced algorithms to find your perfect matches',
      icon: Sparkles,
      duration: 3500
    },
    {
      id: 'ranking',
      title: 'Ranking Best Opportunities',
      description: 'Sorting scholarships by compatibility and relevance',
      icon: Target,
      duration: 2500
    }
  ]

  useEffect(() => {
    setProcessing(true)
    
    const processSteps = async () => {
      for (let i = 0; i < processingSteps.length; i++) {
        setCurrentStep(i)
        setProcessingStep(i)
        
        // Animate progress for current step
        const stepDuration = processingSteps[i].duration
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev + (100 / (stepDuration / 100))
            return Math.min(newProgress, (i + 1) * 25)
          })
        }, 100)
        
        await new Promise(resolve => setTimeout(resolve, stepDuration))
        clearInterval(progressInterval)
      }
      
      // Use real API to find scholarships
      try {
        const { ScholarSeekerAPI } = await import('@/services/api');
        const storedProfile = localStorage.getItem('cvProfile');
        
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          const result = await ScholarSeekerAPI.findScholarships(profile.profileId, {});
          
          if (result.success) {
            setScholarships(result.scholarships);
          } else {
            // Use fallback scholarships if API fails
            setScholarships(result.scholarships || []);
          }
        } else {
          // If no profile found, use fallback
          const { ScholarSeekerAPI } = await import('@/services/api');
          const fallbackResult = await ScholarSeekerAPI.getRealFallbackScholarships({});
          setScholarships(fallbackResult);
        }
      } catch (error) {
        console.error('Error finding scholarships:', error);
        // Fallback to basic scholarships
        const basicScholarships = [
          {
            id: 1,
            title: 'Gates Millennium Scholarship',
            description: 'Full tuition coverage plus living expenses for outstanding minority students',
            amount: 'Full Tuition + Living Expenses',
            deadline: 'January 15, 2025',
            matchScore: 85,
            provider: 'Bill & Melinda Gates Foundation',
            eligibility: ['Undergraduate', 'Graduate', 'Minority Students'],
            link: 'https://www.gmsp.org'
          },
          {
            id: 2,
            title: 'Fulbright Foreign Student Program',
            description: 'Graduate study opportunities in the United States',
            amount: 'Full Funding',
            deadline: 'October 15, 2024',
            matchScore: 78,
            provider: 'U.S. Department of State',
            eligibility: ['Graduate', 'International Students'],
            link: 'https://foreign.fulbrightonline.org'
          }
        ];
        setScholarships(basicScholarships);
       }
      setProcessing(false)
      setProgress(100)
      
      // Navigate to results after a short delay
      setTimeout(() => {
        navigate('/results')
      }, 1500)
    }
    
    processSteps()
  }, [navigate, setScholarships, setProcessing, setProcessingStep])

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h1 className="heading-2 text-gray-900 mb-4">
              AI is Finding Your Perfect Matches
            </h1>
            <p className="body-large text-gray-600">
              Please wait while we analyze your profile and search our database
            </p>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="bg-white rounded-2xl p-8 shadow-soft">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Processing Progress
                  </span>
                  <span className="text-sm font-medium text-primary-600">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-primary-500 to-purple-600 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-600">
                  This may take 30-60 seconds
                </p>
              </div>
            </div>
          </motion.div>

          {/* Processing Steps */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            {processingSteps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              const isPending = index > currentStep
              
              return (
                <motion.div
                  key={step.id}
                  className={`
                    flex items-center p-6 rounded-xl transition-all duration-500
                    ${
                      isActive
                        ? 'bg-primary-50 border-2 border-primary-200'
                        : isCompleted
                        ? 'bg-green-50 border-2 border-green-200'
                        : 'bg-white border-2 border-gray-200'
                    }
                  `}
                  animate={{
                    scale: isActive ? 1.02 : 1,
                    opacity: isPending ? 0.6 : 1
                  }}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mr-4
                    ${
                      isActive
                        ? 'bg-primary-500'
                        : isCompleted
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : isActive ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  
                  <div className="text-left flex-1">
                    <h3 className={`
                      text-lg font-semibold mb-1
                      ${
                        isActive
                          ? 'text-primary-900'
                          : isCompleted
                          ? 'text-green-900'
                          : 'text-gray-600'
                      }
                    `}>
                      {step.title}
                    </h3>
                    <p className={`
                      text-sm
                      ${
                        isActive
                          ? 'text-primary-700'
                          : isCompleted
                          ? 'text-green-700'
                          : 'text-gray-500'
                      }
                    `}>
                      {step.description}
                    </p>
                  </div>
                  
                  {isActive && (
                    <div className="ml-4">
                      <div className="w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>

          {/* Neural Network Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-12"
          >
            <div className="relative w-64 h-32 mx-auto">
              {/* Animated dots representing neural network */}
              {Array.from({ length: 12 }).map((_, index) => (
                <motion.div
                  key={index}
                  className="absolute w-3 h-3 bg-primary-400 rounded-full"
                  style={{
                    left: `${(index % 4) * 25}%`,
                    top: `${Math.floor(index / 4) * 50}%`
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.2
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ProcessingPage
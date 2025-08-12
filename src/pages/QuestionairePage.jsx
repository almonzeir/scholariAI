import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import Button from '@components/ui/Button'
import { useScholarship } from '@/context/ScholarshipContext'

const QuestionairePage = () => {
  const navigate = useNavigate()
  const { updateProfile, setCurrentStep } = useScholarship()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})

  const questions = [
    {
      id: 'fieldOfStudy',
      title: 'What is your field of study?',
      type: 'select',
      options: [
        'Computer Science',
        'Engineering',
        'Medicine',
        'Business',
        'Arts & Humanities',
        'Social Sciences',
        'Natural Sciences',
        'Mathematics',
        'Other'
      ]
    },
    {
      id: 'degreeLevel',
      title: 'What degree level are you pursuing?',
      type: 'radio',
      options: [
        'Bachelor\'s Degree',
        'Master\'s Degree',
        'PhD/Doctorate',
        'Professional Degree'
      ]
    },
    {
      id: 'gpa',
      title: 'What is your GPA or academic standing?',
      type: 'input',
      placeholder: 'e.g., 3.8/4.0 or First Class Honours'
    },
    {
      id: 'nationality',
      title: 'What is your nationality?',
      type: 'input',
      placeholder: 'e.g., United States, Canada, etc.'
    },
    {
      id: 'targetCountries',
      title: 'Which countries are you interested in studying in?',
      type: 'multiselect',
      options: [
        'United States',
        'Canada',
        'United Kingdom',
        'Australia',
        'Germany',
        'Netherlands',
        'Sweden',
        'Switzerland',
        'Other'
      ]
    }
  ]

  const handleAnswer = (value) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      // Submit and navigate to processing
      updateProfile(answers)
      setCurrentStep(1)
      navigate('/processing')
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const currentAnswer = answers[questions[currentQuestion]?.id]
  const isAnswered = currentAnswer && currentAnswer.length > 0
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="heading-2 text-gray-900 mb-4">
              Tell Us About Yourself
            </h1>
            <p className="body-large text-gray-600 max-w-2xl">
              Answer a few questions to help us find the perfect scholarship matches for you.
            </p>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-primary-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {questions[currentQuestion]?.title}
            </h2>

            {/* Input Field */}
            {questions[currentQuestion]?.type === 'input' && (
              <input
                type="text"
                className="form-input"
                placeholder={questions[currentQuestion]?.placeholder}
                value={currentAnswer || ''}
                onChange={(e) => handleAnswer(e.target.value)}
              />
            )}

            {/* Select Dropdown */}
            {questions[currentQuestion]?.type === 'select' && (
              <select
                className="form-select"
                value={currentAnswer || ''}
                onChange={(e) => handleAnswer(e.target.value)}
              >
                <option value="">Select an option...</option>
                {questions[currentQuestion]?.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {/* Radio Options */}
            {questions[currentQuestion]?.type === 'radio' && (
              <div className="space-y-3">
                {questions[currentQuestion]?.options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors duration-300"
                  >
                    <input
                      type="radio"
                      name={questions[currentQuestion]?.id}
                      value={option}
                      checked={currentAnswer === option}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-gray-900">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Multi-select Checkboxes */}
            {questions[currentQuestion]?.type === 'multiselect' && (
              <div className="space-y-3">
                {questions[currentQuestion]?.options.map((option) => {
                  const selectedOptions = currentAnswer || []
                  const isSelected = selectedOptions.includes(option)
                  
                  return (
                    <label
                      key={option}
                      className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors duration-300"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSelection = e.target.checked
                            ? [...selectedOptions, option]
                            : selectedOptions.filter(item => item !== option)
                          handleAnswer(newSelection)
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-gray-900">{option}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isAnswered}
            >
              {currentQuestion === questions.length - 1 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Find Scholarships
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionairePage
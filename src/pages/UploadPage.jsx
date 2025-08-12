import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import Button from '@components/ui/Button'
import { useScholarship } from '@/context/ScholarshipContext'

const UploadPage = () => {
  const navigate = useNavigate()
  const { setCvFile, setCvText, setCurrentStep } = useScholarship()
  const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, success, error
  const [errorMessage, setErrorMessage] = useState('')

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadStatus('uploading')
    setErrorMessage('')

    try {
      // Use real CV parsing API
      const { ScholarSeekerAPI } = await import('@/services/api')
      const result = await ScholarSeekerAPI.parseCVFile(file)
      
      if (result.success) {
        // Store the parsed profile data
        localStorage.setItem('cvProfile', JSON.stringify(result))
        
        setCvFile(file)
        setCvText(`Parsed CV data: ${result.profile.personalInfo?.name || 'Profile extracted'}`)
        setUploadStatus('success')
        setCurrentStep(1)
        
        // Navigate to processing after a short delay
        setTimeout(() => {
          navigate('/processing')
        }, 1500)
      } else {
        throw new Error('Failed to parse CV')
      }
    } catch (error) {
      console.error('CV Upload Error:', error)
      setUploadStatus('error')
      setErrorMessage(error.message || 'Failed to process your CV. Please try again.')
    }
  }, [setCvFile, setCvText, setCurrentStep, navigate])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

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
              Upload Your CV
            </h1>
            <p className="body-large text-gray-600 max-w-2xl">
              Let our AI analyze your academic background, skills, and achievements to find the perfect scholarship matches.
            </p>
          </motion.div>
        </div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
              ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : uploadStatus === 'success'
                  ? 'border-green-500 bg-green-50'
                  : uploadStatus === 'error'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            
            {uploadStatus === 'uploading' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Processing your CV...
                  </h3>
                  <p className="text-gray-600">
                    Extracting and analyzing your information
                  </p>
                </div>
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    CV Uploaded Successfully!
                  </h3>
                  <p className="text-gray-600">
                    Redirecting to analysis...
                  </p>
                </div>
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <div className="space-y-4">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload Failed
                  </h3>
                  <p className="text-red-600 mb-4">
                    {errorMessage}
                  </p>
                  <Button onClick={() => setUploadStatus('idle')}>
                    Try Again
                  </Button>
                </div>
              </div>
            )}
            
            {uploadStatus === 'idle' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isDragActive ? 'Drop your CV here' : 'Drag & drop your CV here'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    or click to browse files
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported format: PDF (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Alternative Option */}
          {uploadStatus === 'idle' && (
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                Don't have a CV ready?
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/questionnaire')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Fill out questionnaire instead
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default UploadPage
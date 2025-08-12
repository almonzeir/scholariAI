import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Award, 
  Calendar, 
  DollarSign, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  Star, 
  Users, 
  MapPin, 
  Clock,
  Download,
  Share2,
  Filter,
  SortDesc
} from 'lucide-react'
import { useScholarship } from '@/context/ScholarshipContext'
import Button from '@/components/ui/Button'

const ResultsPage = () => {
  const { scholarships, userProfile } = useScholarship()
  const [copiedId, setCopiedId] = useState(null)
  const [sortBy, setSortBy] = useState('matchScore')
  const [filterBy, setFilterBy] = useState('all')

  const handleCopyToClipboard = async (scholarship) => {
    const summary = `
🎓 ${scholarship.title}
💰 Amount: ${scholarship.amount}
📅 Deadline: ${scholarship.deadline}
🏢 Provider: ${scholarship.provider}
📝 Description: ${scholarship.description}
🔗 Apply: ${scholarship.link}

✨ Match Score: ${scholarship.matchScore}%
📋 Eligibility: ${scholarship.eligibility.join(', ')}
    `.trim()
    
    try {
      await navigator.clipboard.writeText(summary)
      setCopiedId(scholarship.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getMatchScoreLabel = (score) => {
    if (score >= 90) return 'Excellent Match'
    if (score >= 80) return 'Great Match'
    if (score >= 70) return 'Good Match'
    return 'Fair Match'
  }

  const sortedScholarships = [...scholarships].sort((a, b) => {
    switch (sortBy) {
      case 'matchScore':
        return b.matchScore - a.matchScore
      case 'deadline':
        return new Date(a.deadline) - new Date(b.deadline)
      case 'amount':
        return b.amount.localeCompare(a.amount)
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="heading-2 text-gray-900 mb-4">
            Your Scholarship Matches
          </h1>
          <p className="body-large text-gray-600 mb-6">
            We found {scholarships.length} scholarships that match your profile
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-4 shadow-soft">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {scholarships.filter(s => s.matchScore >= 90).length}
              </div>
              <div className="text-sm text-gray-600">Excellent Matches</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-soft">
              <div className="text-2xl font-bold text-green-600 mb-1">
                ${scholarships.reduce((sum, s) => {
                  const amount = s.amount.replace(/[^0-9]/g, '')
                  return sum + (amount ? parseInt(amount) : 50000)
                }, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-soft">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {Math.round(scholarships.reduce((sum, s) => sum + s.matchScore, 0) / scholarships.length)}%
              </div>
              <div className="text-sm text-gray-600">Avg Match Score</div>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="flex-1 flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="matchScore">Sort by Match Score</option>
              <option value="deadline">Sort by Deadline</option>
              <option value="amount">Sort by Amount</option>
            </select>
            
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Scholarships</option>
              <option value="excellent">Excellent Matches (90%+)</option>
              <option value="great">Great Matches (80%+)</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </Button>
          </div>
        </motion.div>

        {/* Scholarship Cards */}
        <div className="grid gap-6">
          {sortedScholarships.map((scholarship, index) => (
            <motion.div
              key={scholarship.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden"
            >
              <div className="p-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="heading-3 text-gray-900">
                        {scholarship.title}
                      </h3>
                      <div className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${getMatchScoreColor(scholarship.matchScore)}
                      `}>
                        {scholarship.matchScore}% Match
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {scholarship.description}
                    </p>
                    
                    <div className="text-sm text-gray-500 mb-4">
                      <span className="font-medium">Provider:</span> {scholarship.provider}
                    </div>
                  </div>
                  
                  <div className="lg:ml-8 mt-4 lg:mt-0">
                    <div className={`
                      inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
                      ${getMatchScoreColor(scholarship.matchScore)}
                    `}>
                      <Star className="w-4 h-4 mr-2" />
                      {getMatchScoreLabel(scholarship.matchScore)}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Award Amount</div>
                      <div className="font-semibold text-gray-900">
                        {scholarship.amount}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Deadline</div>
                      <div className="font-semibold text-gray-900">
                        {scholarship.deadline}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Eligibility</div>
                      <div className="font-semibold text-gray-900">
                        {scholarship.eligibility.slice(0, 2).join(', ')}
                        {scholarship.eligibility.length > 2 && ` +${scholarship.eligibility.length - 2} more`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Eligibility Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {scholarship.eligibility.map((criteria, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {criteria}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    onClick={() => window.open(scholarship.link, '_blank')}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Apply Now
                  </Button>
                  
                  <Button
                    variant={copiedId === scholarship.id ? 'success' : 'outline'}
                    size="lg"
                    onClick={() => handleCopyToClipboard(scholarship)}
                    disabled={copiedId === scholarship.id}
                  >
                    {copiedId === scholarship.id ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mr-2" />
                        Copy Summary
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Match Score Indicator */}
              <div className="h-2 bg-gray-100">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${scholarship.matchScore}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12 mb-8"
        >
          <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Apply?
            </h3>
            <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
              Don't wait! Some scholarships have early deadlines. Start your applications today and secure your educational future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg">
                <Download className="w-5 h-5 mr-2" />
                Download All Results
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                Search More Scholarships
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ResultsPage
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Upload, FileText, Sparkles, Users, Award, Globe } from 'lucide-react'
import AnimatedBackground from '@components/ui/AnimatedBackground'
import FloatingElements from '@components/ui/FloatingElements'
import Button from '@components/ui/Button'
import FeatureCard from '@components/ui/FeatureCard'
import StatCard from '@components/ui/StatCard'

const HomePage = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: Upload,
      title: 'Smart CV Analysis',
      description: 'Upload your CV and let our AI extract and analyze your academic background, skills, and achievements.'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Matching',
      description: 'Advanced algorithms match you with scholarships based on your unique profile and goals.'
    },
    {
      icon: Award,
      title: 'Curated Results',
      description: 'Get 20-30 highly relevant scholarship opportunities ranked by compatibility score.'
    },
    {
      icon: Globe,
      title: 'Global Opportunities',
      description: 'Access scholarships from universities and organizations worldwide.'
    }
  ]

  const stats = [
    { number: '50,000+', label: 'Scholarships in Database' },
    { number: '10,000+', label: 'Students Helped' },
    { number: '95%', label: 'Match Accuracy' },
    { number: '24/7', label: 'AI Availability' }
  ]

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex items-center justify-center h-screen overflow-hidden">
        {/* 3D Video Background */}
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover filter brightness-50 z-0 pointer-events-none"
        >
          <source src="/picture/scholarship-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Semi-transparent Overlay */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        
        {/* Hero Content Container */}
        <div className="relative z-20 container mx-auto px-6 text-center max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight drop-shadow-lg text-white"
          >
            Find Your <span className="text-indigo-400">Fully Funded Scholarship</span><br /> 
            Instantly with AI
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 text-gray-300 text-lg sm:text-xl"
          >
            Upload your CV or answer a few quick questions — we'll handle the rest.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 flex flex-col sm:flex-row justify-center gap-4"
          >
            <button 
              onClick={() => navigate('/upload')}
              className="bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 text-white font-semibold px-8 py-3 rounded-full shadow-xl transition duration-300"
            >
              📄 Upload CV
            </button>
            <button 
              onClick={() => navigate('/questionnaire')}
              className="bg-transparent hover:bg-gray-800 active:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-600 text-white font-semibold px-8 py-3 rounded-full border border-gray-600 shadow-lg transition duration-300"
            >
              ✍️ Answer Questions
            </button>
          </motion.div>
          
          {/* Trust Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8 flex items-center justify-center text-gray-300 text-sm"
          >
            <Users className="w-4 h-4 mr-2" />
            Trusted by 10,000+ students worldwide
          </motion.div>
        </div>
      </section>
      
      {/* Animated Background for other sections */}
      <AnimatedBackground />
      
      {/* Floating Elements */}
      <FloatingElements />
      
      {/* Stats Section */}
      <section className="relative z-10 py-16 bg-gray-900">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 * index }}
              >
                <StatCard {...stat} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section - How It Works with 3D Background */}
      <section className="relative z-10 py-24 bg-black overflow-hidden">
        {/* Background Image */}
        <img 
          src="/picture/f48f4cac-325c-4b0d-a667-5bf070cd8f50.png" 
          alt="Scholarship 3D Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-20 z-0 pointer-events-none" 
        />
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="heading-2 text-white mb-4">
                How It Works
              </h2>
              <p className="body-large text-gray-300 max-w-2xl mx-auto">
                Our intelligent platform makes scholarship discovery effortless and precise
              </p>
            </motion.div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                viewport={{ once: true }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative z-10 py-24 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <GraduationCap className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Find Your Scholarship?
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Join thousands of students who have found their perfect funding match
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate('/upload')}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-50 font-semibold"
                >
                  Get Started Now
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
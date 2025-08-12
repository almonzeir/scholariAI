import { motion } from 'framer-motion'

const FeatureCard = ({ icon: Icon, title, description }) => {
  return (
    <motion.div
      className="card text-center group cursor-pointer"
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">
        {title}
      </h3>
      
      <p className="text-gray-300 leading-relaxed">
        {description}
      </p>
      
      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-purple-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  )
}

export default FeatureCard
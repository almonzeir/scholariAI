import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const StatCard = ({ number, label }) => {
  const [displayNumber, setDisplayNumber] = useState('0')
  
  useEffect(() => {
    // Extract numeric value for animation
    const numericValue = parseInt(number.replace(/[^0-9]/g, ''))
    const suffix = number.replace(/[0-9]/g, '')
    
    if (numericValue) {
      let current = 0
      const increment = numericValue / 50
      const timer = setInterval(() => {
        current += increment
        if (current >= numericValue) {
          setDisplayNumber(number)
          clearInterval(timer)
        } else {
          setDisplayNumber(Math.floor(current) + suffix)
        }
      }, 30)
      
      return () => clearInterval(timer)
    } else {
      setDisplayNumber(number)
    }
  }, [number])
  
  return (
    <motion.div
      className="text-center"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
        {displayNumber}
      </div>
      <div className="text-white/80 text-sm lg:text-base">
        {label}
      </div>
    </motion.div>
  )
}

export default StatCard
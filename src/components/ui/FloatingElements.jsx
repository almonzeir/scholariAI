import { motion } from 'framer-motion'
import { GraduationCap, BookOpen, Award, Star, Sparkles, Trophy } from 'lucide-react'

const FloatingElements = () => {
  const elements = [
    { Icon: GraduationCap, delay: 0, duration: 20, x: '10%', y: '20%' },
    { Icon: BookOpen, delay: 2, duration: 25, x: '80%', y: '15%' },
    { Icon: Award, delay: 4, duration: 18, x: '15%', y: '70%' },
    { Icon: Star, delay: 1, duration: 22, x: '85%', y: '60%' },
    { Icon: Sparkles, delay: 3, duration: 16, x: '50%', y: '80%' },
    { Icon: Trophy, delay: 5, duration: 24, x: '70%', y: '30%' }
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map(({ Icon, delay, duration, x, y }, index) => (
        <motion.div
          key={index}
          className="absolute text-white/20"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
            y: [0, -100, -200, -300],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            delay: delay,
            ease: 'easeInOut'
          }}
        >
          <Icon size={32} />
        </motion.div>
      ))}
      
      {/* Additional floating particles */}
      {Array.from({ length: 20 }).map((_, index) => (
        <motion.div
          key={`particle-${index}`}
          className="absolute w-2 h-2 bg-white/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{
            y: [0, -100, -200],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  )
}

export default FloatingElements
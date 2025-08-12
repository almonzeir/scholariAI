import { motion } from 'framer-motion'

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-700 to-primary-800" />
      
      {/* Animated Gradient Overlay */}
      <motion.div
        className="absolute inset-0 opacity-70"
        style={{
          background: 'linear-gradient(-45deg, #667eea, #764ba2, #667eea, #764ba2)',
          backgroundSize: '400% 400%'
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {/* Floating Orbs */}
      <div className="absolute inset-0">
        {/* Large Orb */}
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-white/10 to-white/5 blur-3xl"
          style={{ top: '10%', left: '10%' }}
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* Medium Orb */}
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-gold-400/20 to-gold-600/10 blur-2xl"
          style={{ top: '60%', right: '15%' }}
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2
          }}
        />
        
        {/* Small Orb */}
        <motion.div
          className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-purple-400/30 to-purple-600/20 blur-xl"
          style={{ top: '30%', right: '30%' }}
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4
          }}
        />
      </div>
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
    </div>
  )
}

export default AnimatedBackground
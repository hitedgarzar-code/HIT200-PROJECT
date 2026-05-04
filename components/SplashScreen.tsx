'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface SplashScreenProps {
  onComplete?: () => void
  duration?: number
}

export default function SplashScreen({ onComplete, duration = 20000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // 20 second splash screen duration
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, duration || 20000)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, delay: (duration || 20000) / 1000 - 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-primary via-primary-dark to-primary"
    >
      <div className="flex flex-col items-center justify-center">
        {/* Logo Circle */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: 'spring', stiffness: 100 }}
          className="mb-8"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-accent via-accent-light to-accent-dark rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-5xl md:text-6xl font-bold text-primary">e</span>
          </div>
        </motion.div>

        {/* Brand Name with Staggered Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            edg<span className="text-accent">AR</span>s
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl text-primary-foreground/80 font-light"
          >
            Premium Fashion Awaits
          </motion.p>
        </motion.div>

        {/* Animated Loading Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-12 flex items-center gap-2"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.5, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
              className="w-3 h-3 bg-accent rounded-full"
            />
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-16 text-center text-primary-foreground/70 text-sm md:text-base max-w-xs"
        >
          Redefining fashion with style and elegance
        </motion.p>
      </div>

      {/* Background Accent Lines */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-10 left-10 w-40 h-40 border border-accent/20 rounded-full" />
        <div className="absolute bottom-10 right-10 w-60 h-60 border border-accent/10 rounded-full" />
      </motion.div>
    </motion.div>
  )
}

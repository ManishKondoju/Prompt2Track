import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const TypewriterPrompts = () => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  const prompts = useMemo(() => [
    "Lofi hip hop for late night studying",
    "Epic orchestral soundtrack for movies",
    "Romantic jazz ballad with piano",
    "Energetic electronic dance music",
    "Acoustic folk song about nature",
    "Dark ambient cyberpunk soundscape",
    "Upbeat pop anthem for summer",
    "Classical piano piece in minor key",
    "Reggae vibes with steel drums",
    "Intense rock guitar with heavy drums",
    "Chill ambient meditation music",
    "Vintage 80s synthwave nostalgia",
    "Country ballad about heartbreak",
    "Experimental electronic glitch hop",
    "Soulful R&B with smooth vocals"
  ], []);

  useEffect(() => {
    const currentPrompt = prompts[currentIndex];
    
    if (isTyping) {
      if (charIndex < currentPrompt.length) {
        const timeout = setTimeout(() => {
          setCurrentText(currentPrompt.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, 50 + Math.random() * 50);
        
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        
        return () => clearTimeout(timeout);
      }
    } else {
      if (charIndex > 0) {
        const timeout = setTimeout(() => {
          setCurrentText(currentPrompt.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, 30);
        
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % prompts.length);
          setIsTyping(true);
        }, 500);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [currentIndex, charIndex, isTyping, prompts]);

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="relative"
      >
        <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-xl px-6 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
            
            <div className="flex-1 min-h-[1.5rem] flex items-center">
              <span 
                className="text-gray-300 text-lg font-medium"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {currentText}
              </span>
              
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="ml-1 text-blue-400 text-lg font-bold"
              >
                |
              </motion.span>
            </div>
            
            <svg 
              className="w-5 h-5 text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
              />
            </svg>
          </div>
        </div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="text-center text-gray-500 text-sm mt-3"
        >
          Try these prompts or create your own...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default TypewriterPrompts;
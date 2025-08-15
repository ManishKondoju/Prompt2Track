import React from 'react';
import { motion } from 'framer-motion';

// Minimal skeleton animation
const skeletonAnimation = {
  animate: {
    opacity: [0.4, 0.8, 0.4],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

// Minimal Music Player Skeleton
export const MusicPlayerSkeleton = () => (
  <div className="bg-[#181818] border border-gray-700 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center">
    {/* Album Cover Skeleton */}
    <motion.div 
      className="rounded-xl w-64 h-64 bg-gray-700 mb-6"
      {...skeletonAnimation}
    />
    
    {/* Title Skeleton */}
    <div className="text-center mb-4 w-full">
      <motion.div 
        className="h-6 bg-gray-700 rounded w-48 mx-auto mb-2"
        {...skeletonAnimation}
      />
      <motion.div 
        className="h-4 bg-gray-600 rounded w-32 mx-auto"
        {...skeletonAnimation}
        style={{ animationDelay: '0.2s' }}
      />
    </div>
    
    {/* Player Controls Skeleton */}
    <div className="w-full max-w-md flex flex-col items-center">
      <div className="flex items-center gap-4 mb-2 w-full">
        <motion.div 
          className="w-8 h-8 bg-gray-700 rounded-full"
          {...skeletonAnimation}
        />
        <motion.div 
          className="h-2 bg-gray-700 rounded flex-1"
          {...skeletonAnimation}
          style={{ animationDelay: '0.3s' }}
        />
        <motion.div 
          className="w-12 h-4 bg-gray-700 rounded"
          {...skeletonAnimation}
          style={{ animationDelay: '0.4s' }}
        />
      </div>
    </div>
    
    {/* Button Skeletons */}
    <motion.div 
      className="mt-4 h-12 bg-gray-700 rounded-full w-48"
      {...skeletonAnimation}
      style={{ animationDelay: '0.5s' }}
    />
    <motion.div 
      className="mt-3 h-12 bg-gray-700 rounded-md w-full max-w-md"
      {...skeletonAnimation}
      style={{ animationDelay: '0.6s' }}
    />
  </div>
);

// Minimal Album Cover Skeleton
export const AlbumCoverSkeleton = () => (
  <div className="bg-[#181818] border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
    {/* Header Skeleton */}
    <div className="p-4">
      <motion.div 
        className="h-6 bg-gray-700 rounded w-32"
        {...skeletonAnimation}
      />
    </div>
    
    {/* Image Skeleton */}
    <motion.div 
      className="w-full h-80 bg-gray-700"
      {...skeletonAnimation}
    />
    
    {/* Download Button Skeleton */}
    <div className="p-6">
      <motion.div 
        className="h-12 bg-gray-700 rounded-md"
        {...skeletonAnimation}
        style={{ animationDelay: '0.3s' }}
      />
    </div>
  </div>
);

// Combined Minimal Skeleton
export const FullGenerationSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="mt-16 w-full max-w-4xl mx-auto grid md:grid-cols-2 gap-10 px-6"
  >
    <MusicPlayerSkeleton />
    <AlbumCoverSkeleton />
  </motion.div>
);
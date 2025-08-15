import React, { useState, useRef } from 'react';

const ImmersivePlayer = ({ 
  audioUrl, 
  imageUrl, 
  title, 
  onClose, 
  onTryNext 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-blue-900 to-black overflow-hidden">
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-60 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
      >
        ✕
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center h-full p-8">
        
        {/* Album artwork */}
        <div className="mb-8">
          <img
            src={imageUrl}
            alt="Album Art"
            className="w-80 h-80 rounded-2xl shadow-2xl object-cover"
          />
        </div>

        {/* Song title */}
        <div className="text-center mb-8">
          <h1 
            className="text-4xl font-bold text-white mb-2"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {title || "Generated Song"}
          </h1>
          <p className="text-gray-300 text-lg">
            AI Generated Music
          </p>
        </div>

        {/* Audio element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => setIsPlaying(false)}
          hidden
        />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-lg p-6">
        
        {/* Progress bar */}
        <div className="flex items-center gap-3 text-white text-sm mb-4">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => {
              const newTime = parseFloat(e.target.value);
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }}
            className="flex-1 h-2 bg-white/20 rounded-full"
          />
          <span>{formatTime(duration)}</span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-8">
          
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="bg-white text-black w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200"
          >
            {isPlaying ? (
              <span className="text-2xl">⏸️</span>
            ) : (
              <span className="text-2xl">▶️</span>
            )}
          </button>

          {/* Try Next */}
          <button
            onClick={onTryNext}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full transition-all duration-200"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Try Next Song
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImmersivePlayer;
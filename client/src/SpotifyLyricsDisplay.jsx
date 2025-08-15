import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const SpotifyLyricsDisplay = ({ lyrics }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const lyricsContainerRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  
  // Parse lyrics into lines
  const parseLyrics = useCallback((lyricsText) => {
    if (!lyricsText) return [];
    
    const lines = lyricsText.split('\n');
    const parsedLines = [];
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const isSection = trimmedLine.match(/^\[.*\]$/);
        parsedLines.push({
          text: trimmedLine,
          isSection: !!isSection,
          id: `line-${parsedLines.length}`
        });
      }
    });
    
    console.log("✅ Parsed lyrics lines:", parsedLines.length);
    return parsedLines;
  }, []);

  const lyricsLines = parseLyrics(lyrics?.content);

  // Simple auto-scroll system - independent of audio
  const startAutoScroll = () => {
    console.log("🚀 Starting independent auto-scroll");
    console.log(`📝 Total lines to scroll: ${lyricsLines.length}`);
    
    // Clear any existing interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    setIsScrolling(true);
    setCurrentLineIndex(0); // Start from first line
    
    let lineIndex = 0;

    // Show first line immediately
    console.log(`🎵 Showing line ${lineIndex}: "${lyricsLines[lineIndex]?.text}"`);

    scrollIntervalRef.current = setInterval(() => {
      lineIndex++;
      
      if (lineIndex < lyricsLines.length) {
        console.log(`🎵 Auto-scroll to line ${lineIndex}: "${lyricsLines[lineIndex]?.text}"`);
        setCurrentLineIndex(lineIndex);
      } else {
        console.log("🏁 Reached end of lyrics, stopping auto-scroll");
        setIsScrolling(false);
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }, 3000); // Exactly 3 seconds per line

    console.log("✅ Auto-scroll interval started");
  };

  const stopAutoScroll = () => {
    console.log("⏸️ Stopping auto-scroll");
    setIsScrolling(false);
    
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
      console.log("✅ Auto-scroll stopped");
    }
  };

  const resetScroll = () => {
    console.log("🔄 Resetting auto-scroll");
    stopAutoScroll();
    setCurrentLineIndex(0);
  };

  // Auto-scroll container to keep current line in view
  useEffect(() => {
    if (lyricsContainerRef.current && lyricsLines.length > 0) {
      const currentElement = lyricsContainerRef.current.querySelector(`#line-${currentLineIndex}`);
      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        console.log(`📜 Scrolled to line ${currentLineIndex}`);
      }
    }
  }, [currentLineIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // Test function
  const testAdvance = () => {
    const nextLine = (currentLineIndex + 1) % lyricsLines.length;
    console.log(`🧪 Manual test: ${currentLineIndex} → ${nextLine}`);
    setCurrentLineIndex(nextLine);
  };

  if (!lyrics || !lyrics.content) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">🎤</div>
          <p className="text-lg mb-2">No lyrics available</p>
        </div>
      </div>
    );
  }

  if (lyricsLines.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-lg mb-2">Lyrics parsing failed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="spotify-lyrics-container h-96 overflow-hidden relative bg-gradient-to-b from-purple-900/30 to-blue-900/30 rounded-xl p-6">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>
      </div>
      
      {/* Song Info Header */}
      <div className="relative z-10 mb-4 text-center">
        <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {lyrics.title}
        </h3>
        <div className="flex justify-center gap-2 text-sm">
          <span className="bg-blue-500/30 text-blue-200 px-2 py-1 rounded-full text-xs">
            {lyrics.genre?.toUpperCase() || 'MUSIC'}
          </span>
          <span className="bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full text-xs">
            {lyrics.mood?.toUpperCase() || 'VIBES'}
          </span>
        </div>
      </div>

      {/* Minimal Control Buttons - Top Right */}
      <div className="absolute top-4 right-4 z-20 flex gap-1">
        <button
          onClick={resetScroll}
          className="bg-black/20 hover:bg-black/40 text-white w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm"
          title="Start over"
        >
          <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
        </button>
        <button
          onClick={isScrolling ? stopAutoScroll : startAutoScroll}
          className="bg-white/20 hover:bg-white/30 text-white w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm"
          title={isScrolling ? "Pause" : "Play"}
        >
          {isScrolling ? (
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Lyrics Display */}
      <div 
        ref={lyricsContainerRef}
        className="lyrics-scroll-container relative z-10 h-64 overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style jsx>{`
          .lyrics-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {lyricsLines.map((line, index) => (
          <motion.div
            key={line.id}
            id={`line-${index}`}
            animate={{
              opacity: index === currentLineIndex ? 1 : 0.4,
              scale: index === currentLineIndex ? 1.02 : 1,
              color: index === currentLineIndex ? '#ffffff' : '#6b7280'
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lyrics-line mb-6 text-center"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {line.isSection ? (
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold text-lg">
                {line.text}
              </span>
            ) : (
              <span className="text-lg leading-relaxed font-medium">
                {line.text}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SpotifyLyricsDisplay;
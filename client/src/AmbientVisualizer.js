import React, { useEffect, useState, useRef } from "react";

const musicSymbols = ["🎵", "🎶", "🎧", "✨", "🎼"];

const AmbientVisualizer = ({ mousePosition }) => {
  const [emoji, setEmoji] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!mousePosition.x && !mousePosition.y) return;

    const symbol = musicSymbols[Math.floor(Math.random() * musicSymbols.length)];
    setEmoji({
      id: Date.now(),
      x: mousePosition.x,
      y: mousePosition.y,
      symbol,
    });

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setEmoji(null), 600);
  }, [mousePosition]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {emoji && (
        <span
          key={emoji.id}
          className="shimmer-emoji"
          style={{
            position: "absolute",
            left: `${emoji.x}px`,
            top: `${emoji.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {emoji.symbol}
        </span>
      )}
    </div>
  );
};

export default AmbientVisualizer;

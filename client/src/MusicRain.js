// src/MusicRain.js
import React, { useEffect, useState } from "react";

const symbols = ["♩", "♪", "♫", "♬"];

const MusicRain = () => {
  const [drops, setDrops] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newDrop = {
        id: Date.now(),
        x: Math.random() * window.innerWidth,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
      };

      setDrops((prev) => [...prev, newDrop]);

      setTimeout(() => {
        setDrops((prev) => prev.filter((d) => d.id !== newDrop.id));
      }, 3000);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {drops.map((drop) => (
        <span
          key={drop.id}
          className="music-drop"
          style={{
            left: drop.x,
            top: 0,
            position: "absolute",
            animation: "fall 3s linear forwards",
          }}
        >
          {drop.symbol}
        </span>
      ))}
    </div>
  );
};

export default MusicRain;

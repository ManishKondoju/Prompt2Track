import React, { useRef, useEffect, useState } from "react";

const symbols = ["🎵", "🎶", "🎧", "🎼", "🎷", "🎸", "🎹"];

const MusicTrail = () => {
  const containerRef = useRef(null);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now() + Math.random();

      const newParticle = {
        id,
        x,
        y,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        size: Math.random() * 12 + 16,
        opacity: 1,
        rotation: Math.random() * 360,
      };

      setParticles((prev) => [...prev, newParticle]);

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 1200); // fade out after 1.2s
    };

    const node = containerRef.current;
    node.addEventListener("mousemove", handleMouseMove);

    return () => {
      node.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animation: "fadeMusic 1.2s ease-out forwards",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
};

export default MusicTrail;

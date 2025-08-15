import { useEffect, useState } from "react";

const musicEmojis = ["🎵", "🎶", "🎼", "🎧", "🎷", "🎸", "🎹", "🥁"];

const MusicTrail = () => {
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const id = Date.now() + Math.random();
      const newNote = {
        id,
        x: e.clientX,
        y: e.clientY,
        emoji: musicEmojis[Math.floor(Math.random() * musicEmojis.length)],
      };

      setTrail((prev) => [...prev, newNote]);

      setTimeout(() => {
        setTrail((prev) => prev.filter((note) => note.id !== id));
      }, 1000); // Emoji disappears after 1 second
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      {trail.map((note) => (
        <span
          key={note.id}
          className="pointer-events-none fixed z-[9999] text-2xl"
          style={{
            left: note.x,
            top: note.y,
            animation: "fadeMusic 1s ease-out forwards",
            transform: "translate(-50%, -50%)",
            color: "#ffffff", // Bright white for visibility on dark background
          }}
        >
          {note.emoji}
        </span>
      ))}
    </>
  );
};

export default MusicTrail;

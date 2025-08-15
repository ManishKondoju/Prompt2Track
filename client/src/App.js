import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import MusicTrail from "./MusicTrail";
import MusicRain from "./MusicRain";
import SpotifyLyricsDisplay from "./SpotifyLyricsDisplay";
import { FullGenerationSkeleton } from "./SkeletonLoaders";
import AmbientVisualizer from "./AmbientVisualizer";
import TypewriterPrompts from "./TypewriterPrompts";
import "./index.css";

const EXAMPLES = [
  "Lofi chill at sunset",
  "Jazz café on a rainy evening",
  "Ambient meditation in space",
  "Epic orchestral fantasy track",
  "Retro 80s synthwave night drive",
];

// Extended surprise prompts for random generation
const SURPRISE_PROMPTS = [
  // Emotional & Atmospheric
  "Melancholic piano ballad in a abandoned cathedral",
  "Uplifting electronic anthem for summer festivals",
  "Dark ambient soundscape with ethereal vocals",
  "Nostalgic indie folk song about childhood memories",
  "Energetic punk rock with rebellious spirit",
  
  // Genre Fusion
  "Jazz-fusion meets synthwave cyberpunk vibes",
  "Celtic folk mixed with modern trap beats",
  "Classical orchestra with electronic glitch elements",
  "Reggae-influenced lo-fi hip hop chill",
  "Medieval fantasy music with rock guitars",
  
  // Cinematic & Story-driven
  "Epic movie soundtrack for space exploration",
  "Mysterious detective noir jazz with saxophone",
  "Romantic waltz in a moonlit garden",
  "Post-apocalyptic industrial with haunting melodies",
  "Upbeat adventure theme for video game heroes",
  
  // Unique Concepts
  "Music box melody transformed into dubstep drop",
  "Underwater ambient with whale song harmonies",
  "Desert caravan music with modern production",
  "Neon-lit city rain with emotional vocals",
  "Ancient temple chants with future bass",
  
  // Mood-based
  "Cozy coffee shop acoustic guitar morning",
  "Intense workout motivation electronic beats",
  "Peaceful meditation with nature sounds",
  "Dramatic thunderstorm classical composition",
  "Joyful celebration with world music instruments",
  
  // Time & Place
  "1920s speakeasy jazz with modern twist",
  "Futuristic space disco dance party",
  "Victorian-era ballroom meets EDM",
  "Wild west saloon piano goes electronic",
  "Ancient Egyptian themes with trap production"
];

/* ---------- Color helpers ---------- */
function clamp(v, lo = 0, hi = 255) { return Math.min(hi, Math.max(lo, v)); }
function rgbString({ r, g, b }) { return `rgb(${r}, ${g}, ${b})`; }
function rgbaString({ r, g, b }, a = 1) { return `rgba(${r}, ${g}, ${b}, ${a})`; }
/** Accepts rgb(...) string OR object, returns {r,g,b} */
function toRgbObj(color) {
  if (typeof color === "string" && color.startsWith("rgb")) {
    const nums = color.match(/\d+/g)?.map(Number) || [59,130,246];
    return { r: nums[0], g: nums[1], b: nums[2] };
  }
  if (typeof color === "object" && color) return color;
  return { r: 59, g: 130, b: 246 }; // default blue
}

/* ---------- Immersive Player ---------- */
const ImmersivePlayer = ({
  audioUrl,
  imageUrl,
  title,
  lyrics,
  onClose,
  onTryNext
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Store colors as objects {r,g,b}
  const [dominantColor, setDominantColor] = useState({ r: 59, g: 130, b: 246 });
  const [secondaryColor, setSecondaryColor] = useState({ r: 96, g: 165, b: 250 });

  const [showLyrics, setShowLyrics] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [lyricsPlaying, setLyricsPlaying] = useState(false);

  const audioRef = useRef(null);
  const lyricsIntervalRef = useRef(null);

  // Parse lyrics
  const parseLyrics = (lyricsText) => {
    if (!lyricsText) return [];
    const lines = lyricsText.split("\n");
    const parsed = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const isSection = /^\[.*\]$/.test(trimmed);
        parsed.push({ text: trimmed, isSection, id: `line-${parsed.length}` });
      }
    });
    return parsed;
  };
  const lyricsLines = parseLyrics(lyrics?.content);

  // Lyrics auto-scroll
  const startLyricsScroll = () => {
    if (lyricsIntervalRef.current) clearInterval(lyricsIntervalRef.current);
    setLyricsPlaying(true);
    setCurrentLineIndex(0);

    let lineIndex = 0;
    lyricsIntervalRef.current = setInterval(() => {
      lineIndex++;
      if (lineIndex < lyricsLines.length) {
        setCurrentLineIndex(lineIndex);
      } else {
        setLyricsPlaying(false);
        clearInterval(lyricsIntervalRef.current);
      }
    }, 3000);
  };
  const stopLyricsScroll = () => {
    setLyricsPlaying(false);
    if (lyricsIntervalRef.current) clearInterval(lyricsIntervalRef.current);
  };
  const resetLyricsScroll = () => {
    stopLyricsScroll();
    setCurrentLineIndex(0);
  };

  // ESC to close
  useEffect(() => {
    const onEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  // Extract vibrant dominant colors from album art
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      const freq = {};
      const pixelStep = 4; // sample every 4th pixel
      for (let i = 0; i < data.length; i += pixelStep * 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a > 200) {
          // reduce precision for simple clustering
          const rKey = Math.floor(r / 30) * 30;
          const gKey = Math.floor(g / 30) * 30;
          const bKey = Math.floor(b / 30) * 30;
          const key = `${rKey},${gKey},${bKey}`;
          freq[key] = (freq[key] || 0) + 1;
        }
      }
      let bestKey = null, bestCount = 0;
      for (const [k, n] of Object.entries(freq)) {
        if (n > bestCount) { bestCount = n; bestKey = k; }
      }
      if (bestKey) {
        const [r0, g0, b0] = bestKey.split(",").map(Number);
        const r = clamp(Math.max(40, r0));
        const g = clamp(Math.max(40, g0));
        const b = clamp(Math.max(40, b0));
        const light = { r: clamp(r + 30), g: clamp(g + 30), b: clamp(b + 30) };
        setDominantColor({ r, g, b });
        setSecondaryColor(light);
      } else {
        setDominantColor({ r: 59, g: 130, b: 246 });
        setSecondaryColor({ r: 96, g: 165, b: 250 });
      }
    };
    img.onerror = () => {
      setDominantColor({ r: 59, g: 130, b: 246 });
      setSecondaryColor({ r: 96, g: 165, b: 250 });
    };
    img.src = imageUrl;
  }, [imageUrl]);

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

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const dom = toRgbObj(dominantColor);
  const sec = toRgbObj(secondaryColor);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden transition-all duration-1000"
      style={{ background: rgbString(dom) }}
    >
      {/* Single soft gradient overlay */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: `
            radial-gradient(circle at center, ${rgbaString(dom, 0)} 20%, ${rgbaString(dom, 0.2)} 80%),
            linear-gradient(45deg, ${rgbaString(sec, 0.13)}, transparent 50%, ${rgbaString(dom, 0.13)})
          `
        }}
      />

      {/* Top controls */}
      <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-center">
        {lyrics && (
          <button
            onClick={() => setShowLyrics(!showLyrics)}
            className="bg-black/30 hover:bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm"
            title={showLyrics ? "Hide lyrics" : "Show lyrics"}
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M3 17h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-4h18V5H3v2z"/>
            </svg>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="bg-black/30 hover:bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm ml-auto"
          title="Close"
        >
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex h-full">
        {/* Album art */}
        <div className={`flex flex-col items-center justify-center transition-all duration-500 ${showLyrics ? "w-1/2" : "w-full"} p-8`}>
          <div className="mb-8 relative">
            <img
              src={imageUrl}
              alt="Album Art"
              className={`rounded-2xl shadow-2xl object-cover relative z-10 transition-all duration-500 ${showLyrics ? "w-64 h-64" : "w-80 h-80"}`}
              style={{
                boxShadow: `
                  0 25px 50px -12px ${rgbaString(dom, 0.53)},
                  0 0 100px ${rgbaString(dom, 0.4)},
                  0 0 200px ${rgbaString(dom, 0.2)}
                `
              }}
            />
            {/* Soft glow */}
            <div
              className="absolute inset-0 rounded-2xl blur-3xl opacity-60 -z-10"
              style={{
                background: `
                  radial-gradient(ellipse, ${rgbaString(dom, 0.53)}, ${rgbaString(dom, 0.27)}, transparent),
                  radial-gradient(circle at 30% 30%, ${rgbaString(sec, 0.4)}, transparent 70%)
                `,
                transform: "scale(1.3)"
              }}
            />
            <div
              className="absolute inset-0 rounded-2xl blur-2xl opacity-40 -z-20"
              style={{ background: rgbString(dom), transform: "scale(1.6)" }}
            />
          </div>

          {/* Title */}
          <div className="text-center mb-8 relative z-10">
            <h1
              className={`font-bold text-white mb-2 drop-shadow-lg transition-all duration-500 ${showLyrics ? "text-2xl" : "text-4xl"}`}
              style={{
                fontFamily: "Montserrat, sans-serif",
                textShadow: `
                  0 4px 20px ${rgbaString(dom, 0.53)},
                  0 2px 10px ${rgbaString(sec, 0.4)},
                  0 0 30px ${rgbaString(dom, 0.27)}
                `
              }}
            >
              {title || "Generated Song"}
            </h1>
            <p className="text-gray-100 text-lg" style={{ textShadow: `0 2px 10px ${rgbaString(dom, 0.33)}` }}>
              AI Generated Music
            </p>
          </div>

          {/* Audio */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            onEnded={() => setIsPlaying(false)}
            hidden
          />
        </div>

        {/* Lyrics */}
        {showLyrics && lyrics && (
          <div className="w-1/2 p-8 relative overflow-hidden">
            <div
              className="absolute inset-0 rounded-2xl opacity-20"
              style={{ background: `linear-gradient(135deg, ${rgbaString(dom, 0.27)}, transparent)` }}
            />
            <div className="mb-6 text-center relative z-10">
              <h2
                className="text-2xl font-bold text-white mb-4"
                style={{ fontFamily: "Montserrat, sans-serif", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
              >
                {lyrics.title}
              </h2>
              <div className="flex justify-center gap-3 mb-4">
                <button
                  onClick={resetLyricsScroll}
                  className="bg-black/20 hover:bg-black/40 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                  </svg>
                </button>
                <button
                  onClick={() => (lyricsPlaying ? stopLyricsScroll() : startLyricsScroll())}
                  className="bg-black/20 hover:bg-black/40 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  {lyricsPlaying ? (
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Add `.no-scrollbar` in index.css if desired */}
            <div className="h-96 overflow-y-auto relative z-10 no-scrollbar">
              {lyricsLines.map((line, index) => (
                <motion.div
                  key={line.id}
                  animate={{
                    opacity: index === currentLineIndex ? 1 : 0.5,
                    scale: index === currentLineIndex ? 1.05 : 1,
                    color: index === currentLineIndex ? '#ffffff' : '#6b7280',
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="lyrics-line mb-6 text-center"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    textShadow: index === currentLineIndex ? "0 2px 10px rgba(0,0,0,0.5)" : "none",
                  }}
                >
                  {line.isSection ? (
                    <span
                      className="font-bold text-lg"
                      style={{ color: "#ffffff", textShadow: `0 2px 10px ${rgbaString(dom, 0.53)}` }}
                    >
                      {line.text}
                    </span>
                  ) : (
                    <span className="text-lg leading-relaxed font-medium">{line.text}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls (single) */}
      <div
        className="fixed bottom-0 left-0 right-0 p-6 bg-black/30 backdrop-blur-lg z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-white text-sm mb-4">
          <span className="drop-shadow-lg">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => {
              const newTime = parseFloat(e.target.value);
              if (audioRef.current) {
                audioRef.current.currentTime = newTime;
              }
              setCurrentTime(newTime);
            }}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, white 0%, white ${
                duration ? (currentTime / duration) * 100 : 0
              }%, rgba(255,255,255,0.3) ${
                duration ? (currentTime / duration) * 100 : 0
              }%, rgba(255,255,255,0.3) 100%)`
            }}
          />
          <span className="drop-shadow-lg">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-8">
          <button
            onClick={togglePlay}
            className="bg-white text-black w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 shadow-lg"
          >
            {isPlaying ? (
              <svg className="w-6 h-6 fill-black" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6 fill-black ml-1" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <button
            onClick={onTryNext}
            className="text-white px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 border-2 border-white/50 hover:border-white flex items-center gap-3 bg-black/30 hover:bg-black/50"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
            <span>Try Next Song</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- App ---------- */
function App() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(15);
  const [audioUrl, setAudioUrl] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(0);
  const [durationState, setDurationState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("player");
  const [showImmersivePlayer, setShowImmersivePlayer] = useState(false);
  const audioRef = useRef(null);

  const scrollToPromptInput = () => {
    const inputSection = document.querySelector('.prompt-input-section');
    if (inputSection) {
      inputSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt!");
      return;
    }
    setLoading(true);
    setAudioUrl(null);
    setImageUrl(null);
    setLyrics(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setError(null);
    setActiveTab("player");

    try {
      const res = await fetch("http://127.0.0.1:7860/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, duration }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      if (data.audio_url) {
        setAudioUrl(data.audio_url);
        setImageUrl(data.image_url || null);
        setLyrics(data.lyrics || null);
      } else {
        throw new Error("Invalid response: missing audio URL");
      }
    } catch (err) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError("⚠ Cannot connect to server. Is the FastAPI server running on port 7860?");
      } else if (err.message.includes("404")) {
        setError("⚠ Endpoint not found. Check if /generate endpoint exists.");
      } else if (err.message.includes("CORS")) {
        setError("⚠ CORS error. Check server CORS configuration.");
      } else {
        setError(`⚠ Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSurpriseMe = () => {
    const randomPrompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    setPrompt(randomPrompt);
  };

  const handleTryNext = () => {
    setShowImmersivePlayer(false);
    setAudioUrl(null);
    setImageUrl(null);
    setLyrics(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setActiveTab("player");
  };

  const downloadLyrics = () => {
    if (!lyrics) return;
    const element = document.createElement("a");
    const file = new Blob([lyrics.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${lyrics.title || "lyrics"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch("http://127.0.0.1:7860/");
        if (response.ok) console.log("✅ Server connection successful");
      } catch (err) {
        console.warn("⚠️ Server might not be running:", err.message);
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f0f] to-[#1a1a1a] text-white font-sans">
      {/* 🎧 Emoji Cursor */}
      <div
        className="fixed z-50 pointer-events-none select-none custom-cursor"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: "translate(-50%, -50%)",
          fontSize: "24px",
        }}
      >
        🎧
      </div>

      {/* Hero */}
      <div className="relative flex flex-col justify-center items-center text-center h-[100vh] px-6 overflow-hidden hero-pulse-bg">
        <AmbientVisualizer mousePosition={mousePosition} />
        <MusicRain />
        <MusicTrail />
        <div className="z-10">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-6xl md:text-8xl font-extrabold glow-text mb-4 animate-fade-in-up"
          >
            🎧 Prompt2Track
          </motion.h1>
        </div>
        <div className="z-10">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1 }}
            className="text-4xl md:text-5xl font-bold text-blue-300 animate-fade-in-up mb-4"
          >
            Turn prompts into complete songs.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="text-2xl md:text-3xl text-gray-400 max-w-3xl animate-fade-in-up mb-8"
          >
            Generate music, lyrics & cover art from a simple prompt.
          </motion.p>
        </div>

        {/* Typewriter Prompts Display */}
        <TypewriterPrompts />

        <div className="z-10">
          {/* Try Now Button */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToPromptInput}
            className="bg-gradient-to-r from-blue-500/20 via-purple-600/20 to-pink-500/20 hover:from-blue-500/30 hover:via-purple-600/30 hover:to-pink-500/30 border border-white/20 hover:border-white/30 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-3 mx-auto backdrop-blur-md group"
            style={{ 
              fontFamily: "Montserrat, sans-serif",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            }}
          >
            <svg 
              className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-lg">
              Try Now
            </span>
            <svg 
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Features (same background as hero) */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative overflow-hidden hero-pulse-bg w-full"
      >
        <div className="w-full max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h3
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "Montserrat, sans-serif", textShadow: "0 2px 12px rgba(0,0,0,0.35)" }}
            >
              Powered by Advanced AI
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Experience the future of music creation with cutting-edge artificial intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Music Generation */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-2"
            >
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                AI Music Generation
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Powered by Meta's MusicGen Large via Replicate. Generate professional-quality music in any genre from simple text prompts.
              </p>
            </motion.div>

            {/* Lyrics */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-2"
            >
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Smart Lyrics
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                AI-powered lyric generation with proper song structure. Auto-scrolling Spotify-style display with beautiful typography.
              </p>
            </motion.div>

            {/* Album Art */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-2"
            >
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Artistic Covers
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                DALL-E 3 powered album artwork generation. Beautiful, aesthetic covers that perfectly match your music's mood and style.
              </p>
            </motion.div>

            {/* Immersive */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-2"
            >
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Immersive Player
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Full-screen music experience with adaptive backgrounds that change color based on your album artwork.
              </p>
            </motion.div>
          </div>

          {/* Technical Specs (optional glass cards) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl py-4">
              <div className="text-3xl font-bold text-blue-400 mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                15-60s
              </div>
              <div className="text-gray-300 text-sm">Music Duration</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl py-4">
              <div className="text-3xl font-bold text-green-400 mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Stereo
              </div>
              <div className="text-gray-300 text-sm">High Quality Audio</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl py-4">
              <div className="text-3xl font-bold text-purple-400 mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                1024px
              </div>
              <div className="text-gray-300 text-sm">Album Art Resolution</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl py-4">
              <div className="text-3xl font-bold text-orange-400 mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>
                3 Modes
              </div>
              <div className="text-gray-300 text-sm">Player, Lyrics, Artwork</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Input */}
      <div className="w-full max-w-2xl mx-auto p-6 fade-on-scroll prompt-input-section">
        <input
          type="text"
          placeholder="e.g., Romantic ballad about lost love"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-3 rounded-lg bg-[#1a1a1a] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          className="w-full mt-4 p-3 rounded-lg bg-[#1a1a1a] border border-gray-700 text-white"
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
        >
          <option value="">Or choose a vibe...</option>
          {EXAMPLES.map((ex, idx) => (
            <option key={idx} value={ex}>{ex}</option>
          ))}
        </select>

        <div className="mt-4">
          <div className="flex gap-2 mb-3">
            <button onClick={() => setDuration(10)} className={`px-3 py-1 text-xs rounded ${duration === 10 ? "bg-blue-600" : "bg-gray-700"} hover:bg-blue-500 transition-colors`}>⚡ Quick (10s)</button>
            <button onClick={() => setDuration(15)} className={`px-3 py-1 text-xs rounded ${duration === 15 ? "bg-blue-600" : "bg-gray-700"} hover:bg-blue-500 transition-colors`}>🎵 Demo (15s)</button>
            <button onClick={() => setDuration(30)} className={`px-3 py-1 text-xs rounded ${duration === 30 ? "bg-blue-600" : "bg-gray-700"} hover:bg-blue-500 transition-colors`}>🎼 Full (30s)</button>
          </div>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-gray-400 mt-1">Duration: {duration} seconds (10-60s) - Default: 15s for speed</p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Surprise Me Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSurpriseMe}
          className="w-full mt-4 bg-gradient-to-r from-blue-500/20 via-purple-600/20 to-pink-500/20 hover:from-blue-500/30 hover:via-purple-600/30 hover:to-pink-500/30 border border-white/20 hover:border-white/30 text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
            />
          </svg>
          <span>
            Surprise Me
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Creating your song...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l6-6v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
              </svg>
              <span>Generate Music</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="animate-fade-in">
          <FullGenerationSkeleton />
        </div>
      )}

      {/* Output */}
      {audioUrl && (
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
          className="mt-16 w-full max-w-6xl mx-auto px-6 fade-on-scroll">
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-[#181818] rounded-lg p-1 border border-gray-700">
              <button onClick={() => setActiveTab("player")}
                className={`px-6 py-2 rounded-md transition-all duration-300 ${activeTab === "player" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                🎵 Player
              </button>
              {lyrics && (
                <button onClick={() => setActiveTab("lyrics")}
                  className={`px-6 py-2 rounded-md transition-all duration-300 ${activeTab === "lyrics" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                  🎤 Lyrics
                </button>
              )}
              {imageUrl && (
                <button onClick={() => setActiveTab("artwork")}
                  className={`px-6 py-2 rounded-md transition-all duration-300 ${activeTab === "artwork" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                  🎨 Artwork
                </button>
              )}
            </div>
          </div>

          {/* Player */}
          {activeTab === "player" && audioUrl && (
            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-[#181818] border border-gray-700 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Album Art" className="rounded-xl w-64 h-64 object-cover shadow-lg mb-6 transition-transform duration-500 hover:scale-105" />
                ) : (
                  <div className="rounded-xl w-64 h-64 bg-gray-700 mb-6 flex items-center justify-center">
                    <span className="text-gray-500 text-4xl">🎵</span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h2 className="text-white text-xl font-bold">{lyrics?.title || "Generated Song"}</h2>
                  <p className="text-gray-400 text-sm">AI Generated Music</p>
                </div>

                <div className="w-full max-w-md text-white flex flex-col items-center">
                  <div className="flex items-center gap-4 mb-2 w-full">
                    <button onClick={togglePlay}>
                      {isPlaying ? (
                        <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      ) : (
                        <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      )}
                    </button>
                    <span className="text-sm text-gray-400">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min={0}
                      max={durationState || 0}
                      value={currentTime}
                      onChange={(e) => {
                        const t = parseFloat(e.target.value);
                        if (audioRef.current) audioRef.current.currentTime = t;
                        setCurrentTime(t);
                      }}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-400">{formatTime(durationState)}</span>
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                  onLoadedMetadata={() => setDurationState(audioRef.current?.duration || 0)}
                  onEnded={() => setIsPlaying(false)}
                  hidden
                />

                <button
                  onClick={() => setShowImmersivePlayer(true)}
                  className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                  Immersive View
                </button>

                <a
                  href={audioUrl}
                  download={`${lyrics?.title || "generated-music"}.wav`}
                  className="mt-4 block bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-md font-semibold transition-all duration-300 hover:scale-105"
                >
                  ⬇️ Download Audio
                </a>
              </div>

              {/* Info */}
              <div className="bg-[#181818] border border-gray-700 rounded-2xl shadow-xl p-6">
                <h2 className="text-white text-xl font-bold mb-4">🎵 Track Info</h2>
                <div className="space-y-3 text-gray-300">
                  <div><span className="text-gray-500 text-sm">Original Prompt:</span><p className="text-white">{prompt}</p></div>
                  <div><span className="text-gray-500 text-sm">Duration:</span><p className="text-white">{duration} seconds</p></div>
                  <div><span className="text-gray-500 text-sm">Generated:</span><p className="text-white">{new Date().toLocaleTimeString()}</p></div>
                </div>
              </div>
            </div>
          )}

          {/* Lyrics */}
          {activeTab === "lyrics" && lyrics && (
            <div className="max-w-4xl mx-auto">
              <SpotifyLyricsDisplay lyrics={lyrics} isPlaying={isPlaying} currentTime={currentTime} audioRef={audioRef} />
              <div className="mt-6 text-center">
                <button
                  onClick={downloadLyrics}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full flex items-center gap-2 mx-auto transition-all duration-300 hover:scale-105"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  ⬇️ Download Lyrics
                </button>
              </div>
            </div>
          )}

          {/* Artwork */}
          {activeTab === "artwork" && imageUrl && (
            <div className="bg-[#181818] border border-gray-700 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
              <div className="p-6"><h2 className="text-white text-xl font-bold mb-4">🖼️ Album Artwork</h2></div>
              <img src={imageUrl} alt="Album Art" className="w-full h-auto" />
              <div className="p-6">
                <a
                  href={imageUrl}
                  download={`${lyrics?.title || "album-cover"}.png`}
                  className="block bg-blue-600 hover:bg-blue-700 text-white text-center py-3 font-semibold rounded-md"
                >
                  ⬇️ Download High Quality
                </a>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Immersive overlay */}
      {showImmersivePlayer && audioUrl && (
        <ImmersivePlayer
          audioUrl={audioUrl}
          imageUrl={imageUrl}
          title={lyrics?.title || "Generated Song"}
          lyrics={lyrics}
          onClose={() => setShowImmersivePlayer(false)}
          onTryNext={handleTryNext}
        />
      )}
    </div>
  );
}

export default App;
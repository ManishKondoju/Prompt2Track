// src/App.js
import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

import MusicTrail from "./MusicTrail";
import MusicRain from "./MusicRain";
import SpotifyLyricsDisplay from "./SpotifyLyricsDisplay";
import { FullGenerationSkeleton } from "./SkeletonLoaders";
import AmbientVisualizer from "./AmbientVisualizer";
import TypewriterPrompts from "./TypewriterPrompts";
import ImmersivePlayer from "./ImmersivePlayer";
import GeneratedAudios from "./GeneratedAudios";
import GeneratedImages from "./GeneratedImages";


import "./index.css";

// Lottie
import LottieFx from "./LottieFx";
import heroAurora from "./lottie/hero-aurora.json";
import btnSpark from "./lottie/btn-spark.json";
import loadingVinyl from "./lottie/loading-vinyl.json";
import successConfetti from "./lottie/success-confetti.json";

const EXAMPLES = [
  "Lofi chill at sunset",
  "Jazz café on a rainy evening",
  "Ambient meditation in space",
  "Epic orchestral fantasy track",
  "Retro 80s synthwave night drive",
];

const SURPRISE_PROMPTS = [
  "Melancholic piano ballad in a abandoned cathedral",
  "Uplifting electronic anthem for summer festivals",
  "Dark ambient soundscape with ethereal vocals",
  "Nostalgic indie folk song about childhood memories",
  "Energetic punk rock with rebellious spirit",
  "Jazz-fusion meets synthwave cyberpunk vibes",
  "Celtic folk mixed with modern trap beats",
  "Classical orchestra with electronic glitch elements",
  "Reggae-influenced lo-fi hip hop chill",
  "Medieval fantasy music with rock guitars",
  "Epic movie soundtrack for space exploration",
  "Mysterious detective noir jazz with saxophone",
  "Romantic waltz in a moonlit garden",
  "Post-apocalyptic industrial with haunting melodies",
  "Upbeat adventure theme for video game heroes",
];

/** ✅ Loading overlay (Equalizer + Pipeline) */
const LoadingOverlay = ({ open, reducedMotion, prompt }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0); // 0=music,1=cover,2=lyrics

  useEffect(() => {
    if (!open) {
      setProgress(0);
      setStage(0);
      return;
    }

    const start = Date.now();
    const t = setInterval(() => {
      const elapsed = Date.now() - start;
      const base = 1 - Math.exp(-elapsed / 900); // 0..1
      const p = Math.min(92, Math.floor(base * 92));
      setProgress(p);

      if (p >= 70) setStage(2);
      else if (p >= 35) setStage(1);
      else setStage(0);
    }, 120);

    return () => clearInterval(t);
  }, [open]);

  if (!open) return null;

  const steps = [
    { title: "Generating music", subtitle: "Composing audio track" },
    { title: "Creating cover art", subtitle: "Painting the vibe" },
    { title: "Writing lyrics", subtitle: "Structuring the story" },
  ];

  const StepDot = ({ idx }) => {
    const done = idx < stage;
    const active = idx === stage;

    return (
      <div className="flex items-start gap-3">
        <div
          className={[
            "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
            "border border-white/15 backdrop-blur-md",
            done
              ? "bg-emerald-500/20 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
              : active
              ? "bg-white/10 text-white shadow-[0_0_22px_rgba(59,130,246,0.35)]"
              : "bg-white/5 text-white/60",
          ].join(" ")}
        >
          {done ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 12-12-1.5-1.5L9 16.2z" />
            </svg>
          ) : active && !reducedMotion ? (
            <motion.div
              className="w-4 h-4 rounded-full bg-white/80"
              animate={{ scale: [1, 1.35, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-white/60" />
          )}
        </div>

        <div className="text-left">
          <div className={done ? "text-white" : active ? "text-white" : "text-white/70"}>
            <span className="text-sm font-semibold">{steps[idx].title}</span>
          </div>
          <div className="text-xs text-white/50 mt-0.5">{steps[idx].subtitle}</div>
        </div>
      </div>
    );
  };

  const promptText = prompt?.trim() ? prompt.trim() : "Generating music • cover art • lyrics";
  const clipped = promptText.slice(0, 74) + (promptText.length > 74 ? "…" : "");

  return (
    <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-xl flex items-center justify-center px-6">
      {!reducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-24 -left-28 w-[520px] h-[520px] rounded-full bg-blue-500/20 blur-3xl"
            animate={{ x: [0, 40, 0], y: [0, 25, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-28 -right-28 w-[560px] h-[560px] rounded-full bg-purple-500/20 blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/3 right-1/4 w-[460px] h-[460px] rounded-full bg-pink-500/15 blur-3xl"
            animate={{ x: [0, 25, 0], y: [0, -18, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      <div className="relative w-[720px] max-w-[95vw] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.55)] overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent" />

        <div className="relative p-10 md:p-12 text-center">
          {/* Equalizer bars */}
          <div className="flex items-end justify-center gap-2.5 mb-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-2.5 rounded-full bg-white/75"
                style={{ height: 18 }}
                animate={
                  reducedMotion
                    ? {}
                    : {
                        scaleY: [0.35, 1.25, 0.55, 1.05, 0.45],
                      }
                }
                transition={
                  reducedMotion
                    ? {}
                    : {
                        duration: 1.1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.08,
                      }
                }
              />
            ))}
          </div>

          <h3 className="text-3xl md:text-4xl font-bold text-white">{steps[stage].title}…</h3>
          <p className="text-white/65 text-base md:text-lg mt-3">{prompt?.trim() ? `“${clipped}”` : clipped}</p>

          {/* Pipeline */}
          <div className="mt-9 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            <StepDot idx={0} />
            <StepDot idx={1} />
            <StepDot idx={2} />
          </div>

          {/* Progress */}
          <div className="mt-10">
            <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            </div>
            <div className="mt-3 text-xs text-white/50 flex items-center justify-between">
              <span>Working…</span>
              <span>{progress}%</span>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/40">Tip: longer prompts can take a bit more time.</div>
        </div>
      </div>
    </div>
  );
};

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

  // Motion/Lottie behavior
  const prefersReducedMotion = useReducedMotion();
  const [btnSparkKey, setBtnSparkKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimerRef = useRef(null);

  // Deployment-safe URLs
  const API_BASE = (process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:7860").replace(/\/$/, "");
  const DEMO_VIDEO_URL = process.env.REACT_APP_DEMO_VIDEO_URL || "/video.mp4";

  const scrollToPromptInput = () => {
    const inputSection = document.querySelector(".prompt-input-section");
    if (inputSection) inputSection.scrollIntoView({ behavior: "smooth", block: "center" });
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
    setShowImmersivePlayer(false);

    // stop any currently playing audio
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
    }

    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, duration }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();

      if (data?.audio_url) {
        setAudioUrl(data.audio_url);
        setImageUrl(data.image_url || null);
        setLyrics(data.lyrics || null);

        // Confetti moment
        if (!prefersReducedMotion) {
          setShowConfetti(true);
          if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
          confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 1400);
        }
      } else {
        throw new Error("Invalid response: missing audio URL");
      }
    } catch (err) {
      if (err?.name === "TypeError" && String(err?.message || "").includes("fetch")) {
        setError(`Cannot connect to server. Currently using API: ${API_BASE}`);
      } else {
        setError(`Error: ${err?.message || "Unknown error"}`);
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

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
    }
  };

  const downloadLyrics = () => {
    if (!lyrics?.content) return;
    const a = document.createElement("a");
    const file = new Blob([lyrics.content], { type: "text/plain" });
    a.href = URL.createObjectURL(file);
    a.download = `${lyrics.title || "lyrics"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    return () => {
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    };
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
      {/* Success Confetti (play once) */}
      {showConfetti && !prefersReducedMotion && (
        <div className="fixed inset-0 z-[60] pointer-events-none">
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[560px] max-w-[95vw]">
            <LottieFx animationData={successConfetti} loop={false} />
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      <LoadingOverlay open={loading} reducedMotion={prefersReducedMotion} prompt={prompt} />

      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/10 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 ml-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.79-1.59-1.75V9.75c0-.96.71-1.75 1.59-1.75h2.24z"
                />
              </svg>
              <span
                className="text-xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Prompt2Track
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="https://github.com/ManishKondoju/Prompt2Track"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 font-medium text-sm"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>

              <a
                href="/documentation"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 font-medium text-sm"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                View Docs
              </a>
            </div>

            <div className="md:hidden">
              <button className="text-gray-300 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

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

      {/* Hero Section */}
      <div className="relative flex flex-col justify-center items-center text-center h-[100vh] px-6 overflow-hidden hero-pulse-bg pt-20">
        {!prefersReducedMotion && (
          <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
            <LottieFx animationData={heroAurora} loop className="w-full h-full" />
          </div>
        )}

        <AmbientVisualizer mousePosition={mousePosition} />
        <MusicRain />
        <MusicTrail />

        <div className="z-10">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-6xl md:text-8xl font-extrabold glow-text mb-4"
          >
            🎧 Prompt2Track
          </motion.h1>
        </div>

        <div className="z-10">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1 }}
            className="text-4xl md:text-5xl font-bold text-blue-300 mb-4"
          >
            Where prompts hit the right note.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="text-2xl md:text-3xl text-gray-400 max-w-3xl mb-8"
          >
            Generate music, lyrics & cover art from a simple prompt.
          </motion.p>
        </div>

        <TypewriterPrompts />

        <div className="z-10 mt-8">
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={scrollToPromptInput}
            className="bg-gradient-to-r from-blue-500/20 via-purple-600/20 to-pink-500/20 hover:from-blue-500/30 hover:via-purple-600/30 hover:to-pink-500/30 border border-white/20 hover:border-white/30 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-3 backdrop-blur-md"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-lg">Try Now</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative overflow-hidden hero-pulse-bg w-full"
      >
        <div className="w-full max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "Montserrat, sans-serif" }}>
              Powered by Advanced AI
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Experience the future of music creation with cutting-edge artificial intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center"
            >
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">AI Music Generation</h4>
              <p className="text-gray-300 text-sm">Powered by Meta's MusicGen Large via Replicate.</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center"
            >
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Smart Lyrics</h4>
              <p className="text-gray-300 text-sm">AI-powered lyric generation with proper song structure.</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center"
            >
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Artistic Covers</h4>
              <p className="text-gray-300 text-sm">DALL-E 3 powered album artwork generation.</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center"
            >
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Immersive Player</h4>
              <p className="text-gray-300 text-sm">Full-screen music experience with adaptive backgrounds.</p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Video Section */}
      <div className="w-full max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <motion.h3
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            See It In Action
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Watch how Prompt2Track transforms simple text into complete musical experiences
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative"
        >
          <div className="relative bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 rounded-2xl p-2 backdrop-blur-sm border border-white/10 shadow-2xl">
            <div className="relative overflow-hidden rounded-xl bg-black/30">
              <video className="w-full h-auto max-h-96 object-cover rounded-xl" autoPlay loop muted playsInline preload="auto">
                <source src={DEMO_VIDEO_URL} type="video/mp4" />
              </video>

              <div className="absolute bottom-4 right-4">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1">
                  <span className="text-white text-xs font-medium">Prompt2Track Demo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">🎥 Live demonstration of AI music generation</p>
          </div>
        </motion.div>
      </div>

      {/* Input Section */}
      <div className="w-full max-w-3xl mx-auto p-6 fade-on-scroll prompt-input-section">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-lg"></div>
          <input
            type="text"
            placeholder="Describe your perfect song... (e.g., Romantic jazz ballad with piano)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="relative w-full p-6 text-lg rounded-2xl bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 border border-white/20 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 backdrop-blur-xl text-white placeholder-gray-400 transition-all duration-300"
            style={{
              fontFamily: "Montserrat, sans-serif",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          />
        </div>

        <div className="relative mb-8">
          <select
            className="w-full p-4 text-lg rounded-xl bg-gradient-to-r from-gray-800/80 via-gray-700/80 to-gray-800/80 border border-white/15 text-gray-300 appearance-none cursor-pointer transition-all duration-300 hover:border-white/30 focus:border-blue-400/50 focus:outline-none backdrop-blur-lg hover:text-white focus:text-white"
            onChange={(e) => setPrompt(e.target.value)}
            value={prompt}
            style={{
              fontFamily: "Montserrat, sans-serif",
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 1rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.5em 1.5em",
              paddingRight: "3rem",
            }}
          >
            <option value="" className="bg-gray-800 text-gray-400">
              Or choose from curated vibes...
            </option>
            {EXAMPLES.map((ex, idx) => (
              <option key={idx} value={ex} className="bg-gray-800 text-gray-300">
                {ex}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-8">
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={() => setDuration(10)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                duration === 10
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg scale-105"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20"
              }`}
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick (10s)
            </button>

            <button
              onClick={() => setDuration(15)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                duration === 15
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20"
              }`}
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              Demo (15s)
            </button>

            <button
              onClick={() => setDuration(30)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                duration === 30
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20"
              }`}
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Full (30s)
            </button>
          </div>

          <div className="relative">
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #8B5CF6 ${((duration - 10) / 50) * 100}%, #374151 ${((duration - 10) / 50) * 100}%, #374151 100%)`,
              }}
            />
            <div className="flex justify-between text-sm text-gray-400 mt-3">
              <span>10s</span>
              <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full font-semibold text-white">
                {duration} seconds
              </span>
              <span>60s</span>
            </div>
          </div>
        </div>

        {error && (
          <motion.div className="mb-6 p-4 bg-red-900/30 border border-red-400/50 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
              <p className="text-red-200 font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            onClick={handleSurpriseMe}
            className="w-full bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 hover:from-indigo-600/40 hover:via-purple-600/40 hover:to-pink-600/40 border border-white/20 hover:border-white/40 text-white font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-md"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-lg">Surprise Me</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -3 }}
            onClick={handleGenerate}
            disabled={loading}
            onMouseEnter={() => !loading && !prefersReducedMotion && setBtnSparkKey((k) => k + 1)}
            className={`relative overflow-hidden w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold py-6 rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {!loading && !prefersReducedMotion && (
              <div className="absolute inset-0 pointer-events-none opacity-70">
                <LottieFx key={btnSparkKey} animationData={btnSpark} loop={false} />
              </div>
            )}

            {loading ? (
              <>
                {!prefersReducedMotion ? (
                  <div className="w-10 h-10 -my-1">
                    <LottieFx animationData={loadingVinyl} loop />
                  </div>
                ) : (
                  <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                <span className="text-xl">Creating your masterpiece...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l6-6v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                  />
                </svg>
                <span className="text-xl relative z-10">Generate Music</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
      <div className="mt-16">
  <GeneratedAudios />
</div>
<div className="mt-16">
  <GeneratedImages />
</div>


      {/* Skeleton under overlay (optional) */}
      {loading && (
        <div className="animate-fade-in">
          <FullGenerationSkeleton />
        </div>
      )}

      {audioUrl && (
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="mt-16 w-full max-w-6xl mx-auto px-6">
          <div className="flex justify-center mb-8">
            <div className="bg-[#181818] rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setActiveTab("player")}
                className={`px-6 py-2 rounded-md transition-all duration-300 ${
                  activeTab === "player" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                🎵 Player
              </button>

              {lyrics && (
                <button
                  onClick={() => setActiveTab("lyrics")}
                  className={`px-6 py-2 rounded-md transition-all duration-300 ${
                    activeTab === "lyrics" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  🎤 Lyrics
                </button>
              )}

              {imageUrl && (
                <button
                  onClick={() => setActiveTab("artwork")}
                  className={`px-6 py-2 rounded-md transition-all duration-300 ${
                    activeTab === "artwork" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  🎨 Artwork
                </button>
              )}
            </div>
          </div>

          {activeTab === "player" && (
            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-[#181818] border border-gray-700 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Album Art" className="rounded-xl w-64 h-64 object-cover shadow-lg mb-6" />
                ) : (
                  <div className="rounded-xl w-64 h-64 bg-gray-700 mb-6 flex items-center justify-center">
                    {!prefersReducedMotion ? (
                      <div className="w-40 h-40 opacity-90">
                        <LottieFx name="loading" loop />
                      </div>
                    ) : (
                      <span className="text-gray-500 text-4xl">🎵</span>
                    )}
                  </div>
                )}

                <div className="text-center mb-4">
                  <h2 className="text-white text-xl font-bold">{lyrics?.title || "Generated Song"}</h2>
                  <p className="text-gray-400 text-sm">AI Generated Music</p>
                </div>

                <div className="w-full max-w-md text-white flex flex-col items-center">
                  <div className="flex items-center gap-4 mb-2 w-full">
                    <button onClick={togglePlay} aria-label="toggle play">
                      {isPlaying ? (
                        <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
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
                  className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3z" />
                  </svg>
                  Immersive View
                </button>
              </div>

              <div className="bg-[#181818] border border-gray-700 rounded-2xl shadow-xl p-6">
                <h2 className="text-white text-xl font-bold mb-4">🎵 Track Info</h2>
                <div className="space-y-3 text-gray-300">
                  <div>
                    <span className="text-gray-500 text-sm">Original Prompt:</span>
                    <p className="text-white">{prompt}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Duration:</span>
                    <p className="text-white">{duration} seconds</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Generated:</span>
                    <p className="text-white">{new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "lyrics" && lyrics && (
            <div className="max-w-4xl mx-auto">
              <SpotifyLyricsDisplay lyrics={lyrics} />
              <div className="mt-6 text-center">
                <button
                  onClick={downloadLyrics}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full flex items-center gap-2 mx-auto transition-all duration-300 hover:scale-105"
                >
                  ⬇️ Download Lyrics
                </button>
              </div>
            </div>
          )}

          {activeTab === "artwork" && imageUrl && (
            <div className="bg-[#181818] border border-gray-700 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
              <div className="p-6">
                <h2 className="text-white text-xl font-bold mb-4">🖼️ Album Artwork</h2>
              </div>
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

      {showImmersivePlayer && audioUrl && (
        <ImmersivePlayer
          audioUrl={audioUrl}
          imageUrl={imageUrl}
          title={lyrics?.title || "Generated Song"}
          lyrics={lyrics}
          prefersReducedMotion={prefersReducedMotion}
          onClose={() => setShowImmersivePlayer(false)}
          onTryNext={handleTryNext}
        />
      )}
    </div>
  );
}

export default App;

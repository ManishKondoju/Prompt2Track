// ImmersivePlayer.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WavyOrb from "./WavyOrb";

function clamp(v, lo = 0, hi = 255) {
  return Math.min(hi, Math.max(lo, v));
}
function rgbString({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}
function rgbaString({ r, g, b }, a = 1) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export default function ImmersivePlayer({
  audioUrl,
  imageUrl,
  title,
  lyrics,
  onClose,
  onTryNext,
  prefersReducedMotion,
}) {
  const audioRef = useRef(null);
  const progressTrackRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);

  const [dominantColor, setDominantColor] = useState({ r: 30, g: 41, b: 59 });
  const [secondaryColor, setSecondaryColor] = useState({ r: 59, g: 130, b: 246 });
  const [colorsExtracted, setColorsExtracted] = useState(false);

  const [showLyrics, setShowLyrics] = useState(Boolean(lyrics));
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // ---------- Color extraction ----------
  useEffect(() => {
    let cancelled = false;
    setColorsExtracted(false);

    if (!imageUrl) {
      setColorsExtracted(true);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        if (cancelled) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxSize = 90;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);

        canvas.width = Math.max(1, Math.floor(img.width * ratio));
        canvas.height = Math.max(1, Math.floor(img.height * ratio));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const colorMap = new Map();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // ignore too transparent / too dark / too bright
          if (a < 120) continue;
          if (r < 18 && g < 18 && b < 18) continue;
          if (r > 242 && g > 242 && b > 242) continue;

          const rg = Math.floor(r / 14) * 14;
          const gg = Math.floor(g / 14) * 14;
          const bg = Math.floor(b / 14) * 14;
          const key = `${rg},${gg},${bg}`;
          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        let bestKey = "30,41,59";
        let bestCount = 0;
        for (const [k, c] of colorMap.entries()) {
          if (c > bestCount) {
            bestCount = c;
            bestKey = k;
          }
        }

        const [r, g, b] = bestKey.split(",").map(Number);
        const dr = clamp(r, 18, 190);
        const dg = clamp(g, 18, 190);
        const db = clamp(b, 18, 190);

        setDominantColor({ r: dr, g: dg, b: db });
        setSecondaryColor({
          r: clamp(dr + 75, 0, 255),
          g: clamp(dg + 75, 0, 255),
          b: clamp(db + 75, 0, 255),
        });
        setColorsExtracted(true);
      } catch {
        if (cancelled) return;
        setDominantColor({ r: 30, g: 41, b: 59 });
        setSecondaryColor({ r: 59, g: 130, b: 246 });
        setColorsExtracted(true);
      }
    };

    img.onerror = () => {
      if (cancelled) return;
      setDominantColor({ r: 30, g: 41, b: 59 });
      setSecondaryColor({ r: 59, g: 130, b: 246 });
      setColorsExtracted(true);
    };

    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  // ---------- Lyrics parsing ----------
  const lyricsLines = useMemo(() => {
    if (!lyrics?.content) return [];
    const lines = lyrics.content.split("\n");
    const out = [];
    for (const raw of lines) {
      const t = raw.trim();
      if (!t || t.startsWith("#")) continue;
      const isSection = /^\[.*\]$/.test(t);
      out.push({ id: `line-${out.length}`, text: t, isSection });
    }
    return out;
  }, [lyrics]);

  // Highlight lyric line based on playback progress (simple mapping)
  useEffect(() => {
    if (!isPlaying || !showLyrics || lyricsLines.length === 0) return;
    const id = setInterval(() => {
      const p = duration ? currentTime / duration : 0;
      const idx = Math.floor(p * lyricsLines.length);
      setCurrentLineIndex(Math.min(idx, lyricsLines.length - 1));
    }, 120);
    return () => clearInterval(id);
  }, [isPlaying, showLyrics, currentTime, duration, lyricsLines.length]);

  // ---------- Audio sync ----------
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setIsPlaying(true);
    } else {
      a.pause();
      setIsPlaying(false);
    }
  };

  const seekToClientX = (clientX) => {
    const track = progressTrackRef.current;
    const a = audioRef.current;
    if (!track || !a || !duration) return;
    const rect = track.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const pct = rect.width ? x / rect.width : 0;
    a.currentTime = pct * duration;
    setCurrentTime(a.currentTime);
  };

  const formatTime = (t) => {
    if (!Number.isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Keyboard shortcuts: Space toggle, Esc close, L toggle lyrics
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePlay();
        return;
      }
      if (e.key?.toLowerCase() === "l" && lyrics) {
        setShowLyrics((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lyrics, duration, currentTime, isPlaying]);

  const dom = dominantColor;
  const sec = secondaryColor;

  const bgStyle = {
    backgroundColor: colorsExtracted ? rgbString(dom) : "rgb(30, 41, 59)",
    backgroundImage: colorsExtracted
      ? `radial-gradient(circle at 25% 18%, ${rgbaString(sec, 0.85)} 0%, ${rgbString(dom)} 52%, ${rgbaString(
          { r: dom.r - 18, g: dom.g - 18, b: dom.b - 18 },
          1
        )} 100%)`
      : "radial-gradient(circle at 25% 18%, rgba(59,130,246,0.85) 0%, rgb(30,41,59) 55%, rgb(10,21,39) 100%)",
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  // ✅ A11Y required ARIA props for role="slider"
  const ariaNow = Math.floor(currentTime || 0);
  const ariaMin = 0;
  const ariaMax = Math.max(0, Math.floor(duration || 0));
  const ariaText = `${formatTime(currentTime)} of ${formatTime(duration)}`;

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden" style={bgStyle}>
      {/* soft blobs */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/5 w-[520px] h-[520px] rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: colorsExtracted ? rgbaString(sec, 0.35) : "rgba(59,130,246,0.35)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/5 w-[460px] h-[460px] rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: colorsExtracted ? rgbaString(dom, 0.45) : "rgba(30,41,59,0.45)" }}
        />
      </div>

      {/* Wavy orb accent (subtle) */}
      {!prefersReducedMotion && (
        <div className="absolute left-8 top-24 opacity-60 pointer-events-none">
          <WavyOrb size={140} />
        </div>
      )}

      {/* Top actions */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        {lyrics && (
          <button
            onClick={() => setShowLyrics((v) => !v)}
            className={`${
              showLyrics ? "bg-white/25" : "bg-black/25"
            } hover:bg-black/45 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm`}
            title="Toggle Lyrics (L)"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </button>
        )}

        <button
          onClick={onClose}
          className="bg-black/25 hover:bg-black/45 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 backdrop-blur-sm"
          title="Close (Esc)"
        >
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full px-6 pt-16 pb-28">
        <div className={`mx-auto w-full ${showLyrics && lyrics ? "max-w-7xl" : "max-w-3xl"}`}>
          <div className={`grid gap-8 ${showLyrics && lyrics ? "lg:grid-cols-[420px_1fr]" : "lg:grid-cols-1"}`}>
            {/* Left: cover + meta */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-center lg:text-left"
            >
              <div className="relative mx-auto lg:mx-0 w-[340px] h-[340px] md:w-[380px] md:h-[380px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/20 backdrop-blur-lg">
                {imageUrl ? (
                  <img src={imageUrl} alt="Album Art" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white/40 text-6xl">🎵</span>
                  </div>
                )}

                {/* Glass gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                {/* Floating badge */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/10 text-white/90 text-xs">
                    Immersive Player
                  </div>
                  <div className="px-3 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/10 text-white/90 text-xs">
                    {formatTime(duration)}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                  {title || "Generated Song"}
                </h1>
                <p className="mt-2 text-white/75 text-lg">AI Generated Music</p>

                <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <button
                    onClick={onTryNext}
                    className="px-5 py-2.5 rounded-full bg-black/25 hover:bg-black/40 border border-white/15 hover:border-white/25 text-white transition-all duration-200 hover:scale-[1.02]"
                  >
                    Try Next
                  </button>

                  <button
                    onClick={() => {
                      const a = audioRef.current;
                      if (!a) return;
                      a.currentTime = 0;
                      setCurrentTime(0);
                    }}
                    className="px-5 py-2.5 rounded-full bg-black/25 hover:bg-black/40 border border-white/15 hover:border-white/25 text-white transition-all duration-200 hover:scale-[1.02]"
                  >
                    Restart
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right: lyrics panel */}
            <AnimatePresence>
              {showLyrics && lyrics && (
                <motion.div
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  transition={{ duration: 0.35 }}
                  className="hidden lg:block"
                >
                  <div
                    className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-y-auto"
                    style={{ height: "calc(100vh - 230px)" }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
                        Lyrics
                      </h3>
                      <div className="text-white/60 text-xs">Tip: press “L”</div>
                    </div>

                    <div className="space-y-5 px-1">
                      {lyricsLines.map((line, idx) => {
                        const isActive = idx === currentLineIndex;
                        const isPast = idx < currentLineIndex;
                        return (
                          <div
                            key={line.id}
                            className={[
                              "transition-all duration-300",
                              line.isSection
                                ? "text-yellow-300 text-xl font-bold text-center tracking-wide mt-6"
                                : isActive
                                ? "text-white text-xl font-semibold scale-[1.02]"
                                : isPast
                                ? "text-white/70 text-lg"
                                : "text-white/45 text-lg",
                            ].join(" ")}
                            style={{
                              fontFamily: line.isSection ? "Georgia, serif" : "system-ui, -apple-system, sans-serif",
                              lineHeight: 1.6,
                            }}
                          >
                            {line.text.replace(/^\[|\]$/g, "")}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* AUDIO */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
        hidden
      />

      {/* Bottom controls */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-5 bg-black/30 backdrop-blur-xl border-t border-white/10">
        <div className="mx-auto max-w-5xl">
          {/* progress */}
          <div className="flex items-center gap-3 text-white/80 text-sm mb-3">
            <span className="tabular-nums w-[52px]">{formatTime(currentTime)}</span>

            <div
              ref={progressTrackRef}
              className="relative flex-1 h-2 rounded-full bg-white/15 cursor-pointer"
              onMouseDown={(e) => seekToClientX(e.clientX)}
              onMouseMove={(e) => {
                if (e.buttons === 1) seekToClientX(e.clientX);
              }}
              // ✅ A11Y: satisfy role="slider" requirements
              role="slider"
              tabIndex={0}
              aria-label="Seek"
              aria-valuemin={ariaMin}
              aria-valuemax={ariaMax}
              aria-valuenow={ariaNow}
              aria-valuetext={ariaText}
              onKeyDown={(e) => {
                const a = audioRef.current;
                if (!a || !duration) return;

                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  a.currentTime = Math.max(0, (a.currentTime || 0) - 5);
                  setCurrentTime(a.currentTime);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  a.currentTime = Math.min(duration, (a.currentTime || 0) + 5);
                  setCurrentTime(a.currentTime);
                } else if (e.key === "Home") {
                  e.preventDefault();
                  a.currentTime = 0;
                  setCurrentTime(0);
                } else if (e.key === "End") {
                  e.preventDefault();
                  a.currentTime = duration;
                  setCurrentTime(duration);
                }
              }}
            >
              <div
                className="absolute left-0 top-0 h-2 rounded-full"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: colorsExtracted ? rgbString(sec) : "rgb(59, 130, 246)",
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg"
                style={{
                  left: `calc(${progressPct}% - 8px)`,
                  backgroundColor: "white",
                  opacity: duration ? 1 : 0.6,
                }}
              />
            </div>

            <span className="tabular-nums w-[52px] text-right">{formatTime(duration)}</span>
          </div>

          {/* buttons row */}
          <div className="flex items-center justify-between gap-4">
            {/* Left: volume */}
            <div className="flex items-center gap-3 min-w-[190px]">
              <button
                onClick={() => setMuted((v) => !v)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition"
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M16.5 12l4.5 4.5-1.5 1.5L15 13.5l-4.5 4.5H8v-6H3v-2h5V4h2.5L15 8.5l4.5-4.5 1.5 1.5L16.5 12z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (v > 0) setMuted(false);
                }}
                className="w-[120px] accent-white"
                aria-label="Volume"
              />

              <span className="text-white/70 text-xs tabular-nums w-[42px]">
                {Math.round((muted ? 0 : volume) * 100)}%
              </span>
            </div>

            {/* Center: play */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  const a = audioRef.current;
                  if (!a) return;
                  a.currentTime = Math.max(0, (a.currentTime || 0) - 5);
                  setCurrentTime(a.currentTime);
                }}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition"
                title="Back 5s"
              >
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6a6 6 0 01-6 6 6 6 0 01-5.65-4H4.26A8 8 0 0012 21a8 8 0 000-16z" />
                </svg>
              </button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-[1.03] transition shadow-xl"
                title="Play / Pause (Space)"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6 fill-black" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 fill-black ml-1" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => {
                  const a = audioRef.current;
                  if (!a) return;
                  a.currentTime = Math.min(duration || a.currentTime, (a.currentTime || 0) + 5);
                  setCurrentTime(a.currentTime);
                }}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition"
                title="Forward 5s"
              >
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6a6 6 0 006 6 6 6 0 005.65-4h2.09A8 8 0 0112 21a8 8 0 010-16z" />
                </svg>
              </button>
            </div>

            {/* Right: quick actions */}
            <div className="flex items-center justify-end gap-3 min-w-[190px]">
              <button
                onClick={onTryNext}
                className="px-4 py-2 rounded-full bg-black/25 hover:bg-black/40 border border-white/15 hover:border-white/25 text-white transition-all duration-200 hover:scale-[1.02]"
              >
                Next
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-full bg-black/25 hover:bg-black/40 border border-white/15 hover:border-white/25 text-white transition-all duration-200 hover:scale-[1.02]"
              >
                Close
              </button>
            </div>
          </div>

          {/* mobile lyrics toggle hint */}
          {lyrics && (
            <div className="mt-3 text-center text-white/55 text-xs lg:hidden">
              Lyrics are best on desktop • Press <span className="text-white/80">L</span> to toggle
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

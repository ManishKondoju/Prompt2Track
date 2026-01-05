// GeneratedAudios.jsx
import { useEffect, useMemo, useRef, useState } from "react";

// ---------- Helpers ----------
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}
function extOf(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toUpperCase() : "AUDIO";
}
function baseName(name) {
  return name.replace(/\.[^.]+$/, "");
}
function prettifyFileName(name) {
  // "lofi_chill-sunset 01" -> "Lofi Chill Sunset 01"
  return baseName(name)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}
function gradientFor(key) {
  const a = hashHue(key);
  const b = (a + 36) % 360;
  return `linear-gradient(135deg, hsla(${a},92%,62%,0.24), hsla(${b},92%,62%,0.10))`;
}

// ✅ Auto-load ALL audio files in src/assets (CRA/Webpack)
// If this file is in src/components, change "./assets" -> "../assets"
function loadAssetAudios() {
  try {
    // eslint-disable-next-line global-require
    const ctx = require.context("./assets/audios", false, /\.(mp3|wav|ogg|m4a)$/i);
    const keys = ctx.keys();

    return keys
      .map((k) => {
        const file = k.replace("./", "");
        return {
          id: `asset-${file}`,
          file,
          url: ctx(k),
          title: prettifyFileName(file),
          format: extOf(file),
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  } catch (e) {
    return [];
  }
}

export default function GeneratedAudios() {
  const audioRef = useRef(null);

  const tracks = useMemo(() => loadAssetAudios(), []);
  const [activeId, setActiveId] = useState(tracks[0]?.id || null);
  const activeTrack = useMemo(
    () => tracks.find((t) => t.id === activeId) || tracks[0] || null,
    [tracks, activeId]
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);

  // Keep volume in sync
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // When switching tracks, preserve play intent
  useEffect(() => {
    setCurrent(0);
    setDuration(0);

    const a = audioRef.current;
    if (!a) return;

    if (isPlaying) {
      const p = a.play();
      if (p?.catch) p.catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;

    if (a.paused) {
      const p = a.play();
      setIsPlaying(true);
      if (p?.catch) p.catch(() => setIsPlaying(false));
    } else {
      a.pause();
      setIsPlaying(false);
    }
  };

  const playTrack = (id) => {
    if (!tracks.length) return;

    if (id === activeId) {
      togglePlay();
      return;
    }
    setActiveId(id);

    // autoplay after source updates
    setTimeout(() => {
      const a = audioRef.current;
      if (!a) return;
      const p = a.play();
      setIsPlaying(true);
      if (p?.catch) p.catch(() => setIsPlaying(false));
    }, 0);
  };

  const seekTo = (t) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const next = clamp(Number(t), 0, duration);
    a.currentTime = next;
    setCurrent(next);
  };

  const goPrev = () => {
    if (!tracks.length) return;
    const idx = tracks.findIndex((t) => t.id === activeId);
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length];
    if (prev) setActiveId(prev.id);
  };

  const goNext = () => {
    if (!tracks.length) return;
    const idx = tracks.findIndex((t) => t.id === activeId);
    const next = tracks[(idx + 1) % tracks.length];
    if (next) setActiveId(next.id);
  };

  const onEnded = () => {
    setIsPlaying(false);
    goNext();
  };

  const progressPct = duration ? (current / duration) * 100 : 0;

  return (
    <section className="w-full max-w-6xl mx-auto px-6 pb-10">
      {/* Header */}
      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Your Generated Library
          </h3>
          <p className="text-white/60 mt-1">
            Auto-loaded from <span className="text-white/80">src/assets</span> — play anything instantly.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-white/50">
          <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            Local files
          </span>
          <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            Premium UI
          </span>
        </div>
      </div>

      {/* Empty state */}
      {!tracks.length && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 text-white/70">
          <div className="text-xl font-bold text-white">No audio files found.</div>
          <div className="mt-2 text-sm text-white/60">
            Put <span className="text-white/85">.mp3 / .wav / .ogg / .m4a</span> files inside{" "}
            <span className="text-white/85">client/src/assets</span>.
          </div>
          <div className="mt-4 text-xs text-white/50">
            If you placed this component in <span className="text-white/75">src/components</span>, update the assets path:
            <span className="text-white/75"> require.context("../assets", ...)</span>
          </div>
        </div>
      )}

      {!!tracks.length && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          {/* Track list */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="text-white/85 text-sm font-semibold">Library</div>
              <div className="text-white/40 text-xs">{tracks.length} tracks</div>
            </div>

            <div className="divide-y divide-white/5">
              {tracks.map((t) => {
                const active = t.id === activeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => playTrack(t.id)}
                    className={[
                      "w-full text-left px-6 py-5 flex items-center gap-4 transition-all",
                      "hover:bg-white/[0.06] focus:outline-none",
                      active ? "bg-white/[0.06]" : "",
                    ].join(" ")}
                  >
                    {/* Play badge */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                      style={{ background: gradientFor(t.file) }}
                    >
                      {active && isPlaying ? (
                        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={["font-extrabold truncate", active ? "text-white" : "text-white/90"].join(" ")}>
                          {t.title}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 border border-white/10 text-white/60">
                          {t.format}
                        </span>
                      </div>

                      <div className="mt-1 text-white/50 text-sm truncate">{t.file}</div>

                      {/* micro meta */}
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-white/45">
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">Local</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">Assets</span>
                      </div>
                    </div>

                    {/* Active dot */}
                    <div className="shrink-0">
                      <div
                        className={[
                          "w-2.5 h-2.5 rounded-full",
                          active
                            ? "bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.45)]"
                            : "bg-white/20",
                        ].join(" ")}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Now Playing */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10">
              <div className="text-white/85 text-sm font-semibold">Now Playing</div>
            </div>

            <div className="p-6">
              <div
                className="rounded-3xl p-5 border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
                style={{ background: gradientFor(activeTrack?.file || "x") }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white text-lg font-extrabold truncate">{activeTrack?.title || "Track"}</div>
                    <div className="text-white/60 text-sm truncate">{activeTrack?.file || ""}</div>
                  </div>

                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-[1.03] transition"
                    title="Play / Pause"
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 fill-black ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span className="tabular-nums">{formatTime(current)}</span>
                    <span className="tabular-nums">{formatTime(duration)}</span>
                  </div>

                  <div className="mt-2">
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      value={current}
                      onChange={(e) => seekTo(e.target.value)}
                      className="w-full accent-white"
                      aria-label="Seek"
                    />
                    <div className="mt-2 h-2 rounded-full bg-white/15 overflow-hidden">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${progressPct}%`, backgroundColor: "rgba(255,255,255,0.85)" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Volume */}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => setMuted((m) => !m)}
                    className="w-10 h-10 rounded-full bg-black/25 hover:bg-black/35 border border-white/10 flex items-center justify-center transition"
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
                    className="flex-1 accent-white"
                    aria-label="Volume"
                  />

                  <div className="text-xs text-white/70 tabular-nums w-12 text-right">
                    {Math.round((muted ? 0 : volume) * 100)}%
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  onClick={goPrev}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/85 transition"
                >
                  Prev
                </button>
                <button
                  onClick={goNext}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/85 transition"
                >
                  Next
                </button>
              </div>

              {/* Audio element */}
              <audio
                ref={audioRef}
                src={activeTrack?.url || undefined}
                onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                onEnded={onEnded}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                hidden
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
